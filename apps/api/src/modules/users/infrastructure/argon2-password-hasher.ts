import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

import type { PasswordHasher } from '../application/password-hasher';

const PASSWORD_HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
} satisfies argon2.HashOptions;

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  hash(password: string): Promise<string> {
    return argon2.hash(password, PASSWORD_HASH_OPTIONS);
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return argon2.verify(passwordHash, password);
  }
}
