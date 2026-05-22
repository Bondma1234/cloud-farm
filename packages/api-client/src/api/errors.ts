// ============ 错误上报 SDK ============
// 给前端用:Vue errorHandler / unhandledrejection / window.onerror 抓到错误就调这个
// 公开接口,不需 token(带了也好,不强求)
import { post } from '../http';

export interface ReportErrorInput {
  source: 'admin' | 'miniapp';
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
}

export function reportError(input: ReportErrorInput): Promise<{ id: number }> {
  // 静默上报:失败了也别让上报本身再抛错(会循环)
  return post<{ id: number }>('/errors', input).catch((e) => {
    // eslint-disable-next-line no-console
    console.warn('[error-log] 上报失败, 错误本身忽略:', e?.message);
    return { id: -1 };
  });
}
