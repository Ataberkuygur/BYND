import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { isRevoked } from '../services/accessTokenService';

export interface AuthRequest extends Request { userId?: string }

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  // DEVELOPMENT MODE: Bypass authentication for testing
  if (env.DEVELOPMENT_MODE === 'true') {
    console.log('🚧 DEVELOPMENT MODE: Bypassing authentication');
    req.userId = '12345678-1234-1234-1234-123456789abc';
    return next();
  }

  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = header.replace(/^Bearer\s+/i, '');
  try {
  const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string; jti?: string };
    if (!payload.sub) return res.status(401).json({ error: 'Invalid token' });
  if (isRevoked(payload.jti)) return res.status(401).json({ error: 'Token revoked' });
    req.userId = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
