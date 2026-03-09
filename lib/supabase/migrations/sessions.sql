-- Session management for concurrent session enforcement
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_info text,
  ip_hash text,
  last_active timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index for efficient session lookup by user
create index idx_sessions_user_id on public.sessions(user_id);

-- RLS policies
alter table public.sessions enable row level security;

create policy "Users can read their own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- Insert/update handled by service role (server-side only)
