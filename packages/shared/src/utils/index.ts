// ============ 纯函数工具 ============

import { PHONE_REGEX } from '../constants';

/** 校验中国大陆手机号 */
export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

/** 把手机号脱敏成 138****1234 形式 */
export function maskPhone(phone: string): string {
  if (!isValidPhone(phone)) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(7);
}

/** 把分(integer)转成元(string),保留 2 位小数 */
export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2);
}

/** 把元(number/string)转成分(integer),用于支付计算 */
export function yuanToFen(yuan: number | string): number {
  return Math.round(Number(yuan) * 100);
}

/**
 * 把 ISO 时间字符串(或 Date)转成"几小时前/几天前"
 * 不超过 7 天用相对,超过用日期
 */
export function timeAgo(input: string | Date): string {
  const t = typeof input === 'string' ? new Date(input) : input;
  const diffMs = Date.now() - t.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  return t.toISOString().slice(0, 10);
}

/** 给地块编号自动补 0:7 → "07" */
export function padPlotIndex(n: number): string {
  return String(n).padStart(2, '0');
}
