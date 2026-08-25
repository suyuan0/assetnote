export type AuthSessionResponseRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

export interface AuthSessionResponseDto {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly role: AuthSessionResponseRole;
  };
  readonly expiresAt: string;
}
