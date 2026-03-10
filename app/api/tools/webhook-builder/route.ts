import { NextRequest, NextResponse } from "next/server";
import { getWebhookSetup } from "@/lib/claude";
import { TOOL_NAME_WEBHOOK_BUILDER } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";
import { getUserProfile } from "@/lib/user-profile";
import { resolvePersona } from "@/lib/utils";
import { getPersonaInstruction } from "@/lib/persona-prompts";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_WEBHOOK_BUILDER);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sourceApp, targetApp, events } = body as {
    sourceApp?: string;
    targetApp?: string;
    events?: string;
  };

  if (!sourceApp?.trim()) {
    return NextResponse.json({ error: "Source app is required" }, { status: 400 });
  }
  if (!targetApp?.trim()) {
    return NextResponse.json({ error: "Target app is required" }, { status: 400 });
  }
  if (events && events.length > 1000) {
    return NextResponse.json({ error: "Events exceeds 1,000 character limit" }, { status: 400 });
  }

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
    result = await getWebhookSetup(
      sourceApp.trim(),
      targetApp.trim(),
      events?.trim() || undefined,
      personaInstruction
    );
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Failed to create webhook guide. Please try again." }, { status: 500 });
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_WEBHOOK_BUILDER);
  return NextResponse.json(result);
}
