import type { Persona } from "@/lib/types/persona";

export function currentMonthDate(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

const VALID_PERSONAS: Persona[] = ["business_owner", "support_ops", "implementer"];

/** Resolve the viewing_as persona from cookie value and user profile fallback. */
export function resolveViewingAs(cookieValue: string | undefined, userPersona: Persona | undefined): Persona {
  if (cookieValue && VALID_PERSONAS.includes(cookieValue as Persona)) return cookieValue as Persona;
  return userPersona ?? "business_owner";
}
