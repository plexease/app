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
  plan text default 'free' not null check (plan in ('free', 'pro')),
  status text default 'active' not null check (status in ('active', 'cancelled', 'past_due')),
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false not null,
  grace_period_end timestamptz,
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
