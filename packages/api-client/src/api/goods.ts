// ============ 农产品商城 API(M-08)============
import type { Goods } from '@cloud-farm/shared';
import { get } from '../http';

/** 商品列表(可按 category 过滤:fresh/processed/box/around) */
export function listGoods(category?: string): Promise<Goods[]> {
  return get<Goods[]>(`/goods${category ? '?category=' + encodeURIComponent(category) : ''}`);
}

/** 商品详情(含 SKU) */
export function getGoods(id: string): Promise<Goods> {
  return get<Goods>(`/goods/${id}`);
}
