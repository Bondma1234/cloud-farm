// ============ 用户 API ============
import type { User, Address } from '@cloud-farm/shared';
import { del, get, patch, post } from '../http';

/** 当前登录用户 */
export function getMe(): Promise<User> {
  return get<User>('/users/me');
}

/** 当前用户地址列表 */
export function listMyAddresses(): Promise<Address[]> {
  return get<Address[]>('/users/me/addresses');
}

/** 创建地址入参(phone 是真实手机号,不脱敏) */
export interface AddressInput {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  tag?: string;
  isDefault?: boolean;
}

export function createAddress(input: AddressInput): Promise<Address> {
  return post<Address>('/users/me/addresses', input);
}

export function updateAddress(id: string, input: AddressInput): Promise<Address> {
  return patch<Address>(`/users/me/addresses/${id}`, input);
}

export function deleteAddress(id: string): Promise<{ ok: true }> {
  return del<{ ok: true }>(`/users/me/addresses/${id}`);
}
