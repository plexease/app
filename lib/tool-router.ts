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
    // Specific phrases first (new tools)
    [/\b(connect\s*.*to|set\s*up\s*.*integration|link\s*.*with|how\s*to\s*connect)\b/, "integration-setup"],
    [/\b(webhook|notify|notification|event\s*driven|trigger)\b/, "webhook-builder"],
    [/\b(auth|api\s*key|oauth|token|credentials|authenticate)\b/, "auth-guide"],
    [/\b(automate|automation|workflow|when\s*.*then|zapier|make|n8n)\b/, "workflow-builder"],
    [/\b(changed|deprecated|breaking\s*change|api\s*update|sunset)\b/, "what-changed"],
    [/\b(troubleshoot|not\s*syncing|stopped\s*working|connection\s*.*problem|apps?\s*.*not\s*.*talking)\b/, "troubleshooter"],
    [/\b(map|landscape|overview|how\s*.*connected|connections)\b/, "connection-map"],
    [/\b(plan|stack|what\s*tools|what\s*should\s*i\s*use|tool\s*plan)\b/, "tool-planner"],
    // Original patterns
    [/\b(error|exception|stack\s*trace|crash|fail|broke|broken)\b/, "error-resolver"],
    [/\b(integrate|blueprint)\b/, "integration-blueprint"],
    [/\b(choose|compare|which|recommend|package|library|alternative|find\s*tool)\b/, "tool-finder"],
    [/\b(generate|scaffold|boilerplate|create\s*code|write\s*code)\b/, "code-generator"],
    [/\b(wrap|wrapper|api\s*client|sdk)\b/, "api-wrapper-generator"],
    [/\b(test|testing|unit\s*test)\b/, "unit-test-generator"],
    [/\b(audit|dependencies|outdated|vulnerable|compatible|compatibility)\b/, "compatibility-check"],
    [/\b(health|check|status|diagnose|config)\b/, "connection-health-check"],
    [/\b(migrate|upgrade|version|update)\b/, "upgrade-assistant"],
    [/\b(explain|understand|what\s*does|how\s*does)\b/, "how-it-works"],
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
