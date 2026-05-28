// ============ 优惠券 + 邀请 API (P8 B) ============
import { get } from '../http';

export interface UserCoupon {
  id: string;
  name: string;
  type: 'discount' | 'cash';
  amount: number;
  threshold: number;
  scope: 'all' | 'adopt' | 'shop';
  desc: string;
  status: 'unused' | 'used' | 'expired';
  source: 'system' | 'invite' | 'signup';
  expireAt: string;          // YYYY-MM-DD
  thresholdLabel: string;    // '满 200 可用' / '无门槛'
  scopeLabel: string;        // '认养专用' / '全场通用'
}

/** 当前用户的优惠券(后端已把过期的标 expired) */
export function listMyCoupons(): Promise<UserCoupon[]> {
  return get<UserCoupon[]>('/users/me/coupons');
}

export interface InviteInfo {
  code: string;
  invitedCount: number;
  rewardTotal: number;
  invitedNames: string[];
}

/** 我的邀请码 + 统计 */
export function getMyInvite(): Promise<InviteInfo> {
  return get<InviteInfo>('/users/me/invite');
}
