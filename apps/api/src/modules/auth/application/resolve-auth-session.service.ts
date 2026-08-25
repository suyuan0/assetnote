import { Inject, Injectable } from '@nestjs/common';

import {
  AUTH_SESSION_REPOSITORY,
  type ActiveAuthSession,
  type AuthSessionRepository,
} from './auth-session.repository';
import {
  SESSION_TOKEN_SERVICE,
  type SessionTokenService,
} from './session-token.service';

@Injectable()
export class ResolveAuthSessionService {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepository,
    @Inject(SESSION_TOKEN_SERVICE)
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async execute(rawSessionToken: string): Promise<ActiveAuthSession | null> {
    const tokenHash = this.sessionTokenService.hash(rawSessionToken);

    return this.authSessionRepository.findActiveByTokenHash(
      tokenHash,
      new Date(),
    );
  }
}
