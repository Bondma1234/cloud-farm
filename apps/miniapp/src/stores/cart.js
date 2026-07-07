// ============ 购物车 store(M-08)============
// 纯客户端(localStorage 持久化),不上后端 —— 结算时才把选中项发给 POST 下单接口。
// 一行 = 一个 SKU;同 SKU 再加只加数量。最多 20 个不同 SKU(PRD §4.3.5)。
import { defineStore } from 'pinia';

const KEY = 'cloud-farm:cart';
const MAX_LINES = 20;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: load(), // [{ goodsId, goodsName, cover, skuId, spec, price, coldChain, qty }]
  }),
  getters: {
    count: (s) => s.items.reduce((n, it) => n + it.qty, 0),
    lineCount: (s) => s.items.length,
    totalPrice: (s) => s.items.reduce((n, it) => n + it.price * it.qty, 0),
    hasColdChain: (s) => s.items.some((it) => it.coldChain),
    isEmpty: (s) => s.items.length === 0,
  },
  actions: {
    _persist() {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.items));
      } catch {
        /* localStorage 满 / 隐私模式,忽略 */
      }
    },
    /** 加购:goods 是详情对象,sku 是选中规格 */
    add(goods, sku, qty = 1) {
      const exist = this.items.find((it) => it.skuId === sku.id);
      if (exist) {
        exist.qty = Math.min(exist.qty + qty, sku.stock || 99);
      } else {
        if (this.items.length >= MAX_LINES) return { ok: false, reason: `购物车最多 ${MAX_LINES} 种商品` };
        this.items.push({
          goodsId: goods.id,
          goodsName: goods.name,
          cover: goods.cover,
          skuId: sku.id,
          spec: sku.spec,
          price: sku.price,
          coldChain: goods.coldChain,
          qty: Math.min(qty, sku.stock || 99),
        });
      }
      this._persist();
      return { ok: true };
    },
    setQty(skuId, qty) {
      const it = this.items.find((x) => x.skuId === skuId);
      if (!it) return;
      it.qty = Math.max(1, qty);
      this._persist();
    },
    remove(skuId) {
      this.items = this.items.filter((it) => it.skuId !== skuId);
      this._persist();
    },
    clear() {
      this.items = [];
      this._persist();
    },
  },
});
