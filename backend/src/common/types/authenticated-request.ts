import { Request } from 'express';
import { Principal } from '../context/request-context';

export interface AuthenticatedUser {
  id: string;
  username: string;
  principal: Principal;
  jobWorkerId: string | null;
  permissions: Set<string>;
  isSuperAdmin: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  sessionId?: string;
  requestId: string;
}
