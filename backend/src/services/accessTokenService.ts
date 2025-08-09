import { randomBytes } from 'crypto';

interface AccessTokenRecord { jti: string; expiresAt: number }

// In-memory blacklist / tracking
const revoked = new Set<string>();
const active: Map<string, AccessTokenRecord> = new Map();

export function newJti(): string { return randomBytes(10).toString('hex'); }

export function trackAccessToken(jti: string, ttlSeconds: number) {
  active.set(jti, { jti, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function revokeAccessToken(jti: string) {
  revoked.add(jti);
  active.delete(jti);
}

export function isRevoked(jti?: string): boolean {
  if (!jti) return false;
  if (revoked.has(jti)) return true;
  const rec = active.get(jti);
  if (rec && rec.expiresAt < Date.now()) { active.delete(jti); return false; }
  return false;
}

export function purgeExpiredAccess() {
  const now = Date.now();
  for (const [k, v] of active.entries()) if (v.expiresAt < now) active.delete(k);
}
