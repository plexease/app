"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear onboarding cookie so it doesn't leak to the next user
    document.cookie = "plexease_onboarded=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-muted-400 hover:bg-surface-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
    >
      Sign out
    </button>
  );
}
