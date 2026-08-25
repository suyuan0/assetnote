import type { UserRole } from '../../users';

export interface AuthSessionResponseDto {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly role: UserRole;
  };
  readonly expiresAt: string;
}
