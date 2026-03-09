import { NextRequest, NextResponse } from "next/server";
import { auditDependencies } from "@/lib/claude";
import { TOOL_NAME_DEPENDENCY_AUDIT } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";
import { cookies } from "next/headers";
import { resolvePersona } from "@/lib/utils";
import { getPersonaInstruction } from "@/lib/persona-prompts";
import { getUserProfile } from "@/lib/user-profile";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_DEPENDENCY_AUDIT);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { dependencyFile, language, framework } = body as {
    dependencyFile?: string;
    language?: string;
    framework?: string;
  };

  if (!dependencyFile?.trim()) {
    return NextResponse.json({ error: "Dependency file content is required" }, { status: 400 });
  }
  if (dependencyFile.length > 5000) {
    return NextResponse.json({ error: "Dependency file exceeds 5,000 character limit" }, { status: 400 });
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
    result = await auditDependencies(dependencyFile.trim(), language, framework || "unknown", personaInstruction);
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Failed to audit dependencies. Please try again." }, { status: 500 });
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_DEPENDENCY_AUDIT);
  return NextResponse.json(result);
}
