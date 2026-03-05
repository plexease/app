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
  user_id uuid references public.users(id) on delete cascade not null,
  plan text default 'free' not null check (plan in ('free', 'pro')),
  status text default 'active' not null check (status in ('active', 'cancelled', 'past_due')),
  stripe_subscription_id text,
  created_at timestamptz default now() not null
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Usage table
create table public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  tool_name text not null,
  date date default current_date not null,
  count integer default 0 not null
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
