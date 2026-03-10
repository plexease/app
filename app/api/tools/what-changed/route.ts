import { NextRequest, NextResponse } from "next/server";
import { analyseChange } from "@/lib/claude";
import { TOOL_NAME_WHAT_CHANGED } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";
import { cookies } from "next/headers";
import { resolvePersona } from "@/lib/utils";
import { getPersonaInstruction } from "@/lib/persona-prompts";
import { getUserProfile } from "@/lib/user-profile";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_WHAT_CHANGED);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { change, currentSetup } = body as {
    change?: string;
    currentSetup?: string;
  };

  if (!change?.trim()) {
    return NextResponse.json({ error: "Change description is required" }, { status: 400 });
  }

  if (change.length > 2000) {
    return NextResponse.json({ error: "Change description exceeds 2,000 character limit" }, { status: 400 });
  }

  if (currentSetup && currentSetup.length > 1000) {
    return NextResponse.json({ error: "Current setup exceeds 1,000 character limit" }, { status: 400 });
  }

  // Resolve persona
  const profile = await getUserProfile(auth.context.userId);
  const cookieStore = await cookies();
  const persona = resolvePersona(
    (body as { persona?: string }).persona,
    cookieStore.get("viewing_as")?.value,
    profile?.persona
  );
  const personaInstruction = getPersonaInstruction(persona);

  let result;
  try {
    result = await analyseChange(
      change.trim(),
      currentSetup?.trim(),
      personaInstruction
    );
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to analyse change. Please try again." },
      { status: 500 }
    );
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_WHAT_CHANGED);

  return NextResponse.json(result);
}
