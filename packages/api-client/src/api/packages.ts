// ============ 套餐 API ============
// 对应后端 PackageController:GET /api/packages, GET /api/packages/:id

import type { Package } from '@cloud-farm/shared';
import { get } from '../http';

/** 列表 - 所有 active 套餐 */
export function listPackages(): Promise<Package[]> {
  return get<Package[]>('/packages');
}

/** 单个 */
export function getPackage(id: string): Promise<Package> {
  return get<Package>(`/packages/${id}`);
}
