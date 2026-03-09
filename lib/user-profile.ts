import { createClient } from "@/lib/supabase/server";
import type { UserProfile, Persona, ComfortLevel, PrimaryGoal } from "@/lib/types/persona";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    persona: data.persona as Persona,
    comfortLevel: data.comfort_level as ComfortLevel | null,
    platforms: data.platforms ?? [],
    primaryGoal: data.primary_goal as PrimaryGoal | null,
    onboardingCompleted: data.onboarding_completed,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function createUserProfile(
  userId: string,
  profile: {
    persona: Persona;
    comfortLevel?: ComfortLevel;
    platforms?: string[];
    primaryGoal?: PrimaryGoal;
  }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").insert({
    id: userId,
    persona: profile.persona,
    comfort_level: profile.comfortLevel ?? null,
    platforms: profile.platforms ?? [],
    primary_goal: profile.primaryGoal ?? null,
    onboarding_completed: true,
  });

  if (error) {
    console.error("Failed to create user profile:", error.message);
    throw new Error("Failed to save profile");
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    persona: Persona;
    comfortLevel: ComfortLevel;
    platforms: string[];
    primaryGoal: PrimaryGoal;
  }>
): Promise<void> {
  const supabase = await createClient();
  const dbUpdates: Record<string, unknown> = {};

  if (updates.persona !== undefined) dbUpdates.persona = updates.persona;
  if (updates.comfortLevel !== undefined) dbUpdates.comfort_level = updates.comfortLevel;
  if (updates.platforms !== undefined) dbUpdates.platforms = updates.platforms;
  if (updates.primaryGoal !== undefined) dbUpdates.primary_goal = updates.primaryGoal;

  const { error } = await supabase
    .from("user_profiles")
    .update(dbUpdates)
    .eq("id", userId);

  if (error) {
    console.error("Failed to update user profile:", error.message);
    throw new Error("Failed to update profile");
  }
}

export async function isOnboarded(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .single();

  return data?.onboarding_completed ?? false;
}
