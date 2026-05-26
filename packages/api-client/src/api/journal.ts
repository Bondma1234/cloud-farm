// ============ 田园动态 API ============
import type { JournalEntry } from '@cloud-farm/shared';
import { get, post, del } from '../http';

/** 动态列表(可按 type / plotId 过滤) */
export function listJournal(opts?: { type?: string; plotId?: string }): Promise<JournalEntry[]> {
  const params = new URLSearchParams();
  if (opts?.type) params.set('type', opts.type);
  if (opts?.plotId) params.set('plotId', opts.plotId);
  const qs = params.toString();
  return get<JournalEntry[]>(`/journal${qs ? '?' + qs : ''}`);
}

export function getJournalEntry(id: string): Promise<JournalEntry> {
  return get<JournalEntry>(`/journal/${id}`);
}

// ============ Admin · 发布 / 删除 ============
export interface CreateJournalInput {
  type: string;            // bloom/water/fertilize/weed/shoot/plant/ship/harvest/pest/news
  icon?: string;           // 不填按 type 自动映射
  title: string;
  summary?: string;
  body: string;
  photos?: string[];
  plotId?: string;         // 不填表示全场动态
}

export function createJournalEntry(input: CreateJournalInput): Promise<JournalEntry> {
  return post<JournalEntry>('/admin/journal', input);
}

export function deleteJournalEntry(id: string): Promise<{ ok: true }> {
  return del<{ ok: true }>(`/admin/journal/${id}`);
}
