-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamptz default now() not null,
  stripe_customer_id text
);

alter table public.users enable row level security;

create policy "Users can read own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own data"
  on public.users for update
  using (auth.uid() = id);

-- Subscriptions table
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  plan text default 'free' not null check (plan in ('free', 'essentials', 'pro')),
  status text default 'active' not null check (status in ('active', 'cancelled', 'past_due')),
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false not null,
  grace_period_end timestamptz,
  show_cancellation_feedback boolean default false,
  created_at timestamptz default now() not null
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Prevent double active subscriptions
create unique index one_active_sub_per_user
  on public.subscriptions (user_id)
  where status = 'active';

-- Usage table
create table public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  tool_name text not null,
  month date not null,
  count integer default 0 not null,
  constraint usage_user_tool_month_unique unique (user_id, tool_name, month)
);

alter table public.usage enable row level security;

create policy "Users can read own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.usage for update
  using (auth.uid() = user_id);

-- Atomic usage increment (security definer bypasses RLS safely — auth checked in API route)
create or replace function increment_usage(
  p_user_id uuid,
  p_tool_name text,
  p_month date
) returns void as $$
begin
  insert into public.usage (user_id, tool_name, month, count)
  values (p_user_id, p_tool_name, p_month, 1)
  on conflict (user_id, tool_name, month)
  do update set count = usage.count + 1;
end;
$$ language plpgsql security definer;

-- Webhook event deduplication
create table public.processed_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz default now() not null
);

alter table public.processed_events enable row level security;

-- Trigger: auto-create user row + free subscription on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- User profiles (persona and onboarding)
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  persona text not null default 'business_owner'
    check (persona in ('business_owner', 'support_ops', 'implementer')),
  comfort_level text
    check (comfort_level in ('guided', 'docs_configs', 'writes_code')),
  platforms text[] default '{}',
  primary_goal text
    check (primary_goal in ('setup', 'fixing', 'evaluating', 'exploring')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users can read their own profile"
  on public.user_profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.user_profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.user_profiles for update using (auth.uid() = id);

-- Sessions (concurrent session enforcement)
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_info text,
  raw_user_agent text,
  ip_hash text,
  last_active timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_sessions_user_id on public.sessions(user_id);
alter table public.sessions enable row level security;

create policy "Users can read their own sessions"
  on public.sessions for select using (auth.uid() = user_id);
create policy "Users can delete their own sessions"
  on public.sessions for delete using (auth.uid() = user_id);

-- Feedback collection (CRM-ready)
create table public.feedback (
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

create index idx_feedback_status on public.feedback(status);
create index idx_feedback_user_id on public.feedback(user_id);

-- Feedback dismissal tracking
create table public.feedback_dismissals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_type text not null
    check (trigger_type in ('fifth_use', 'cancellation')),
  dismissed_at timestamptz not null default now(),
  unique(user_id, trigger_type)
);

alter table public.feedback enable row level security;
alter table public.feedback_dismissals enable row level security;

create policy "Users can insert their own feedback"
  on public.feedback for insert with check (auth.uid() = user_id);
create policy "Users can read their own feedback"
  on public.feedback for select using (auth.uid() = user_id);
create policy "Users can insert their own dismissals"
  on public.feedback_dismissals for insert with check (auth.uid() = user_id);
create policy "Users can read their own dismissals"
  on public.feedback_dismissals for select using (auth.uid() = user_id);
