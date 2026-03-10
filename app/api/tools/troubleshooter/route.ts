import { NextRequest, NextResponse } from "next/server";
import { troubleshootIntegration } from "@/lib/claude";
import { TOOL_NAME_TROUBLESHOOTER } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";
import { cookies } from "next/headers";
import { resolvePersona } from "@/lib/utils";
import { getPersonaInstruction } from "@/lib/persona-prompts";
import { getUserProfile } from "@/lib/user-profile";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_TROUBLESHOOTER);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { problem, platforms, recentChanges } = body as {
    problem?: string;
    platforms?: string;
    recentChanges?: string;
  };

  if (!problem?.trim()) {
    return NextResponse.json({ error: "Problem description is required" }, { status: 400 });
  }

  if (problem.length > 2000) {
    return NextResponse.json({ error: "Problem description exceeds 2,000 character limit" }, { status: 400 });
  }

  if (recentChanges && recentChanges.length > 1000) {
    return NextResponse.json({ error: "Recent changes exceeds 1,000 character limit" }, { status: 400 });
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
    result = await troubleshootIntegration(
      problem.trim(),
      platforms || undefined,
      recentChanges || undefined,
      personaInstruction
    );
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to diagnose problem. Please try again." },
      { status: 500 }
    );
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_TROUBLESHOOTER);

  return NextResponse.json(result);
}
