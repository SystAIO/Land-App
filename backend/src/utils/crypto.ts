import crypto from 'crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import config from '../config';

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  role: string;
  phone: string | null;
}

/** Constant-time comparison (hashed first so length doesn't leak). */
export function safeEqual(a: unknown, b: unknown): boolean {
  const aHash = crypto.createHash('sha256').update(String(a)).digest();
  const bHash = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

export function signToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}
