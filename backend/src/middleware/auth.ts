import type { NextFunction, Request, Response } from 'express';

import { verifyToken } from '../utils/crypto';

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    role: string;
    phone: string | null;
  };
}

export function authMiddleware(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const header = req.headers?.authorization;
    const token = header && header.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, phone: payload.phone };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function adminMiddleware(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
