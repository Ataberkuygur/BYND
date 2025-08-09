import { User } from '../models/User';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { getSupabase } from '../utils/supabase';

const memoryUsers = new Map<string, User>();

export async function createUser(email: string, password: string): Promise<User> {
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = { id, email: email.toLowerCase(), passwordHash, createdAt: new Date().toISOString() };
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('users').insert({
      id: user.id,
      email: user.email,
      password_hash: user.passwordHash,
      created_at: user.createdAt
    });
    if (error) console.error('Supabase create user error', error.message);
  } else {
    memoryUsers.set(id, user);
  }
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const lower = email.toLowerCase();
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('users').select('*').eq('email', lower).maybeSingle();
    if (error) { console.error('Supabase get user error', error.message); return undefined; }
    if (!data) return undefined;
    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      createdAt: data.created_at,
      voiceSampleUrl: data.voice_sample_url || undefined,
      elevenLabsVoiceId: data.elevenlabs_voice_id || undefined
    };
  }
  return [...memoryUsers.values()].find(u => u.email === lower);
}

export async function verifyUser(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('users').select('*').eq('id', id).maybeSingle();
    if (error || !data) return undefined;
    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      createdAt: data.created_at,
      voiceSampleUrl: data.voice_sample_url || undefined,
      elevenLabsVoiceId: data.elevenlabs_voice_id || undefined
    };
  }
  return memoryUsers.get(id);
}
