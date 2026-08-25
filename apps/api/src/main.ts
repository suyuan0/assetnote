import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureHttpApplication } from './common/bootstrap/configure-http-application';
import applicationConfig from './common/config/application.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigType<typeof applicationConfig>>(
    applicationConfig.KEY,
  );

  configureHttpApplication(app, config);
  app.enableShutdownHooks();

  await app.listen(config.port);
}

void bootstrap();
