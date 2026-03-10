import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteSession } from "@/lib/sessions";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;
  await deleteSession(user.id, sessionId);
  return NextResponse.json({ success: true });
}
