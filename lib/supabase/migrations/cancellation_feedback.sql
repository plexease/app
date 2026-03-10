-- Add cancellation feedback flag to subscriptions table
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS show_cancellation_feedback BOOLEAN DEFAULT FALSE;
