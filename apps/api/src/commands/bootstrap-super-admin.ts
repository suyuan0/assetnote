import { stderr, stdout } from 'node:process';

import { type INestApplicationContext, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import {
  BootstrapSuperAdminService,
  InitialSuperAdminAlreadyExistsError,
  UsersModule,
} from '../modules/users';
import {
  BootstrapSuperAdminInputError,
  type ValidatedBootstrapSuperAdminInput,
  promptForBootstrapSuperAdmin,
} from '../modules/users/cli';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UsersModule],
})
class BootstrapSuperAdminCommandModule {}

function writeCommandError(error: unknown): void {
  if (
    error instanceof BootstrapSuperAdminInputError ||
    error instanceof InitialSuperAdminAlreadyExistsError
  ) {
    stderr.write(`${error.message}\n`);
    return;
  }

  stderr.write(
    '无法创建初始超级管理员，请检查数据库配置、迁移状态和连接是否正常。\n',
  );
}

async function createApplicationContext(): Promise<INestApplicationContext> {
  return NestFactory.createApplicationContext(
    BootstrapSuperAdminCommandModule,
    {
      abortOnError: false,
      logger: false,
    },
  );
}

async function createInitialSuperAdmin(
  application: INestApplicationContext,
  input: ValidatedBootstrapSuperAdminInput,
): Promise<void> {
  const service = application.get(BootstrapSuperAdminService);

  await service.execute(input);
}

async function bootstrap(): Promise<void> {
  let application: INestApplicationContext | undefined;

  try {
    const input = await promptForBootstrapSuperAdmin();

    application = await createApplicationContext();
    await createInitialSuperAdmin(application, input);
    stdout.write('初始超级管理员创建成功。\n');
  } catch (error) {
    writeCommandError(error);
    process.exitCode = 1;
  } finally {
    if (application) {
      try {
        await application.close();
      } catch {
        stderr.write('应用未能正常关闭。\n');
        process.exitCode = 1;
      }
    }
  }
}

void bootstrap();
