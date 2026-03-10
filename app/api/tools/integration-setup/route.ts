import { NextRequest, NextResponse } from "next/server";
import { getIntegrationSetup } from "@/lib/claude";
import { TOOL_NAME_INTEGRATION_SETUP } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";
import { cookies } from "next/headers";
import { resolvePersona } from "@/lib/utils";
import { getPersonaInstruction } from "@/lib/persona-prompts";
import { getUserProfile } from "@/lib/user-profile";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_INTEGRATION_SETUP);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { platformA, platformB, goal } = body as {
    platformA?: string;
    platformB?: string;
    goal?: string;
  };

  if (!platformA?.trim()) {
    return NextResponse.json({ error: "First platform is required" }, { status: 400 });
  }
  if (!platformB?.trim()) {
    return NextResponse.json({ error: "Second platform is required" }, { status: 400 });
  }
  if (goal && goal.length > 1000) {
    return NextResponse.json({ error: "Goal exceeds 1,000 character limit" }, { status: 400 });
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
    result = await getIntegrationSetup(platformA.trim(), platformB.trim(), goal?.trim(), personaInstruction);
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Failed to create setup guide. Please try again." }, { status: 500 });
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_INTEGRATION_SETUP);
  return NextResponse.json(result);
}
