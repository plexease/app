import { NextRequest, NextResponse } from "next/server";
import { getMigrationPlan } from "@/lib/claude";
import { TOOL_NAME_UPGRADE_ASSISTANT } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";
import { cookies } from "next/headers";
import { resolvePersona } from "@/lib/utils";
import { getPersonaInstruction } from "@/lib/persona-prompts";
import { getUserProfile } from "@/lib/user-profile";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_UPGRADE_ASSISTANT);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { migratingFrom, migratingTo, code, language, framework } = body as {
    migratingFrom?: string;
    migratingTo?: string;
    code?: string;
    language?: string;
    framework?: string;
  };

  if (!migratingFrom?.trim()) {
    return NextResponse.json({ error: "Migrating from is required" }, { status: 400 });
  }

  if (!migratingTo?.trim()) {
    return NextResponse.json({ error: "Migrating to is required" }, { status: 400 });
  }

  if (migratingFrom.length > 200) {
    return NextResponse.json({ error: "Migrating from exceeds 200 character limit" }, { status: 400 });
  }

  if (migratingTo.length > 200) {
    return NextResponse.json({ error: "Migrating to exceeds 200 character limit" }, { status: 400 });
  }

  if (!code?.trim()) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  if (code.length > 5000) {
    return NextResponse.json({ error: "Code exceeds 5,000 character limit" }, { status: 400 });
  }

  if (!language) {
    return NextResponse.json({ error: "Language is required" }, { status: 400 });
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
    result = await getMigrationPlan(
      migratingFrom.trim(),
      migratingTo.trim(),
      code.trim(),
      language,
      framework || "unknown",
      personaInstruction
    );
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to create migration plan. Please try again." },
      { status: 500 }
    );
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_UPGRADE_ASSISTANT);

  return NextResponse.json(result);
}
