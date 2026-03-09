-- Feedback collection (CRM-ready)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  trigger_type text not null
    check (trigger_type in ('fifth_use', 'cancellation', 'manual')),
  tool_name text,
  persona text,
  tier text,
  status text not null default 'new'
    check (status in ('new', 'acknowledged', 'resolved')),
  resolution text,
  created_at timestamptz not null default now()
);

-- Index for admin queries
create index idx_feedback_status on public.feedback(status);
create index idx_feedback_user_id on public.feedback(user_id);

-- Feedback dismissal tracking
create table if not exists public.feedback_dismissals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_type text not null
    check (trigger_type in ('fifth_use', 'cancellation')),
  dismissed_at timestamptz not null default now(),
  unique(user_id, trigger_type)
);

-- RLS policies
alter table public.feedback enable row level security;
alter table public.feedback_dismissals enable row level security;

create policy "Users can insert their own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

create policy "Users can insert their own dismissals"
  on public.feedback_dismissals for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own dismissals"
  on public.feedback_dismissals for select
  using (auth.uid() = user_id);
