import type { ComfortLevel, PrimaryGoal } from "@/lib/types/persona";
import { TOOL_CATALOG, type ToolId } from "@/lib/tool-descriptions";

/** Platform-to-tool relevance mapping. */
const PLATFORM_TOOLS: Record<string, ToolId[]> = {
  shopify: ["integration-planner", "health-checker", "error-explainer"],
  woocommerce: ["integration-planner", "code-generator", "health-checker"],
  xero: ["integration-planner", "api-wrapper-generator", "error-explainer"],
  stripe: ["api-wrapper-generator", "integration-planner", "code-generator"],
  "royal-mail": ["api-wrapper-generator", "integration-planner"],
  quickbooks: ["integration-planner", "api-wrapper-generator", "error-explainer"],
  magento: ["integration-planner", "health-checker", "migration-assistant"],
};

/** Goal-to-category priority. */
const GOAL_CATEGORY_PRIORITY: Record<string, string[]> = {
  setup: ["setup", "explore"],
  fixing: ["troubleshoot", "maintain"],
  evaluating: ["explore", "setup"],
  exploring: ["explore", "troubleshoot", "setup", "maintain"],
};

/** Comfort-level priority for tiebreaking (simpler tools first for guided users). */
const COMFORT_TOOL_PRIORITY: Record<string, ToolId[]> = {
  guided: ["error-explainer", "code-explainer", "health-checker", "package-advisor"],
  writes_code: ["code-generator", "api-wrapper-generator", "unit-test-generator", "migration-assistant"],
};

export function getRecommendedTools(
  platforms: string[],
  primaryGoal: PrimaryGoal | null,
  comfortLevel: ComfortLevel | null,
  count: number = 4
): ToolId[] {
  // Collect tools from platform mappings with frequency scores
  const toolScores = new Map<ToolId, number>();

  for (const platform of platforms) {
    const tools = PLATFORM_TOOLS[platform];
    if (!tools) continue;
    for (const toolId of tools) {
      toolScores.set(toolId, (toolScores.get(toolId) ?? 0) + 1);
    }
  }

  // If no platforms selected, use all tools with equal score
  if (toolScores.size === 0) {
    for (const toolId of Object.keys(TOOL_CATALOG) as ToolId[]) {
      toolScores.set(toolId, 1);
    }
  }

  // Sort by: goal-priority category, then platform frequency, then comfort tiebreaker
  const goalPriority = GOAL_CATEGORY_PRIORITY[primaryGoal ?? "exploring"] ?? [];
  const comfortPriority = COMFORT_TOOL_PRIORITY[comfortLevel ?? "docs_configs"] ?? [];

  const sorted = Array.from(toolScores.entries()).sort(([aId, aScore], [bId, bScore]) => {
    const aCat = TOOL_CATALOG[aId].category;
    const bCat = TOOL_CATALOG[bId].category;

    // Goal-priority category first
    const aGoalIdx = goalPriority.indexOf(aCat);
    const bGoalIdx = goalPriority.indexOf(bCat);
    const aGoal = aGoalIdx === -1 ? 999 : aGoalIdx;
    const bGoal = bGoalIdx === -1 ? 999 : bGoalIdx;
    if (aGoal !== bGoal) return aGoal - bGoal;

    // Platform frequency (higher = better)
    if (bScore !== aScore) return bScore - aScore;

    // Comfort tiebreaker
    const aComfort = comfortPriority.indexOf(aId);
    const bComfort = comfortPriority.indexOf(bId);
    const aC = aComfort === -1 ? 999 : aComfort;
    const bC = bComfort === -1 ? 999 : bComfort;
    return aC - bC;
  });

  return sorted.slice(0, count).map(([id]) => id);
}
