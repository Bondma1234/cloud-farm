// ============ 作物百科 API ============
import type { Crop } from '@cloud-farm/shared';
import { get, post, patch, del } from '../http';

/** 作物列表(可按 season 过滤,做 contains 匹配) */
export function listCrops(season?: string, includeArchived = false): Promise<Crop[]> {
  const params = new URLSearchParams();
  if (season) params.set('season', season);
  if (includeArchived) params.set('includeArchived', 'true');
  const qs = params.toString();
  return get<Crop[]>(`/crops${qs ? '?' + qs : ''}`);
}

export function getCrop(id: string): Promise<Crop> {
  return get<Crop>(`/crops/${id}`);
}

// ============ Admin · CRUD ============
export interface CreateCropInput {
  id: string;
  name: string;
  emoji: string;
  cover: string;
  season: string;
  difficulty: number;
  daysToHarvest: string;
  yieldPerSqm: string;
  intro: string;
  tags: string[];
  recommendPkg: string[];
  sortOrder?: number;
}

export interface UpdateCropInput extends Partial<Omit<CreateCropInput, 'id'>> {}

export function createCrop(input: CreateCropInput): Promise<Crop> {
  return post<Crop>('/crops', input);
}

export function updateCrop(id: string, input: UpdateCropInput): Promise<Crop> {
  return patch<Crop>(`/crops/${id}`, input);
}

export function setCropStatus(id: string, status: 'active' | 'archived'): Promise<Crop> {
  return patch<Crop>(`/crops/${id}/status`, { status });
}

export function deleteCrop(id: string): Promise<{ ok: true }> {
  return del<{ ok: true }>(`/crops/${id}`);
}
