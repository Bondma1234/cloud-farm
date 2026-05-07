// ============ 地块 API ============
import type { Plot } from '@cloud-farm/shared';
import { get } from '../http';

/** 全部地块(可按 block/status 过滤) */
export function listPlots(opts?: { block?: string; status?: string }): Promise<Plot[]> {
  const params = new URLSearchParams();
  if (opts?.block) params.set('block', opts.block);
  if (opts?.status) params.set('status', opts.status);
  const qs = params.toString();
  return get<Plot[]>(`/plots${qs ? '?' + qs : ''}`);
}

/** 仅返可认养(status=available) */
export function listAvailablePlots(block?: string): Promise<Plot[]> {
  const qs = block ? `?block=${encodeURIComponent(block)}` : '';
  return get<Plot[]>(`/plots/available${qs}`);
}

export function getPlot(id: string): Promise<Plot> {
  return get<Plot>(`/plots/${id}`);
}
