import type { NextFunction, Request, Response } from 'express';

export function preventAuthResponseCaching(
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  response.setHeader('Cache-Control', 'no-store');
  next();
}
