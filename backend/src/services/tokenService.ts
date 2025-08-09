import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { getSupabase } from '../utils/supabase';
import { env } from '../utils/env';

export interface RefreshTokenRecord { token: string; userId: string; expiresAt: string; createdAt: string; familyId: string; jti: string; }

interface StoredRecord extends Omit<RefreshTokenRecord, 'token'> { tokenHash: string; revoked: boolean; prevJti?: string; replacedByJti?: string; reason?: string }

// In-memory fallback (hash map by tokenHash)
const memory: Map<string, StoredRecord> = new Map();

function genOpaque(): string { return randomBytes(40).toString('hex'); }
function genId(): string { return randomBytes(10).toString('hex'); }
function ttl(days: number) { return new Date(Date.now() + days*24*60*60*1000).toISOString(); }

export async function issueRefreshToken(userId: string, familyId?: string, prev?: StoredRecord): Promise<RefreshTokenRecord> {
  const days = parseInt(env.REFRESH_TOKEN_TTL_DAYS || '7', 10);
  const token = genOpaque();
  const tokenHash = await bcrypt.hash(token, 10);
  const createdAt = new Date().toISOString();
  const expiresAt = ttl(days);
  const jti = genId();
  const fam = familyId || genId();
  const record: StoredRecord = { tokenHash, userId, createdAt, expiresAt, familyId: fam, jti, revoked: false, prevJti: prev?.jti };
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('refresh_tokens').insert({
      token_hash: tokenHash,
      user_id: userId,
      family_id: fam,
      jti,
      prev_jti: prev?.jti || null,
      replaced_by_jti: null,
      revoked: false,
      expires_at: expiresAt,
      created_at: createdAt
    });
    if (error) console.error('Supabase issue refresh token error', error.message);
  } else {
    memory.set(tokenHash, record);
  }
  if (prev) await markReplaced(prev, jti);
  return { token, userId, createdAt, expiresAt, familyId: fam, jti };
}

async function markReplaced(prev: StoredRecord, newJti: string) {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('refresh_tokens').update({ replaced_by_jti: newJti }).eq('jti', prev.jti);
    if (error) console.error('Supabase update previous token error', error.message);
  } else {
    prev.replacedByJti = newJti;
  }
}

export async function findStoredByToken(token: string): Promise<StoredRecord | null> {
  const sb = getSupabase();
  if (sb) {
    // Inefficient without plaintext; fetch recent for user after hash brute-force impossible; store all and compare hash
    const { data, error } = await sb.from('refresh_tokens').select('*').order('created_at', { ascending: false }).limit(500);
    if (error || !data) return null;
    for (const row of data) {
      if (await bcrypt.compare(token, row.token_hash)) {
        return {
          tokenHash: row.token_hash,
            userId: row.user_id,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
            familyId: row.family_id,
            jti: row.jti,
            revoked: row.revoked,
            prevJti: row.prev_jti || undefined,
            replacedByJti: row.replaced_by_jti || undefined,
            reason: row.reason || undefined
        };
      }
    }
    return null;
  }
  for (const rec of memory.values()) {
    if (await bcrypt.compare(token, rec.tokenHash)) return rec;
  }
  return null;
}

export async function validateRefreshToken(token: string): Promise<StoredRecord | null> {
  const rec = await findStoredByToken(token);
  if (!rec) return null;
  if (rec.revoked) return null;
  if (new Date(rec.expiresAt).getTime() < Date.now()) return null;
  return rec;
}

export async function rotateRefreshToken(oldToken: string): Promise<{ userId: string; newToken: RefreshTokenRecord } | null> {
  const existing = await validateRefreshToken(oldToken);
  if (!existing) return null;
  // Detect reuse: if replacedByJti already set -> revoke family
  if (existing.replacedByJti) {
    await revokeFamily(existing.familyId, 'TOKEN_REUSE_DETECTED');
    return null;
  }
  const newToken = await issueRefreshToken(existing.userId, existing.familyId, existing);
  return { userId: existing.userId, newToken };
}

export async function revokeFamily(familyId: string, reason: string) {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('refresh_tokens').update({ revoked: true, reason }).eq('family_id', familyId);
    if (error) console.error('Supabase revoke family error', error.message);
  } else {
    for (const rec of memory.values()) if (rec.familyId === familyId) { rec.revoked = true; rec.reason = reason; }
  }
}

export async function revokeToken(token: string, reason = 'MANUAL_REVOKE') {
  const rec = await findStoredByToken(token);
  if (!rec) return;
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('refresh_tokens').update({ revoked: true, reason }).eq('jti', rec.jti);
    if (error) console.error('Supabase revoke token error', error.message);
  } else {
    rec.revoked = true; rec.reason = reason;
  }
}
