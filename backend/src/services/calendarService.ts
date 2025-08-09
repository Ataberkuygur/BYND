import { getSupabase } from '../utils/supabase';

export interface CalendarEventInput { title: string; start: string; end?: string; description?: string; }
export interface CalendarEvent extends CalendarEventInput { id: string; userId: string; createdAt: string; }

// In-memory fallback when Supabase not configured
const memoryEvents: CalendarEvent[] = [];

export async function scheduleTaskAsEvent(userId: string, task: CalendarEventInput): Promise<CalendarEvent> {
  const evt: CalendarEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    userId,
    title: task.title,
    start: task.start,
    end: task.end,
    description: task.description,
    createdAt: new Date().toISOString()
  };
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('calendar_events').insert({
      id: evt.id,
      user_id: evt.userId,
      title: evt.title,
      start: evt.start,
      end: evt.end,
      description: evt.description,
      created_at: evt.createdAt
    });
    if (error) console.error('Supabase insert calendar event error', error.message);
  } else {
    memoryEvents.unshift(evt);
  }
  return evt;
}

export async function listEvents(userId: string): Promise<CalendarEvent[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from('calendar_events').select('*').eq('user_id', userId).order('start', { ascending: false }).limit(100);
    if (error) { console.error('Supabase list events error', error.message); return []; }
    return (data || []).map(r => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      start: r.start,
      end: r.end || undefined,
      description: r.description || undefined,
      createdAt: r.created_at
    }));
  }
  return memoryEvents.filter(e => e.userId === userId).slice(0, 100);
}

export async function deleteEvent(userId: string, id: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    const { error } = await sb.from('calendar_events').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      console.error('Supabase delete event error', error.message);
      return false;
    }
    return true;
  }
  // In-memory fallback
  const index = memoryEvents.findIndex(e => e.id === id && e.userId === userId);
  if (index === -1) return false;
  memoryEvents.splice(index, 1);
  return true;
}
