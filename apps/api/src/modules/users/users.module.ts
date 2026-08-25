import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../common/database/database.module';
import { BootstrapSuperAdminService } from './application/bootstrap-super-admin.service';
import { INITIAL_SUPER_ADMIN_REPOSITORY } from './application/initial-super-admin.repository';
import { PASSWORD_HASHER } from './application/password-hasher';
import { USER_REPOSITORY } from './application/user.repository';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { PrismaInitialSuperAdminRepository } from './infrastructure/prisma-initial-super-admin.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';

@Module({
  imports: [DatabaseModule],
  providers: [
    BootstrapSuperAdminService,
    {
      provide: INITIAL_SUPER_ADMIN_REPOSITORY,
      useClass: PrismaInitialSuperAdminRepository,
    },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
  ],
  exports: [BootstrapSuperAdminService, USER_REPOSITORY, PASSWORD_HASHER],
})
export class UsersModule {}
