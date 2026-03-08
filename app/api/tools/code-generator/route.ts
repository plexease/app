import { NextRequest, NextResponse } from "next/server";
import { generateIntegrationCode } from "@/lib/claude";
import { TOOL_NAME_CODE_GENERATOR } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_CODE_GENERATOR);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { spec, language, framework } = body as {
    spec?: string;
    language?: string;
    framework?: string;
  };

  if (!spec?.trim()) {
    return NextResponse.json({ error: "Spec is required" }, { status: 400 });
  }
  if (spec.length > 2000) {
    return NextResponse.json({ error: "Spec exceeds 2,000 character limit" }, { status: 400 });
  }
  if (!language) {
    return NextResponse.json({ error: "Language is required" }, { status: 400 });
  }

  let result;
  try {
    result = await generateIntegrationCode(spec.trim(), language, framework || "unknown");
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Failed to generate code. Please try again." }, { status: 500 });
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_CODE_GENERATOR);
  return NextResponse.json(result);
}
