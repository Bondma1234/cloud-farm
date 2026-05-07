// ============ 作物百科 API ============
import type { Crop } from '@cloud-farm/shared';
import { get } from '../http';

/** 作物列表(可按 season 过滤,做 contains 匹配) */
export function listCrops(season?: string): Promise<Crop[]> {
  const qs = season ? `?season=${encodeURIComponent(season)}` : '';
  return get<Crop[]>(`/crops${qs}`);
}

export function getCrop(id: string): Promise<Crop> {
  return get<Crop>(`/crops/${id}`);
}
