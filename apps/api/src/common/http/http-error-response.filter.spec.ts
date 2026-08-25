import {
  Controller,
  Get,
  HttpStatus,
  type INestApplication,
  Logger,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { HttpErrorResponseFilter } from './http-error-response.filter';

const SENSITIVE_ERROR_MESSAGE =
  'postgresql://user:password@localhost/assetnote token_hash=secret';

@Controller()
class UnexpectedErrorController {
  @Get('unexpected-error')
  throwUnexpectedError(): never {
    const error = new Error(SENSITIVE_ERROR_MESSAGE);

    error.stack = `Error: ${SENSITIVE_ERROR_MESSAGE}\n    at sensitive-location`;

    throw error;
  }
}

describe('HttpErrorResponseFilter', () => {
  it('logs an unexpected error without its message, stack, or values', async () => {
    const loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    let app: INestApplication<App> | undefined;

    try {
      const moduleRef = await Test.createTestingModule({
        controllers: [UnexpectedErrorController],
      }).compile();

      app = moduleRef.createNestApplication();
      app.useGlobalFilters(new HttpErrorResponseFilter());
      await app.init();

      await request(app.getHttpServer())
        .get('/unexpected-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .expect({
          message: '服务器内部错误。',
        });

      expect(loggerErrorSpy.mock.calls).toEqual([
        ['处理 HTTP 请求时发生未预期错误。'],
      ]);
    } finally {
      await app?.close();
      loggerErrorSpy.mockRestore();
    }
  });
});
