import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { Request } from 'express';

import applicationConfig from '../../../common/config/application.config';

@Injectable()
export class WebOriginGuard implements CanActivate {
  constructor(
    @Inject(applicationConfig.KEY)
    private readonly config: ConfigType<typeof applicationConfig>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.get('origin') !== this.config.webOrigin) {
      throw new ForbiddenException({ message: '不允许当前请求来源。' });
    }

    return true;
  }
}
