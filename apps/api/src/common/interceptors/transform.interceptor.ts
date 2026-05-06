import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * 统一响应包装: 把 controller 返回的任何东西套上 { code, message, data }
 *
 * 业界惯例 + 架构 v2 §7.1:
 *   - code = 0      表示成功
 *   - code != 0    业务错误(由 ExceptionFilter 处理)
 *
 * 健康检查这种已经是结构化对象的也会被套一层,这是有意为之 - 客户端只用关心一种格式
 */
export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T>> {
  intercept(_: ExecutionContext, next: CallHandler<T>): Observable<ApiEnvelope<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'ok',
        data,
      })),
    );
  }
}
