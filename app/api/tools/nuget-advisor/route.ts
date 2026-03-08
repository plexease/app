import { NextRequest, NextResponse } from "next/server";
import { getNuGetAdvice } from "@/lib/claude";
import { TOOL_NAME_NUGET_ADVISOR } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_NUGET_ADVISOR);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const packageName = (body as { packageName?: string })?.packageName?.trim();

  if (!packageName) {
    return NextResponse.json({ error: "Package name is required" }, { status: 400 });
  }

  if (packageName.length > 200) {
    return NextResponse.json({ error: "Package name is too long" }, { status: 400 });
  }

  let result;
  try {
    result = await getNuGetAdvice(packageName);
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to get advice. Please try again." },
      { status: 500 }
    );
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_NUGET_ADVISOR);

  return NextResponse.json(result);
}
