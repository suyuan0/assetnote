import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import applicationConfig from '../../../common/config/application.config';
import { ResolveAuthSessionService } from '../application/resolve-auth-session.service';
import type { AuthenticatedRequest } from './authenticated-request';
import { readSessionCookie } from './session-cookie';

@Injectable()
export class SessionAuthenticationGuard implements CanActivate {
  constructor(
    private readonly resolveAuthSessionService: ResolveAuthSessionService,
    @Inject(applicationConfig.KEY)
    private readonly config: ConfigType<typeof applicationConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const rawSessionToken = readSessionCookie(
      request,
      this.config.sessionCookie.name,
    );

    if (!rawSessionToken) {
      throw new UnauthorizedException({ message: '请先登录。' });
    }

    const authSession =
      await this.resolveAuthSessionService.execute(rawSessionToken);

    if (!authSession) {
      throw new UnauthorizedException({ message: '请先登录。' });
    }

    request.authSession = authSession;

    return true;
  }
}
