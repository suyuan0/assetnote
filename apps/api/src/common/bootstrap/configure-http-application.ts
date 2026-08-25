import { type INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import type { ApplicationConfig } from '../config/application.config';
import { createValidationException } from '../http/create-validation-exception';
import { HttpErrorResponseFilter } from '../http/http-error-response.filter';

export function configureHttpApplication(
  app: INestApplication,
  config: ApplicationConfig,
): void {
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalFilters(new HttpErrorResponseFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: createValidationException,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  app.enableCors({
    origin: config.webOrigin,
    credentials: true,
  });
}
