import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { isRevoked } from '../services/accessTokenService';

export interface AuthRequest extends Request { userId?: string }

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
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
