// ============ 用户 API ============
import type { User, Address } from '@cloud-farm/shared';
import { get } from '../http';

/** 当前登录用户 */
export function getMe(): Promise<User> {
  return get<User>('/users/me');
}

/** 当前用户地址列表 */
export function listMyAddresses(): Promise<Address[]> {
  return get<Address[]>('/users/me/addresses');
}
