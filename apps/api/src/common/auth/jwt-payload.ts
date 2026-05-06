/**
 * JWT 载荷 - 我们 sign 进去的字段
 *
 * sub: 用户 id (number, 来自 User 表的自增主键)
 * phone: 用户脱敏手机号(便于服务端日志查最近活跃用户,无需查 DB)
 * role: 角色,P5+ 接 RBAC
 *
 * iat / exp 是 jsonwebtoken 自动加的
 */
export interface JwtPayload {
  sub: number;
  phone: string;
  role: string;
  iat?: number;
  exp?: number;
}
