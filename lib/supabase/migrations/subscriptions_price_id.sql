-- Add stripe_price_id to subscriptions for tier detection
alter table public.subscriptions
  add column if not exists stripe_price_id text;

-- Update plan column to support new tier
-- Old values: 'free', 'pro'
-- New values: 'free', 'essentials', 'pro'
alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('free', 'essentials', 'pro'));
