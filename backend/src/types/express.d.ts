import type { SessionPayload } from '../auth/session.service';

declare global {
  namespace Express {
    interface Request {
      session?: SessionPayload;
    }
  }
}

export {};