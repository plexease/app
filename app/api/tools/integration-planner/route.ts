import { NextRequest, NextResponse } from "next/server";
import { getIntegrationPlan } from "@/lib/claude";
import { TOOL_NAME_INTEGRATION_PLANNER } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_INTEGRATION_PLANNER);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { description, language, framework } = body as {
    description?: string;
    language?: string;
    framework?: string;
  };

  if (!description?.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (description.length > 2000) {
    return NextResponse.json({ error: "Description exceeds 2,000 character limit" }, { status: 400 });
  }
  if (!language) {
    return NextResponse.json({ error: "Language is required" }, { status: 400 });
  }

  let result;
  try {
    result = await getIntegrationPlan(description.trim(), language, framework || "unknown");
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Failed to create plan. Please try again." }, { status: 500 });
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_INTEGRATION_PLANNER);
  return NextResponse.json(result);
}
