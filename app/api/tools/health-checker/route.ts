import { NextRequest, NextResponse } from "next/server";
import { checkHealth } from "@/lib/claude";
import { TOOL_NAME_HEALTH_CHECKER } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_HEALTH_CHECKER);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { config, language, framework } = body as {
    config?: string;
    language?: string;
    framework?: string;
  };

  if (!config?.trim()) {
    return NextResponse.json({ error: "Configuration is required" }, { status: 400 });
  }

  if (config.length > 2000) {
    return NextResponse.json({ error: "Configuration exceeds 2,000 character limit" }, { status: 400 });
  }

  if (!language) {
    return NextResponse.json({ error: "Language is required" }, { status: 400 });
  }

  let result;
  try {
    result = await checkHealth(
      config.trim(),
      language,
      framework || "unknown"
    );
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to check health. Please try again." },
      { status: 500 }
    );
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_HEALTH_CHECKER);

  return NextResponse.json(result);
}
