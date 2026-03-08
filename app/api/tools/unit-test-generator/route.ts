import { NextRequest, NextResponse } from "next/server";
import { generateUnitTests } from "@/lib/claude";
import { TOOL_NAME_UNIT_TEST_GENERATOR } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_UNIT_TEST_GENERATOR);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { code, language, framework } = body as {
    code?: string;
    language?: string;
    framework?: string;
  };

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
    result = await generateUnitTests(
      code.trim(),
      language,
      framework || "unknown"
    );
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to generate tests. Please try again." },
      { status: 500 }
    );
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_UNIT_TEST_GENERATOR);

  return NextResponse.json(result);
}
