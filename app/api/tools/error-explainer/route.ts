import { NextRequest, NextResponse } from "next/server";
import { getErrorExplanation } from "@/lib/claude";
import { TOOL_NAME_ERROR_EXPLAINER } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";
import { cookies } from "next/headers";
import { resolvePersona } from "@/lib/utils";
import { getPersonaInstruction } from "@/lib/persona-prompts";
import { getUserProfile } from "@/lib/user-profile";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_ERROR_EXPLAINER);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { errorLog, language, framework } = body as {
    errorLog?: string;
    language?: string;
    framework?: string;
  };

  if (!errorLog?.trim()) {
    return NextResponse.json({ error: "Error log is required" }, { status: 400 });
  }

  if (errorLog.length > 3000) {
    return NextResponse.json({ error: "Error log exceeds 3,000 character limit" }, { status: 400 });
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
    result = await getErrorExplanation(
      errorLog.trim(),
      language,
      framework || "unknown",
      personaInstruction
    );
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to analyse error. Please try again." },
      { status: 500 }
    );
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_ERROR_EXPLAINER);

  return NextResponse.json(result);
}
