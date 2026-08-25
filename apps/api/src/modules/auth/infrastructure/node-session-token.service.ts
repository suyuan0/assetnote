import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import type {
  GeneratedSessionToken,
  SessionTokenService,
} from '../application/session-token.service';

const SESSION_TOKEN_BYTES = 32;

@Injectable()
export class NodeSessionTokenService implements SessionTokenService {
  generate(): GeneratedSessionToken {
    const rawToken = randomBytes(SESSION_TOKEN_BYTES).toString('base64url');

    return {
      rawToken,
      tokenHash: this.hash(rawToken),
    };
  }

  hash(rawToken: string): string {
    return createHash('sha256').update(rawToken, 'utf-8').digest('hex');
  }
}
