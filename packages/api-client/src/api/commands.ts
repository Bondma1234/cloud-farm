// ============ 指令工单 API ============
import type { Command } from '@cloud-farm/shared';
import { get } from '../http';

/** 当前用户的指令历史(可按 type 过滤) */
export function listCommands(type?: string): Promise<Command[]> {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return get<Command[]>(`/commands${qs}`);
}
