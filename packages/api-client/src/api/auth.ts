// ============ 认证 API ============
import type { LoginParams, AuthTokens } from '@cloud-farm/shared';
import { post, setAccessToken } from '../http';

/**
 * 短信验证码登录
 *
 * 副作用:登录成功后会把 accessToken 自动存到 http 模块,
 * 之后所有请求自动带 Authorization: Bearer xxx 头
 */
export async function login(params: LoginParams): Promise<AuthTokens> {
  const data = await post<AuthTokens>('/auth/login', params);
  setAccessToken(data.accessToken);
  return data;
}

/** 注销:清空本地 token(P5+ 加调后端 /auth/logout 把 token 拉黑) */
export function logout(): void {
  setAccessToken(null);
}
