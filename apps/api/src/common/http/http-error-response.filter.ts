import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

const DEFAULT_ERROR_MESSAGES: ReadonlyMap<number, string> = new Map([
  [HttpStatus.BAD_REQUEST, '请求参数不正确。'],
  [HttpStatus.UNAUTHORIZED, '请先登录。'],
  [HttpStatus.FORBIDDEN, '无权访问该资源。'],
  [HttpStatus.NOT_FOUND, '请求的资源不存在。'],
  [HttpStatus.METHOD_NOT_ALLOWED, '不支持当前请求方法。'],
  [HttpStatus.REQUEST_TIMEOUT, '请求超时。'],
  [HttpStatus.CONFLICT, '请求发生冲突。'],
  [HttpStatus.PAYLOAD_TOO_LARGE, '请求内容过大。'],
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE, '不支持当前请求的内容类型。'],
  [HttpStatus.UNPROCESSABLE_ENTITY, '请求内容无法处理。'],
  [HttpStatus.TOO_MANY_REQUESTS, '请求过于频繁，请稍后再试。'],
  [HttpStatus.INTERNAL_SERVER_ERROR, '服务器内部错误。'],
  [HttpStatus.BAD_GATEWAY, '上游服务响应异常。'],
  [HttpStatus.SERVICE_UNAVAILABLE, '服务暂时不可用。'],
  [HttpStatus.GATEWAY_TIMEOUT, '上游服务响应超时。'],
]);

interface HttpErrorResponse {
  readonly message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readFirstMessage(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );
  }

  return undefined;
}

function readExplicitMessage(exception: HttpException): string | undefined {
  const exceptionResponse: unknown = exception.getResponse();

  if (typeof exceptionResponse === 'string') {
    return readFirstMessage(exceptionResponse);
  }

  if (!isRecord(exceptionResponse)) {
    return undefined;
  }

  const responseKeys = Object.keys(exceptionResponse);

  if (responseKeys.length !== 1 || responseKeys[0] !== 'message') {
    return undefined;
  }

  return readFirstMessage(exceptionResponse.message);
}

function getDefaultErrorMessage(status: number): string {
  return DEFAULT_ERROR_MESSAGES.get(status) ?? '请求失败。';
}

function getErrorResponse(exception: unknown): {
  readonly body: HttpErrorResponse;
  readonly status: number;
} {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();

    return {
      body: {
        message:
          readExplicitMessage(exception) ?? getDefaultErrorMessage(status),
      },
      status,
    };
  }

  return {
    body: {
      message: getDefaultErrorMessage(HttpStatus.INTERNAL_SERVER_ERROR),
    },
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  };
}

@Catch()
export class HttpErrorResponseFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorResponseFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (!(exception instanceof HttpException)) {
      if (exception instanceof Error) {
        this.logger.error('处理 HTTP 请求时发生未预期错误。', exception.stack);
      } else {
        this.logger.error('处理 HTTP 请求时发生未预期错误。');
      }
    }

    const response = host.switchToHttp().getResponse<Response>();
    const errorResponse = getErrorResponse(exception);

    response.status(errorResponse.status).json(errorResponse.body);
  }
}
