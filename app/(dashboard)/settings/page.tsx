import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/user-profile";
import { ProfileSettings } from "@/components/settings/profile-settings";

export const metadata = {
  title: "Settings — Plexease",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getUserProfile(user.id);

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
    </div>
  );
}
