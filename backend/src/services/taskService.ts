import { Task } from '../models/Task';
import { randomUUID } from 'crypto';
import { getSupabase } from '../utils/supabase';

// In-memory fallback
const memoryTasks = new Map<string, Task>();

export async function createTask(userId: string, data: Partial<Pick<Task, 'title' | 'description' | 'dueAt' | 'source'>>): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    userId,
    title: data.title || 'Untitled',
    description: data.description,
    dueAt: data.dueAt,
    createdAt: now,
    updatedAt: now,
    source: data.source || 'user'
  };
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('tasks').insert({
      id: task.id,
      user_id: task.userId,
      title: task.title,
      description: task.description,
      due_at: task.dueAt,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
      source: task.source
    });
    if (error) console.error('Supabase insert task error', error.message);
  } else {
    memoryTasks.set(task.id, task);
  }
  return task;
}

export async function listTasks(userId: string): Promise<Task[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.error('Supabase list tasks error', error.message); return []; }
    return (data || []).map(r => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      description: r.description || undefined,
      dueAt: r.due_at || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      completedAt: r.completed_at || undefined,
      source: r.source || 'user'
    } as Task));
  }
  return [...memoryTasks.values()].filter(t => t.userId === userId);
}

export async function updateTask(userId: string, id: string, patch: Partial<Pick<Task, 'title' | 'description' | 'dueAt' | 'completedAt'>>): Promise<Task | null> {
  const sb = getSupabase();
  if (sb) {
    const updatedAt = new Date().toISOString();
    const { data, error } = await sb.from('tasks').update({
      title: patch.title,
      description: patch.description,
      due_at: patch.dueAt,
      completed_at: patch.completedAt,
      updated_at: updatedAt
    }).eq('id', id).eq('user_id', userId).select('*').single();
    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description || undefined,
      dueAt: data.due_at || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at || undefined,
      source: data.source || 'user'
    };
  }
  const existing = memoryTasks.get(id);
  if (!existing || existing.userId !== userId) return null;
  const updated: Task = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  memoryTasks.set(id, updated);
  return updated;
}

export async function deleteTask(userId: string, id: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('tasks').delete().eq('id', id).eq('user_id', userId);
    if (error) return false;
    return true;
  }
  const existing = memoryTasks.get(id);
  if (!existing || existing.userId !== userId) return false;
  return memoryTasks.delete(id);
}
