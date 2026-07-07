// ============ 订单 API ============
import type { Order } from '@cloud-farm/shared';
import { get, patch, post } from '../http';

/** 当前用户的订单列表(可按 status 过滤) */
export function listOrders(status?: string): Promise<Order[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return get<Order[]>(`/orders${qs}`);
}

/** 订单详情 */
export function getOrder(id: string): Promise<Order> {
  return get<Order>(`/orders/${id}`);
}

/** 创建认养订单入参 */
export interface CreateOrderInput {
  packageId: string;
  plotId: string;
  crops: string[];
  addressId: string;
  stake?: string;
  couponId?: string;   // P8 B: 使用的优惠券(UserCoupon.id)
}

/** 创建订单(自动锁地块,30 分钟内未付款由 P5+ 定时任务释放) */
export function createOrder(input: CreateOrderInput): Promise<Order> {
  return post<Order>('/orders', input);
}

/** 创建商城订单入参(M-08) */
export interface CreateShopOrderInput {
  items: { skuId: string; qty: number }[];
  addressId: string;
  couponId?: string;
}

/** 创建农产品商城订单(type=产地直送,扣库存 + 冷链运费) */
export function createShopOrder(input: CreateShopOrderInput): Promise<Order> {
  return post<Order>('/orders/shop', input);
}

/** 取消订单(待付款 / 待发货可取消) */
export function cancelOrder(id: string): Promise<Order> {
  return patch<Order>(`/orders/${id}/cancel`);
}

/**
 * 支付订单(MVP mock,认养类直接 → growing,产地直送 → shipped)
 * P5+ 真接入微信支付:前端只调 prepay 拿 jsapi 参数,真实支付走 wx.requestPayment
 */
export function payOrder(id: string): Promise<Order> {
  return post<Order>(`/orders/${id}/pay`, {});
}
