import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/user-profile";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { ActiveSessions } from "@/components/settings/active-sessions";

export const metadata = {
  title: "Settings — Plexease",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getUserProfile(user.id);
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("plexease_session_id")?.value;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-white">Settings</h1>
      <p className="mt-2 text-muted-400">
        Update your profile and preferences.
      </p>

      <div className="mt-8 max-w-lg">
        <ProfileSettings
          initialProfile={profile ? {
            persona: profile.persona,
            comfortLevel: profile.comfortLevel,
            platforms: profile.platforms,
            primaryGoal: profile.primaryGoal,
          } : null}
        />
      </div>

      <div className="mt-12 max-w-lg">
        <h2 className="font-heading text-xl font-bold text-white">Active Sessions</h2>
        <p className="mt-2 text-muted-400">
          Manage devices signed in to your account.
        </p>
        <div className="mt-4">
          <ActiveSessions currentSessionId={sessionId ?? ""} />
        </div>
      </div>
    </div>
  );
}
