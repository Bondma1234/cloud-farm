// ============ Admin · 订单 + 指令工单 + 用户 管理 API ============
import type { Command } from '@cloud-farm/shared';
import { get, patch } from '../http';

// ============ 用户管理(P8 W2) ============
export interface AdminUserItem {
  id: number;
  phone: string;        // 脱敏后
  nickname: string;
  avatar: string;
  level: string;
  role: 'customer' | 'agronomist' | 'cs' | 'operator' | 'admin';
  active: boolean;
  createdAt: string;
  orderCount: number;
}

export interface AdminUserListQuery {
  role?: string;
  q?: string;
}

export function listAdminUsers(query?: AdminUserListQuery): Promise<AdminUserItem[]> {
  const params = new URLSearchParams();
  if (query?.role) params.set('role', query.role);
  if (query?.q) params.set('q', query.q);
  const qs = params.toString();
  return get<AdminUserItem[]>(`/admin/users${qs ? '?' + qs : ''}`);
}

export function setAdminUserRole(id: number, role: AdminUserItem['role']): Promise<AdminUserItem> {
  return patch<AdminUserItem>(`/admin/users/${id}/role`, { role });
}

export function setAdminUserActive(id: number, active: boolean): Promise<AdminUserItem> {
  return patch<AdminUserItem>(`/admin/users/${id}/status`, { active });
}

// ============ 看板聚合(P8 W2) ============
export interface AdminStatKV { label: string; value: number; }
export interface AdminGmvPoint { date: string; gmv: number; orderCount: number; }
export interface AdminPackageRank { id: string; name: string; orderCount: number; gmv: number; }
export interface AdminStats {
  totals: { userCount: number; orderCount: number; gmvAll: number; commandPending: number };
  userByRole: AdminStatKV[];
  orderByStatus: AdminStatKV[];
  commandByStatus: AdminStatKV[];
  gmv30d: AdminGmvPoint[];
  packageTop: AdminPackageRank[];
  cameraOnline: { online: number; total: number; rate: number };
}

export function getAdminStats(): Promise<AdminStats> {
  return get<AdminStats>('/admin/stats');
}

// ============ 错误日志(P8 W2) ============
export interface AdminErrorLog {
  id: number;
  source: string;
  message: string;
  stack: string;
  url: string;
  userAgent: string;
  userId?: number;
  at: string;
}

export function listAdminErrorLogs(source?: string): Promise<AdminErrorLog[]> {
  const qs = source ? `?source=${encodeURIComponent(source)}` : '';
  return get<AdminErrorLog[]>(`/admin/error-logs${qs}`);
}

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

// ============ Admin · 指令工单 ============
export interface AdminCommandListQuery {
  status?: string;        // pending / executing / completed / rejected
  plotId?: string;
  type?: string;          // water / fertilize / weed / shoot / pest / plant
}

export function listAdminCommands(query?: AdminCommandListQuery): Promise<Command[]> {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.plotId) params.set('plotId', query.plotId);
  if (query?.type) params.set('type', query.type);
  const qs = params.toString();
  return get<Command[]>(`/admin/commands${qs ? '?' + qs : ''}`);
}

/** 农技员接单(pending → executing,server 记录当前用户为 by) */
export function acceptCommand(id: string): Promise<Command> {
  return patch<Command>(`/admin/commands/${id}/accept`, {});
}

/** 农技员完成工单(executing → completed,带回执照片 URL,自动写 JournalEntry) */
export function completeCommand(id: string, photo: string, note?: string): Promise<Command> {
  return patch<Command>(`/admin/commands/${id}/complete`, { photo, note });
}
