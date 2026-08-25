import type { Request } from 'express';

import type { ActiveAuthSession } from '../application/auth-session.repository';

export interface AuthenticatedRequest extends Request {
  authSession: ActiveAuthSession;
}
