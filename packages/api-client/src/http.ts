// ============ HTTP 客户端核心 ============
// 与后端 NestJS 的 {code, message, data} 协议自动配合:
//   - 成功 (code=0): 拦截器解包,调用方拿到的就是 data,体验跟普通 axios 一样
//   - 业务错误 (code!=0): 抛出 ApiError,带上 code 和 message
//   - 网络/HTTP 错误: 同样转 ApiError,统一异常类型
//
// 调用方只用关心 try/catch ApiError,不用判断 res.data.code 这种重复劳动

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
      // 如果后端按协议返回了 envelope
      if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
        const env = body as ApiEnvelope<unknown>;
        if (env.code === 0) {
          // 把 data 直接放回 res.data,后续调用方拿到的就是 data
          (res as { data: unknown }).data = env.data;
          return res;
        }
        // 业务错误
        throw new ApiError(env.message || `业务错误 (code=${env.code})`, env.code, body);
      }
      // 不符合 envelope 协议(理论上不该走到这,/api/docs 等非接口路径除外),原样返回
      return res;
    },
    (err) => {
      // 网络层错误 / HTTP 4xx/5xx
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

/** 默认实例(浏览器跑时直接用) */
export const http = createHttpClient();

/** 给 admin 这种端用,业务代码不直接调 axios,而是封装成函数 */
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

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.delete<T>(url, config);
  return res.data;
}
