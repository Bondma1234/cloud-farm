// ============ 云上田园 API 客户端 SDK 入口 ============
// admin / miniapp / web 三端共用,后端 schema 改了 → @cloud-farm/shared 类型变 → 编译报错锁住前端
//
// 使用范例:
//   import { listPackages } from '@cloud-farm/api-client';
//   const packages = await listPackages();
//
//   import { ApiError } from '@cloud-farm/api-client';
//   try { ... } catch (e) { if (e instanceof ApiError && e.code === 404) ... }

export * from './http';
export * from './api/auth';
export * from './api/users';
export * from './api/orders';
export * from './api/packages';
export * from './api/journal';
export * from './api/crops';
export * from './api/photos';
export * from './api/commands';
export * from './api/plots';
export * from './api/admin';
