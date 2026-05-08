// ============ Admin · 订单管理 API ============
import { get, patch } from '../http';

export interface AdminOrderListItem {
  id: string;
  userId: number;
  userPhone?: string;     // 脱敏后
  userNickname?: string;
  type: string;
  title: string;
  cover: string;
  price: number;
  status: string;
  statusLabel: string;
  date: string;
  packageId?: string;
}

export interface AdminOrderListQuery {
  status?: string;
  userId?: string | number;
  q?: string;             // 搜索 id / 标题
}

export function listAdminOrders(query?: AdminOrderListQuery): Promise<AdminOrderListItem[]> {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.userId !== undefined) params.set('userId', String(query.userId));
  if (query?.q) params.set('q', query.q);
  const qs = params.toString();
  return get<AdminOrderListItem[]>(`/admin/orders${qs ? '?' + qs : ''}`);
}

export function setAdminOrderStatus(id: string, status: string): Promise<AdminOrderListItem> {
  return patch<AdminOrderListItem>(`/admin/orders/${id}/status`, { status });
}
