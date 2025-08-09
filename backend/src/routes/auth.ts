import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { createUser, verifyUser, getUserByEmail, getUserById } from '../services/userService';
import { auth, AuthRequest } from '../middleware/auth';
import { issueRefreshToken, rotateRefreshToken, validateRefreshToken, revokeToken } from '../services';
import { newJti, trackAccessToken } from '../services/accessTokenService';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const emailSchema = z.string().email().max(254);
const passwordSchema = z.string().min(8).max(100)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');
const registerSchema = z.object({ body: z.object({ email: emailSchema, password: passwordSchema }) });
const loginSchema = registerSchema;
const refreshSchema = z.object({ body: z.object({ refreshToken: z.string().min(10) }) });

const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });
// apply limiter to all auth modifying routes

export const router = Router();

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (await getUserByEmail(email)) return res.status(409).json({ error: 'Email already registered' });
    let user;
    try {
      user = await createUser(email, password);
    } catch (e: unknown) {
      // Unique constraint race fallback
      const error = e as { code?: string; message?: string };
      if (error?.code === '23505' || /duplicate/i.test(error?.message || '')) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      throw e;
    }
  const jti = newJti();
  const expiresInSec = parseInt(env.ACCESS_TOKEN_TTL_MIN || '15', 10) * 60;
  const accessToken = jwt.sign({ jti }, env.JWT_SECRET, { subject: user.id, expiresIn: expiresInSec });
  trackAccessToken(jti, expiresInSec);
  const refresh = await issueRefreshToken(user.id);
  res.status(201).json({ accessToken, refreshToken: refresh.token, expiresAt: refresh.expiresAt });
  } catch (e) { next(e); }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await verifyUser(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const jti = newJti();
  const expiresInSec = parseInt(env.ACCESS_TOKEN_TTL_MIN || '15', 10) * 60;
  const accessToken = jwt.sign({ jti }, env.JWT_SECRET, { subject: user.id, expiresIn: expiresInSec });
  trackAccessToken(jti, expiresInSec);
  const refresh = await issueRefreshToken(user.id);
  res.json({ accessToken, refreshToken: refresh.token, expiresAt: refresh.expiresAt });
  } catch (e) { next(e); }
});

router.get('/me', auth, async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: 'unauthorized' });
  const user = await getUserById(req.userId);
  res.json({ id: req.userId, email: user?.email });
});

// Exchange refresh token for new pair
router.post('/refresh', authLimiter, validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
    const valid = await validateRefreshToken(refreshToken);
    if (!valid) return res.status(401).json({ error: 'invalid refresh token' });
    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) return res.status(401).json({ error: 'invalid refresh token' });
    const jti = newJti();
    const expiresInSec = parseInt(env.ACCESS_TOKEN_TTL_MIN || '15', 10) * 60;
    const accessToken = jwt.sign({ jti }, env.JWT_SECRET, { subject: rotated.userId, expiresIn: expiresInSec });
    trackAccessToken(jti, expiresInSec);
    res.json({ accessToken, refreshToken: rotated.newToken.token, expiresAt: rotated.newToken.expiresAt });
  } catch (e) { next(e); }
});

const logoutSchema = z.object({ body: z.object({ refreshToken: z.string().min(10).optional() }) });
router.post('/logout', authLimiter, validate(logoutSchema), async (req: AuthRequest, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeToken(refreshToken, 'LOGOUT');
  // Best effort: cannot revoke access token without its jti passed; would rely on client discard
  res.status(204).end();
});
