// ============ 套餐 API ============
// 对应后端 PackageController

import type { Package } from '@cloud-farm/shared';
import { del, get, patch, post } from '../http';

/** 列表 - 默认只返 active(C 端用) */
export function listPackages(opts?: { includeArchived?: boolean }): Promise<Package[]> {
  const qs = opts?.includeArchived ? '?includeArchived=true' : '';
  return get<Package[]>(`/packages${qs}`);
}

/** 单个 */
export function getPackage(id: string): Promise<Package> {
  return get<Package>(`/packages/${id}`);
}

// ============ admin 写 ============
export interface PackageInput {
  name: string;
  area: number;
  price: number;
  tag: string;
  cover: string;
  gallery: string[];
  highlights: string[];
  crops: string[];
  sortOrder?: number;
  status?: 'active' | 'archived';
}

export interface PackageCreate extends PackageInput {
  id: string;
}

export function createPackage(input: PackageCreate): Promise<Package> {
  return post<Package>('/packages', input);
}

export function updatePackage(id: string, input: PackageInput): Promise<Package> {
  return patch<Package>(`/packages/${id}`, input);
}

export function setPackageStatus(id: string, status: 'active' | 'archived'): Promise<Package> {
  return patch<Package>(`/packages/${id}/status`, { status });
}

export function deletePackage(id: string): Promise<{ ok: true }> {
  return del<{ ok: true }>(`/packages/${id}`);
}
