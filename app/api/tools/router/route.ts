import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROUTER_DAILY_LIMIT, TOOL_NAME_ROUTER } from "@/lib/constants";
import { TOOL_CATALOG } from "@/lib/tool-descriptions";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { query } = body as { query?: string };

  if (!query?.trim() || query.length > 500) {
    return NextResponse.json({ error: "Query is required (max 500 chars)" }, { status: 400 });
  }

  // Check daily rate limit (uses today's date as the "month" field for daily tracking)
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const { data: routerUsage } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("tool_name", TOOL_NAME_ROUTER)
    .eq("month", today);

  const dailyCount = routerUsage?.[0]?.count ?? 0;

  if (dailyCount >= ROUTER_DAILY_LIMIT) {
    return NextResponse.json(
      { error: "Daily routing limit reached", rateLimited: true },
      { status: 429 }
    );
  }

  // Build tool list for Claude
  const toolList = Object.entries(TOOL_CATALOG)
    .map(([id, tool]) => `- ${id}: ${tool.label} — ${tool.descriptions.business_owner}`)
    .join("\n");

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `You are a tool router. Given the user's description, pick the most relevant tool from this list:

${toolList}

User's description: "${query.trim()}"

Return ONLY valid JSON — no markdown, no explanation:
{"tool": "tool-id", "reason": "One sentence explaining why this tool fits."}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: { tool: string; reason: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Failed to parse routing response" }, { status: 500 });
    }

    // Validate tool ID
    const validToolIds = Object.keys(TOOL_CATALOG);
    if (!validToolIds.includes(parsed.tool)) {
      return NextResponse.json({ error: "Could not determine tool" }, { status: 404 });
    }

    // Increment router usage (daily)
    await supabase.rpc("increment_usage", {
      p_user_id: user.id,
      p_tool_name: TOOL_NAME_ROUTER,
      p_month: today,
    });

    return NextResponse.json({
      tool: parsed.tool,
      reason: parsed.reason,
    });
  } catch (err) {
    console.error("Router Claude error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Routing failed" }, { status: 500 });
  }
}
