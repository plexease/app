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

/**
 * Resolve persona for API routes.
 * Priority: request body → viewing_as cookie → user profile → default (implementer).
 */
export function resolvePersona(
  bodyPersona: string | undefined,
  cookieValue: string | undefined,
  profilePersona: Persona | undefined
): Persona {
  if (bodyPersona && VALID_PERSONAS.includes(bodyPersona as Persona)) return bodyPersona as Persona;
  if (cookieValue && VALID_PERSONAS.includes(cookieValue as Persona)) return cookieValue as Persona;
  return profilePersona ?? "implementer";
}
