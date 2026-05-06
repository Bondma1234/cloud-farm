// ============ 订单 API ============
import type { Order } from '@cloud-farm/shared';
import { get } from '../http';

/** 当前用户的订单列表(可按 status 过滤) */
export function listOrders(status?: string): Promise<Order[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return get<Order[]>(`/orders${qs}`);
}

/** 订单详情 */
export function getOrder(id: string): Promise<Order> {
  return get<Order>(`/orders/${id}`);
}
