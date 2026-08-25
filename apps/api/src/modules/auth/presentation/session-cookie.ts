import type { CookieOptions, Request } from 'express';

import type { ApplicationConfig } from '../../../common/config/application.config';

export function readSessionCookie(
  request: Request,
  cookieName: string,
): string | undefined {
  const cookies: unknown = request.cookies;

  if (!cookies || typeof cookies !== 'object') {
    return undefined;
  }

  const value: unknown = Object.getOwnPropertyDescriptor(
    cookies,
    cookieName,
  )?.value;

  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function createSessionCookieOptions(
  config: ApplicationConfig['sessionCookie'],
): CookieOptions {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: config.secure,
  };
}
