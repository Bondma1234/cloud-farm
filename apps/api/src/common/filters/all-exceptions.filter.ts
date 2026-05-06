import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 全局异常拦截
 * - HttpException: 取它的 status + message
 * - 其他错误: 500 + 'internal server error'
 *
 * 全部包装成统一格式 { code, message, data } 返给前端,
 * data 永远是 null,前端只用判断 code !== 0 即为错误
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = -1;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      // r 可能是 string,也可能是 { message: string | string[], error: string }
      if (typeof r === 'string') {
        message = r;
      } else if (typeof r === 'object' && r !== null) {
        const m = (r as { message?: string | string[] }).message;
        message = Array.isArray(m) ? m.join('; ') : m || message;
      }
      code = status; // HTTP status 本身就是业务码,简单又一目了然
    } else {
      this.logger.error(
        `[${req.method} ${req.url}] 未捕获异常`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json({
      code,
      message,
      data: null,
    });
  }
}
