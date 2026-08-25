import { Inject, Injectable } from '@nestjs/common';

import { normalizeEmail } from '../domain/normalize-email';
import type { User } from '../domain/user';
import {
  INITIAL_SUPER_ADMIN_REPOSITORY,
  type InitialSuperAdminRepository,
} from './initial-super-admin.repository';
import { InitialSuperAdminAlreadyExistsError } from './initial-super-admin-already-exists.error';
import { PASSWORD_HASHER, type PasswordHasher } from './password-hasher';

export interface BootstrapSuperAdminInput {
  readonly email: string;
  readonly password: string;
}

@Injectable()
export class BootstrapSuperAdminService {
  constructor(
    @Inject(INITIAL_SUPER_ADMIN_REPOSITORY)
    private readonly initialSuperAdminRepository: InitialSuperAdminRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: BootstrapSuperAdminInput): Promise<User> {
    const normalizedEmail = normalizeEmail(input.email);
    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.initialSuperAdminRepository.createIfNoUsersExist({
      normalizedEmail,
      passwordHash,
    });

    if (!user) {
      throw new InitialSuperAdminAlreadyExistsError();
    }

    return user;
  }
}
