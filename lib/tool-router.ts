import type { ToolId } from "@/lib/tool-descriptions";

type KeywordMatch = {
  tool: ToolId;
  confidence: "high" | "medium";
};

/** Client-side keyword map for common phrases. Returns null if no confident match. */
export function matchKeywords(query: string): KeywordMatch | null {
  const q = query.toLowerCase().trim();

  // High-confidence matches — specific phrases
  const highConfidence: [RegExp, ToolId][] = [
    [/\b(error|exception|stack\s*trace|crash|fail|broke|broken|not\s*working|stopped)\b/, "error-explainer"],
    [/\b(connect|integrate|set\s*up|link|sync|hook\s*up)\b/, "integration-planner"],
    [/\b(choose|compare|which|recommend|package|library|alternative)\b/, "package-advisor"],
    [/\b(generate|scaffold|boilerplate|create\s*code|write\s*code)\b/, "code-generator"],
    [/\b(wrap|wrapper|api\s*client|sdk)\b/, "api-wrapper-generator"],
    [/\b(test|testing|unit\s*test)\b/, "unit-test-generator"],
    [/\b(audit|dependencies|outdated|vulnerable)\b/, "dependency-audit"],
    [/\b(health|check|status|diagnose|config)\b/, "health-checker"],
    [/\b(migrate|upgrade|version|update|breaking\s*change)\b/, "migration-assistant"],
    [/\b(explain|understand|what\s*does|how\s*does)\b/, "code-explainer"],
  ];

  const matches: { tool: ToolId; index: number }[] = [];

  for (const [pattern, tool] of highConfidence) {
    const match = q.match(pattern);
    if (match && match.index !== undefined) {
      matches.push({ tool, index: match.index });
    }
  }

  if (matches.length === 0) return null;

  // If only one match, return it with high confidence
  if (matches.length === 1) {
    return { tool: matches[0].tool, confidence: "high" };
  }

  // Multiple matches — return the earliest one with medium confidence
  matches.sort((a, b) => a.index - b.index);
  return { tool: matches[0].tool, confidence: "medium" };
}
