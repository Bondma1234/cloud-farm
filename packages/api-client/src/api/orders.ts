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
}

/** 创建订单(自动锁地块,30 分钟内未付款由 P5+ 定时任务释放) */
export function createOrder(input: CreateOrderInput): Promise<Order> {
  return post<Order>('/orders', input);
}

/** 取消订单(待付款 / 待发货可取消) */
export function cancelOrder(id: string): Promise<Order> {
  return patch<Order>(`/orders/${id}/cancel`);
}
