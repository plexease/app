import { NextRequest, NextResponse } from "next/server";
import { getAuthGuide } from "@/lib/claude";
import { TOOL_NAME_AUTH_GUIDE } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";
import { cookies } from "next/headers";
import { resolvePersona } from "@/lib/utils";
import { getPersonaInstruction } from "@/lib/persona-prompts";
import { getUserProfile } from "@/lib/user-profile";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_AUTH_GUIDE);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { service, purpose } = body as {
    service?: string;
    purpose?: string;
  };

  if (!service?.trim()) {
    return NextResponse.json({ error: "Service is required" }, { status: 400 });
  }

  if (purpose && purpose.length > 1000) {
    return NextResponse.json({ error: "Purpose exceeds 1,000 character limit" }, { status: 400 });
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
    result = await getAuthGuide(
      service.trim(),
      purpose?.trim(),
      personaInstruction
    );
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to create auth guide. Please try again." },
      { status: 500 }
    );
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_AUTH_GUIDE);

  return NextResponse.json(result);
}
