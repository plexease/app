import { NextRequest, NextResponse } from "next/server";
import { getMigrationPlan } from "@/lib/claude";
import { TOOL_NAME_MIGRATION_ASSISTANT } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_MIGRATION_ASSISTANT);
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

  let result;
  try {
    result = await getMigrationPlan(
      migratingFrom.trim(),
      migratingTo.trim(),
      code.trim(),
      language,
      framework || "unknown"
    );
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to create migration plan. Please try again." },
      { status: 500 }
    );
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_MIGRATION_ASSISTANT);

  return NextResponse.json(result);
}
