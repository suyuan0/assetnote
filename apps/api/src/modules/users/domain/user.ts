export const USER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'DISABLED'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;
}

export interface AuthenticatableUser extends User {
  readonly passwordHash: string;
}
