import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSessions, deleteOtherSessions } from "@/lib/sessions";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await getUserSessions(user.id);
  return NextResponse.json(sessions);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const allOthers = searchParams.get("all_others") === "true";

  if (!allOthers) {
    return NextResponse.json({ error: "Missing all_others=true param" }, { status: 400 });
  }

  // Read current session ID from cookie
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/plexease_session_id=([^;]+)/);
  const currentSessionId = match?.[1];

  if (!currentSessionId) {
    return NextResponse.json({ error: "No active session" }, { status: 400 });
  }

  await deleteOtherSessions(user.id, currentSessionId);
  return NextResponse.json({ success: true });
}
