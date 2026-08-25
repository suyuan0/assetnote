import type { AuthenticatableUser } from '../domain/user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findForAuthenticationByEmail(
    normalizedEmail: string,
  ): Promise<AuthenticatableUser | null>;
}
