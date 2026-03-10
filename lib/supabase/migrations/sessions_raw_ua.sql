-- Add raw User-Agent storage to sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS raw_user_agent TEXT;
