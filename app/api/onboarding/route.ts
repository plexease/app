import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUserProfile } from "@/lib/user-profile";
import type { Persona, ComfortLevel, PrimaryGoal } from "@/lib/types/persona";

const VALID_PERSONAS: Persona[] = ["business_owner", "support_ops", "implementer"];
const VALID_COMFORT: ComfortLevel[] = ["guided", "docs_configs", "writes_code"];
const VALID_GOALS: PrimaryGoal[] = ["setup", "fixing", "evaluating", "exploring"];

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { persona, comfortLevel, platforms, primaryGoal } = body as {
    persona?: string;
    comfortLevel?: string;
    platforms?: string[];
    primaryGoal?: string;
  };

  // Validate persona (required)
  if (!persona || !VALID_PERSONAS.includes(persona as Persona)) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
  }

  // Validate optional fields
  if (comfortLevel && !VALID_COMFORT.includes(comfortLevel as ComfortLevel)) {
    return NextResponse.json({ error: "Invalid comfort level" }, { status: 400 });
  }
  if (primaryGoal && !VALID_GOALS.includes(primaryGoal as PrimaryGoal)) {
    return NextResponse.json({ error: "Invalid primary goal" }, { status: 400 });
  }
  if (platforms && !Array.isArray(platforms)) {
    return NextResponse.json({ error: "Platforms must be an array" }, { status: 400 });
  }

  // Create profile
  try {
    await createUserProfile(user.id, {
      persona: persona as Persona,
      comfortLevel: comfortLevel as ComfortLevel | undefined,
      platforms: platforms as string[] | undefined,
      primaryGoal: primaryGoal as PrimaryGoal | undefined,
    });
  } catch {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }

  // Set onboarding cookie so middleware skips DB check
  const response = NextResponse.json({ success: true });
  response.cookies.set("plexease_onboarded", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
