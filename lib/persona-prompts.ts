import type { Persona } from "@/lib/types/persona";

const PERSONA_INSTRUCTIONS: Record<Persona, string> = {
  business_owner: `Adapt your response for a business owner with limited technical background.
Use plain English. Avoid jargon and raw code blocks.
Focus on business impact, risk, cost, and clear next steps.
When technical detail is unavoidable, explain it in simple terms.`,

  support_ops: `Adapt your response for a support/operations professional who troubleshoots for others.
Use clear, procedural language. Include numbered steps where appropriate.
Focus on what to check, what to tell the customer, and how to resolve issues.
Avoid deep architecture discussion or theoretical explanations.`,

  implementer: `Adapt your response for a developer who wants technical precision.
Be direct and concise. Include code snippets and exact commands.
Focus on implementation detail, edge cases, and best practices.
Do not over-explain basics — assume technical competence.`,
};

export function getPersonaInstruction(persona: Persona): string {
  return PERSONA_INSTRUCTIONS[persona];
}
