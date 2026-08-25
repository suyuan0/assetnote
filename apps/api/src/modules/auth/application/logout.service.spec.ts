import type { AuthSessionRepository } from './auth-session.repository';
import { LogoutService } from './logout.service';
import type { SessionTokenService } from './session-token.service';

const NOW = new Date('2026-08-25T08:00:00.000Z');
const RAW_SESSION_TOKEN = 'raw-session-token';
const TOKEN_HASH = 'a'.repeat(64);

describe('LogoutService', () => {
  let revokeSession: jest.Mock<
    ReturnType<AuthSessionRepository['revokeByTokenHash']>,
    Parameters<AuthSessionRepository['revokeByTokenHash']>
  >;
  let hashSessionToken: jest.Mock<
    ReturnType<SessionTokenService['hash']>,
    Parameters<SessionTokenService['hash']>
  >;
  let service: LogoutService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);

    revokeSession = jest.fn<
      ReturnType<AuthSessionRepository['revokeByTokenHash']>,
      Parameters<AuthSessionRepository['revokeByTokenHash']>
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
      findActiveByTokenHash: jest.fn<
        ReturnType<AuthSessionRepository['findActiveByTokenHash']>,
        Parameters<AuthSessionRepository['findActiveByTokenHash']>
      >(),
      revokeByTokenHash: revokeSession,
    };
    const sessionTokenService: SessionTokenService = {
      generate: jest.fn<
        ReturnType<SessionTokenService['generate']>,
        Parameters<SessionTokenService['generate']>
      >(),
      hash: hashSessionToken,
    };

    hashSessionToken.mockReturnValue(TOKEN_HASH);
    service = new LogoutService(authSessionRepository, sessionTokenService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('hashes and revokes the supplied session at the current time', async () => {
    revokeSession.mockResolvedValue(true);

    await expect(service.execute(RAW_SESSION_TOKEN)).resolves.toBe(true);

    expect(hashSessionToken).toHaveBeenCalledWith(RAW_SESSION_TOKEN);
    expect(revokeSession).toHaveBeenCalledWith(TOKEN_HASH, NOW);
  });

  it('treats a missing session token as an idempotent no-op', async () => {
    await expect(service.execute(undefined)).resolves.toBe(false);

    expect(hashSessionToken).not.toHaveBeenCalled();
    expect(revokeSession).not.toHaveBeenCalled();
  });
});
