import type { AuthSessionRepository } from './auth-session.repository';
import { ResolveAuthSessionService } from './resolve-auth-session.service';
import type { SessionTokenService } from './session-token.service';

const NOW = new Date('2026-08-25T08:00:00.000Z');
const RAW_SESSION_TOKEN = 'raw-session-token';
const TOKEN_HASH = 'a'.repeat(64);

const ACTIVE_SESSION = {
  id: '111f7695-607e-4401-b8d2-d00526cc6892',
  expiresAt: new Date('2026-08-26T08:00:00.000Z'),
  user: {
    id: '8a5c15a2-a356-4c7a-9107-d79f73330742',
    email: 'user@example.com',
    role: 'USER',
    status: 'ACTIVE',
  },
} as const;

describe('ResolveAuthSessionService', () => {
  let findActiveSession: jest.Mock<
    ReturnType<AuthSessionRepository['findActiveByTokenHash']>,
    Parameters<AuthSessionRepository['findActiveByTokenHash']>
  >;
  let hashSessionToken: jest.Mock<
    ReturnType<SessionTokenService['hash']>,
    Parameters<SessionTokenService['hash']>
  >;
  let service: ResolveAuthSessionService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);

    findActiveSession = jest.fn<
      ReturnType<AuthSessionRepository['findActiveByTokenHash']>,
      Parameters<AuthSessionRepository['findActiveByTokenHash']>
    >();
    hashSessionToken = jest.fn<
      ReturnType<SessionTokenService['hash']>,
      Parameters<SessionTokenService['hash']>
    >();

    const authSessionRepository: AuthSessionRepository = {
      createForSuccessfulLogin: jest.fn<
        ReturnType<AuthSessionRepository['createForSuccessfulLogin']>,
        Parameters<AuthSessionRepository['createForSuccessfulLogin']>
      >(),
      findActiveByTokenHash: findActiveSession,
      revokeByTokenHash: jest.fn<
        ReturnType<AuthSessionRepository['revokeByTokenHash']>,
        Parameters<AuthSessionRepository['revokeByTokenHash']>
      >(),
    };
    const sessionTokenService: SessionTokenService = {
      generate: jest.fn<
        ReturnType<SessionTokenService['generate']>,
        Parameters<SessionTokenService['generate']>
      >(),
      hash: hashSessionToken,
    };

    hashSessionToken.mockReturnValue(TOKEN_HASH);
    service = new ResolveAuthSessionService(
      authSessionRepository,
      sessionTokenService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('hashes the browser token and resolves its active session at the current time', async () => {
    findActiveSession.mockResolvedValue(ACTIVE_SESSION);

    await expect(service.execute(RAW_SESSION_TOKEN)).resolves.toEqual(
      ACTIVE_SESSION,
    );

    expect(hashSessionToken).toHaveBeenCalledWith(RAW_SESSION_TOKEN);
    expect(findActiveSession).toHaveBeenCalledWith(TOKEN_HASH, NOW);
  });

  it('returns null when the session is missing, expired, revoked, or inactive', async () => {
    findActiveSession.mockResolvedValue(null);

    await expect(service.execute(RAW_SESSION_TOKEN)).resolves.toBeNull();
  });
});
