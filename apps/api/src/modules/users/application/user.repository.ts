import type { UserRole, UserStatus } from '../domain/user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserAuthenticationRecord {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: UserRole;
  readonly status: UserStatus;
}

export interface UserRepository {
  findForAuthenticationByEmail(
    normalizedEmail: string,
  ): Promise<UserAuthenticationRecord | null>;
}
