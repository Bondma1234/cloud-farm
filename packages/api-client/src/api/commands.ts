// ============ 指令工单 API ============
import type { Command, CommandType } from '@cloud-farm/shared';
import { get, post } from '../http';

/** 当前用户的指令历史(可按 type 过滤) */
export function listCommands(type?: string): Promise<Command[]> {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return get<Command[]>(`/commands${qs}`);
}

export interface CreateCommandInput {
  type: CommandType;
  plotId: string;
  note?: string;
}

/** 用户发指令(浇水/施肥/除草/拍照等),需要 JWT,必须是该地块认养人 */
export function createCommand(input: CreateCommandInput): Promise<Command> {
  return post<Command>('/commands', input);
}
