import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateUserProfile } from "@/lib/user-profile";
import type { Persona, ComfortLevel, PrimaryGoal } from "@/lib/types/persona";

const VALID_PERSONAS: Persona[] = ["business_owner", "support_ops", "implementer"];
const VALID_COMFORT: ComfortLevel[] = ["guided", "docs_configs", "writes_code"];
const VALID_GOALS: PrimaryGoal[] = ["setup", "fixing", "evaluating", "exploring"];

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { persona, comfortLevel, platforms, primaryGoal } = body as Record<string, unknown>;

  // Validate fields if provided
  if (persona !== undefined && !VALID_PERSONAS.includes(persona as Persona)) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
  }
  if (comfortLevel !== undefined && !VALID_COMFORT.includes(comfortLevel as ComfortLevel)) {
    return NextResponse.json({ error: "Invalid comfort level" }, { status: 400 });
  }
  if (primaryGoal !== undefined && !VALID_GOALS.includes(primaryGoal as PrimaryGoal)) {
    return NextResponse.json({ error: "Invalid primary goal" }, { status: 400 });
  }
  if (platforms !== undefined && !Array.isArray(platforms)) {
    return NextResponse.json({ error: "Platforms must be an array" }, { status: 400 });
  }

  try {
    await updateUserProfile(user.id, {
      persona: persona as Persona | undefined,
      comfortLevel: comfortLevel as ComfortLevel | undefined,
      platforms: platforms as string[] | undefined,
      primaryGoal: primaryGoal as PrimaryGoal | undefined,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
