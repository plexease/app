-- User profile and persona settings
create table if not exists public.user_profiles (
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

-- RLS policies
alter table public.user_profiles enable row level security;

create policy "Users can read their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Auto-update updated_at
create or replace function public.update_user_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row
  execute function public.update_user_profiles_updated_at();
