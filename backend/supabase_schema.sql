-- Users table
create table if not exists public.users (
  id uuid primary key,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  voice_sample_url text,
  elevenlabs_voice_id text
);

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key,
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  source text
);
create index if not exists tasks_user_id_idx on public.tasks(user_id);

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

-- Calendar events table (new)
create table if not exists public.calendar_events (
  id text primary key,
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  start timestamptz not null,
  "end" timestamptz,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists calendar_events_user_id_idx on public.calendar_events(user_id);

-- Refresh tokens (opaque) for session management
create table if not exists public.refresh_tokens (
  token_hash text primary key,               -- bcrypt hash of opaque token
  user_id uuid references public.users(id) on delete cascade,
  family_id text not null,                   -- stable per login session family
  jti text not null,                         -- unique id of this refresh token
  prev_jti text,                             -- previous token jti in rotation chain
  replaced_by_jti text,                      -- next token jti if rotated
  revoked boolean not null default false,
  reason text,                               -- optional revoke reason
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists refresh_tokens_user_id_idx on public.refresh_tokens(user_id);
create index if not exists refresh_tokens_family_idx on public.refresh_tokens(family_id);

-- Conversations table for chat functionality
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null check (type in ('past_self', 'future_self', 'reflection')),
  messages jsonb not null default '[]'::jsonb,
  voice_message_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_user_id_idx on public.conversations(user_id);
create index if not exists conversations_type_idx on public.conversations(type);
create index if not exists conversations_updated_at_idx on public.conversations(updated_at);

-- Trigger to update updated_at for conversations
drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at
before update on public.conversations
for each row execute procedure public.set_updated_at();
