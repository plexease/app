import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Persona } from "@/lib/types/persona";

const VALID_PERSONAS: Persona[] = ["business_owner", "support_ops", "implementer"];

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { viewingAs } = body as { viewingAs?: string };

  if (!viewingAs || !VALID_PERSONAS.includes(viewingAs as Persona)) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set("viewing_as", viewingAs, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Session cookie — cleared when browser closes
  });

  return NextResponse.json({ viewingAs });
}
