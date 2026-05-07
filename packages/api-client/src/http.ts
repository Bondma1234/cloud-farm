// ============ HTTP 客户端核心 ============
// 与后端 NestJS 的 {code, message, data} 协议自动配合:
//   - 成功 (code=0): 拦截器解包,调用方拿到的就是 data,体验跟普通 axios 一样
//   - 业务错误 (code!=0): 抛出 ApiError,带上 code 和 message
//   - 网络/HTTP 错误: 同样转 ApiError,统一异常类型

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

/** 业务错误,带 code(对应后端 {code, message, data} 中的 code) */
export class ApiError extends Error {
  code: number;
  raw?: unknown;

  constructor(message: string, code: number, raw?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.raw = raw;
  }
}

/** 后端协议 envelope */
interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface CreateClientOptions {
  /** baseURL,默认 '/api'(走 dev 时 vite proxy / 生产同域) */
  baseURL?: string;
  /** Bearer token getter,P3 接 JWT 时挂上 */
  getToken?: () => string | null | undefined;
  /** 超时,默认 10000ms */
  timeout?: number;
}

/** 创建一个配置好的 axios 实例 */
export function createHttpClient(opts: CreateClientOptions = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: opts.baseURL ?? '/api',
    timeout: opts.timeout ?? 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  // 请求拦截:挂 Bearer token
  instance.interceptors.request.use((config) => {
    const token = opts.getToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // 响应拦截:解开 {code,message,data} envelope
  instance.interceptors.response.use(
    (res) => {
      const body = res.data as unknown;
      if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
        const env = body as ApiEnvelope<unknown>;
        if (env.code === 0) {
          (res as { data: unknown }).data = env.data;
          return res;
        }
        throw new ApiError(env.message || `业务错误 (code=${env.code})`, env.code, body);
      }
      return res;
    },
    (err) => {
      const data = err?.response?.data;
      if (data && typeof data === 'object' && 'code' in data) {
        const env = data as ApiEnvelope<unknown>;
        return Promise.reject(new ApiError(env.message || err.message, env.code, data));
      }
      const status = err?.response?.status ?? -1;
      return Promise.reject(new ApiError(err.message || '网络错误', status, err));
    },
  );

  return instance;
}

// ============ 默认实例 + 内置 token 管理 ============
// 大部分调用方只用默认实例就够; 如果需要多套并存(比如 admin 和 miniapp 分账号
// 调试)再用 createHttpClient() 自建实例。
//
// token 存在内存 + localStorage(浏览器场景),刷新页面自动恢复。
// 小程序 P5+ 时,如果跑在微信小程序里,需要换成 wx.getStorageSync,
// 这里在初始化阶段做了 typeof 检测,跑得起来,只是不持久化。

const TOKEN_STORAGE_KEY = 'cloud-farm:access-token';

let memoryToken: string | null = null;
function readPersistedToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}
function writePersistedToken(token: string | null) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* localStorage 满 / 隐私模式 */
  }
}
memoryToken = readPersistedToken();

/** 设置/清空当前 access token,会同时写到 localStorage */
export function setAccessToken(token: string | null) {
  memoryToken = token;
  writePersistedToken(token);
}

/** 读取当前 access token(主要给业务层判断"是否登录"用) */
export function getAccessToken(): string | null {
  return memoryToken;
}

/** 默认 axios 实例,业务直接用 */
export const http = createHttpClient({
  getToken: () => memoryToken,
});

// ============ 简便快捷方法 ============
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.get<T>(url, config);
  return res.data;
}
export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.post<T>(url, body, config);
  return res.data;
}
export async function put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.put<T>(url, body, config);
  return res.data;
}
export async function patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.patch<T>(url, body, config);
  return res.data;
}
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.delete<T>(url, config);
  return res.data;
}
