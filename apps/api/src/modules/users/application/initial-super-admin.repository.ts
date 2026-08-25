import type { User } from '../domain/user';

export const INITIAL_SUPER_ADMIN_REPOSITORY = Symbol(
  'INITIAL_SUPER_ADMIN_REPOSITORY',
);

export interface CreateInitialSuperAdminInput {
  readonly normalizedEmail: string;
  readonly passwordHash: string;
}

export interface InitialSuperAdminRepository {
  createIfNoUsersExist(
    input: CreateInitialSuperAdminInput,
  ): Promise<User | null>;
}
