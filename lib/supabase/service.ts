import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service role client for server-side operations that bypass RLS
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
