// ============ 农场直击 API(C5)============
import type { LiveRoom } from '@cloud-farm/shared';
import { get } from '../http';

/** 农场直击列表(直击中的排前) */
export function listLive(): Promise<LiveRoom[]> {
  return get<LiveRoom[]>('/live');
}

/** 单个直击间详情 */
export function getLive(id: string): Promise<LiveRoom> {
  return get<LiveRoom>(`/live/${id}`);
}
