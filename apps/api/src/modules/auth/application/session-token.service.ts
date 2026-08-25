export const SESSION_TOKEN_SERVICE = Symbol('SESSION_TOKEN_SERVICE');

export interface GeneratedSessionToken {
  readonly rawToken: string;
  readonly tokenHash: string;
}

export interface SessionTokenService {
  generate(): GeneratedSessionToken;

  hash(rawToken: string): string;
}
