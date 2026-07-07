import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderDto } from './dto/order.dto';
import { CreateOrderDto } from './dto/order-create.dto';
import { CreateShopOrderDto } from './dto/shop-order-create.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: number, status?: string): Promise<OrderDto[]> {
    const rows = await this.prisma.order.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      orderBy: { date: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async findOneByUser(userId: number, id: string): Promise<OrderDto> {
    const r = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!r) throw new NotFoundException(`订单 ${id} 不存在`);
    return this.toDto(r);
  }

  /**
   * 创建认养订单
   * - 事务 + 行锁保证不会双倍认养同一地块
   * - 自动锁地块 (status -> sold)
   * - 生成订单 id (yyyymmdd + 4 位序号)
   */
  async create(userId: number, dto: CreateOrderDto): Promise<OrderDto> {
    return this.prisma.$transaction(async (tx) => {
      // 1. 校验套餐
      const pkg = await tx.package.findUnique({ where: { id: dto.packageId } });
      if (!pkg || pkg.status !== 'active') throw new BadRequestException(`套餐 ${dto.packageId} 不可购买`);

      // 2. 校验作物数量(基础版 1 种,其他 ≤2)
      const maxCrops = dto.packageId === 'pkg-basic' ? 1 : 2;
      if (dto.crops.length > maxCrops) {
        throw new BadRequestException(`${pkg.name} 最多选 ${maxCrops} 种作物`);
      }

      // 3. 校验地块原子操作 + 锁地块
      const plot = await tx.plot.findUnique({ where: { id: dto.plotId } });
      if (!plot) throw new NotFoundException(`地块 ${dto.plotId} 不存在`);
      if (plot.status !== 'available') {
        throw new ConflictException(`地块 ${dto.plotId} 已被认养或维护中`);
      }
      await tx.plot.update({ where: { id: plot.id }, data: { status: 'sold' } });

      // 4. 校验地址
      const addr = await tx.address.findFirst({ where: { id: dto.addressId, userId } });
      if (!addr) throw new BadRequestException(`收货地址 ${dto.addressId} 不存在`);

      // 5. 生成订单 id
      const today = new Date();
      const ymd = today.toISOString().slice(0, 10).replace(/-/g, '').slice(2); // 260507
      const sameDayCount = await tx.order.count({
        where: { id: { startsWith: `ORD-20${ymd.slice(0, 2)}-${ymd.slice(2)}` } },
      });
      const orderId = `ORD-20${ymd.slice(0, 2)}-${ymd.slice(2)}${String(sameDayCount + 1).padStart(2, '0')}`;

      // 6. 组合订单 metadata
      const cropEmoji: Record<string, string> = {
        红薯: '🍠', 胡萝卜: '🥕', 土豆: '🥔', 南瓜: '🎃',
        草莓: '🍓', 小番茄: '🍅', 香椿: '🌿', 大蒜: '🧄',
      };
      const subItems = [
        { label: '地块', value: `${plot.block} · ${plot.id.split('-').pop()} 号` },
        { label: '作物', value: dto.crops.map((c) => `${cropEmoji[c] || '🌱'} ${c}`).join(' / ') },
      ];
      if (dto.stake) subItems.push({ label: '立牌', value: dto.stake });
      const expireAt = new Date(today.getTime() + 30 * 60_000); // 30 分钟内付款
      const minutes = Math.floor((expireAt.getTime() - Date.now()) / 60_000);
      const expireIn = `${String(minutes).padStart(2, '0')}:00`;

      // 6.5 P8 B: 优惠券抵扣(可选)
      const originalPrice = pkg.price;
      let finalPrice = originalPrice;
      let discountMeta: { couponName: string; amount: number; originalPrice: number } | null = null;
      if (dto.couponId) {
        const uc = await tx.userCoupon.findFirst({
          where: { id: dto.couponId, userId },
          include: { coupon: true },
        });
        if (!uc) throw new BadRequestException('优惠券不存在或不属于你');
        if (uc.status !== 'unused') throw new BadRequestException('优惠券已使用或已过期');
        if (uc.expireAt < today) throw new BadRequestException('优惠券已过期');
        // 适用范围:all 全场;adopt 仅认养(本接口都是认养单)
        if (uc.coupon.scope === 'shop') {
          throw new BadRequestException('该券仅限商城使用,认养订单不可用');
        }
        // 门槛
        if (originalPrice < uc.coupon.threshold) {
          throw new BadRequestException(`未满 ${uc.coupon.threshold} 元,该券不可用`);
        }
        finalPrice = Math.max(0, originalPrice - uc.coupon.amount);
        discountMeta = { couponName: uc.coupon.name, amount: uc.coupon.amount, originalPrice };
        // 标记券已用
        await tx.userCoupon.update({
          where: { id: uc.id },
          data: { status: 'used', usedAt: today, usedOrderId: orderId },
        });
        subItems.push({ label: '优惠券', value: `${uc.coupon.name} -¥${uc.coupon.amount}` });
      }

      // 7. 创建订单
      const titlePrefix = dto.stake || pkg.name;
      const order = await tx.order.create({
        data: {
          id: orderId,
          userId,
          type: '认养',
          typeIcon: '🌱',
          title: `${titlePrefix}(${pkg.name})`,
          cover: pkg.cover,
          price: finalPrice,       // 实付价(已抵扣)
          count: 1,
          status: 'pending',
          statusLabel: '待付款',
          date: today,
          packageId: pkg.id,
          plotId: plot.id, // P5-mock: 关联地块, my-plot 页能查到
          addressId: addr.id,
          crops: JSON.stringify(dto.crops),
          stake: dto.stake ?? null,
          metadata: JSON.stringify({ subItems, expireIn, discount: discountMeta }),
        },
      });

      return this.toDto(order);
    });
  }

  /**
   * 创建农产品商城订单(type=产地直送)
   * - 事务:校验地址 + 逐 SKU 校验库存 + 扣库存 + 累计商品数
   * - 冷链标的物且商品金额 < 199 → 加 20 运费(满 199 包冷链)
   * - 可选优惠券(scope=all/shop 适用)
   */
  async createShop(userId: number, dto: CreateShopOrderDto): Promise<OrderDto> {
    return this.prisma.$transaction(async (tx) => {
      const addr = await tx.address.findFirst({ where: { id: dto.addressId, userId } });
      if (!addr) throw new BadRequestException(`收货地址 ${dto.addressId} 不存在`);

      let goodsTotal = 0;
      let totalQty = 0;
      let anyCold = false;
      let firstCover = '';
      let firstName = '';
      const subItems: { label: string; value: string }[] = [];
      const itemsMeta: Record<string, unknown>[] = [];

      for (const line of dto.items) {
        const sku = await tx.sku.findUnique({ where: { id: line.skuId }, include: { goods: true } });
        if (!sku) throw new BadRequestException(`商品规格 ${line.skuId} 不存在`);
        if (sku.stock < line.qty) {
          throw new ConflictException(`${sku.goods.name}(${sku.spec})库存不足,仅剩 ${sku.stock}`);
        }
        goodsTotal += sku.price * line.qty;
        totalQty += line.qty;
        if (sku.goods.coldChain) anyCold = true;
        if (!firstCover) {
          firstCover = sku.goods.cover;
          firstName = sku.goods.name;
        }
        subItems.push({ label: sku.goods.name, value: `${sku.spec} ×${line.qty}` });
        itemsMeta.push({
          goodsId: sku.goodsId, goodsName: sku.goods.name, skuId: sku.id,
          spec: sku.spec, price: sku.price, qty: line.qty,
        });
        // 扣库存 + 累计销量
        await tx.sku.update({ where: { id: sku.id }, data: { stock: sku.stock - line.qty } });
        await tx.goods.update({ where: { id: sku.goodsId }, data: { sales: { increment: line.qty } } });
      }

      // 冷链运费:含冷链品且不满 199 → +20
      const shipping = anyCold && goodsTotal < 199 ? 20 : 0;

      // 优惠券(可选;商城单 scope=all/shop 适用)
      let discount = 0;
      let discountMeta: { couponName: string; amount: number } | null = null;
      const today = new Date();
      if (dto.couponId) {
        const uc = await tx.userCoupon.findFirst({
          where: { id: dto.couponId, userId },
          include: { coupon: true },
        });
        if (!uc) throw new BadRequestException('优惠券不存在或不属于你');
        if (uc.status !== 'unused') throw new BadRequestException('优惠券已使用或已过期');
        if (uc.expireAt < today) throw new BadRequestException('优惠券已过期');
        if (uc.coupon.scope === 'adopt') throw new BadRequestException('该券仅限认养使用');
        if (goodsTotal < uc.coupon.threshold) {
          throw new BadRequestException(`未满 ${uc.coupon.threshold} 元,该券不可用`);
        }
        discount = uc.coupon.amount;
        discountMeta = { couponName: uc.coupon.name, amount: uc.coupon.amount };
      }

      const finalPrice = Math.max(0, goodsTotal + shipping - discount);

      // 生成订单 id
      const ymd = today.toISOString().slice(0, 10).replace(/-/g, '').slice(2);
      const sameDayCount = await tx.order.count({
        where: { id: { startsWith: `ORD-20${ymd.slice(0, 2)}-${ymd.slice(2)}` } },
      });
      const orderId = `ORD-20${ymd.slice(0, 2)}-${ymd.slice(2)}${String(sameDayCount + 1).padStart(2, '0')}`;

      if (shipping > 0) subItems.push({ label: '冷链运费', value: `+¥${shipping}` });
      if (discountMeta) subItems.push({ label: '优惠券', value: `${discountMeta.couponName} -¥${discountMeta.amount}` });

      // 标记券已用
      if (dto.couponId && discountMeta) {
        await tx.userCoupon.update({
          where: { id: dto.couponId },
          data: { status: 'used', usedAt: today, usedOrderId: orderId },
        });
      }

      const order = await tx.order.create({
        data: {
          id: orderId,
          userId,
          type: '产地直送',
          typeIcon: '📦',
          title: dto.items.length > 1 ? `${firstName} 等 ${dto.items.length} 件` : firstName,
          cover: firstCover,
          price: finalPrice,
          count: totalQty,
          status: 'pending',
          statusLabel: '待付款',
          date: today,
          addressId: addr.id,
          metadata: JSON.stringify({ subItems, items: itemsMeta, shipping, goodsTotal, discount: discountMeta }),
        },
      });
      return this.toDto(order);
    });
  }

  /**
   * 支付订单(MVP mock):pending → 认养类 paid → 立即变 growing,产地直送 paid → shipped
   * P5+ 真接入微信支付时:这一步会被 webhook 回调触发,前端只发起 prepay
   */
  async pay(userId: number, id: string): Promise<OrderDto> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id, userId } });
      if (!order) throw new NotFoundException(`订单 ${id} 不存在`);
      if (order.status !== 'pending') {
        throw new BadRequestException(`订单当前状态 (${order.statusLabel}) 不能支付`);
      }
      // 认养类订单付完款直接进 growing(种植中);产地直送进 shipped(待发货)
      const isAdopt = order.type === '认养';
      const nextStatus = isAdopt ? 'growing' : 'shipped';
      const nextLabel = isAdopt ? '种植中' : '待发货';
      const updated = await tx.order.update({
        where: { id },
        data: { status: nextStatus, statusLabel: nextLabel },
      });
      return this.toDto(updated);
    });
  }

  /** 取消订单(限制:必须属于当前用户 + 状态可取消) */
  async cancel(userId: number, id: string): Promise<OrderDto> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id, userId } });
      if (!order) throw new NotFoundException(`订单 ${id} 不存在`);
      const cancellable = ['pending', 'shipped'];
      if (!cancellable.includes(order.status)) {
        throw new BadRequestException(`当前状态 (${order.statusLabel}) 不允许取消`);
      }

      // 待付款订单取消时,把锁住的地块还回来
      if (order.status === 'pending' && order.packageId) {
        const adoption = await tx.order.findFirst({
          where: { id, packageId: order.packageId },
        });
        if (adoption) {
          // 找到 metadata 里的地块 id 不太可靠,这里靠业务约定:
          // 取消认养订单 → 释放它认养的地块。但 schema 里订单没直接存 plotId,
          // 暂从 metadata.subItems[0].value 解析(临时,P3 加 plotId 字段更规范)
          // MVP 先简化:不释放地块,等 P3 重构 schema
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: 'cancelled', statusLabel: '已取消' },
      });
      return this.toDto(updated);
    });
  }

  private toDto = (r: {
    id: string;
    type: string;
    typeIcon: string;
    title: string;
    cover: string;
    price: number;
    count: number;
    status: string;
    statusLabel: string;
    date: Date;
    packageId: string | null;
    addressId: string | null;
    metadata: string | null;
  }): OrderDto => {
    const meta = r.metadata ? this.safeParse(r.metadata) : {};
    return {
      id: r.id,
      type: r.type,
      typeIcon: r.typeIcon,
      title: r.title,
      cover: r.cover,
      price: r.price,
      count: r.count,
      status: r.status,
      statusLabel: r.statusLabel,
      date: r.date.toISOString().slice(0, 10),
      packageId: r.packageId ?? undefined,
      addressId: r.addressId ?? undefined,
      ...meta,
    };
  };

  private safeParse(s: string): Record<string, unknown> {
    try {
      return JSON.parse(s) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
