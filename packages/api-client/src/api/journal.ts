// ============ 田园动态 API ============
import type { JournalEntry } from '@cloud-farm/shared';
import { get } from '../http';

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
