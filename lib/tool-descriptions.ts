import type { Persona } from "@/lib/types/persona";

export type ToolId =
  | "how-it-works"
  | "error-resolver"
  | "tool-finder"
  | "integration-blueprint"
  | "code-generator"
  | "api-wrapper-generator"
  | "unit-test-generator"
  | "compatibility-check"
  | "connection-health-check"
  | "upgrade-assistant";

type ToolDescriptions = {
  label: string;
  href: string;
  category: "explore" | "setup" | "troubleshoot" | "maintain";
  descriptions: Record<Persona, string>;
};

export const TOOL_CATALOG: Record<ToolId, ToolDescriptions> = {
  "tool-finder": {
    label: "Tool Finder",
    href: "/tools/tool-finder",
    category: "explore",
    descriptions: {
      business_owner: "Get recommendations for the right tools and services",
      support_ops: "Compare tools, packages, and libraries for your stack",
      implementer: "Package comparison with compatibility analysis",
    },
  },
  "integration-blueprint": {
    label: "Integration Blueprint",
    href: "/tools/integration-blueprint",
    category: "explore",
    descriptions: {
      business_owner: "Plan how to connect your services together",
      support_ops: "Architecture and approach for connecting platforms",
      implementer: "Integration architecture, packages, patterns",
    },
  },
  "code-generator": {
    label: "Code Generator",
    href: "/tools/code-generator",
    category: "setup",
    descriptions: {
      business_owner: "Get ready-to-use code for your project",
      support_ops: "Generate boilerplate and implementation code",
      implementer: "Scaffold files from spec with setup instructions",
    },
  },
  "api-wrapper-generator": {
    label: "API Wrapper Generator",
    href: "/tools/api-wrapper-generator",
    category: "setup",
    descriptions: {
      business_owner: "Create code to talk to an external service",
      support_ops: "Generate typed API client wrappers",
      implementer: "Typed wrapper with auth setup and usage",
    },
  },
  "error-resolver": {
    label: "Error Resolver",
    href: "/tools/error-resolver",
    category: "troubleshoot",
    descriptions: {
      business_owner: "Find out why something stopped working and how to fix it",
      support_ops: "Diagnose error messages and stack traces with resolution steps",
      implementer: "Root cause analysis from errors and traces with fix suggestions",
    },
  },
  "how-it-works": {
    label: "How It Works",
    href: "/tools/how-it-works",
    category: "troubleshoot",
    descriptions: {
      business_owner: "Understand what a piece of code or configuration does in plain English",
      support_ops: "Break down code snippets to understand logic and dependencies",
      implementer: "Parse code, identify patterns and packages",
    },
  },
  "compatibility-check": {
    label: "Compatibility Check",
    href: "/tools/compatibility-check",
    category: "maintain",
    descriptions: {
      business_owner: "Check if your tools and dependencies are compatible and up to date",
      support_ops: "Audit dependencies for updates and known issues",
      implementer: "Dependency audit table with status badges",
    },
  },
  "connection-health-check": {
    label: "Connection Health Check",
    href: "/tools/connection-health-check",
    category: "maintain",
    descriptions: {
      business_owner: "Get a health report for your connections and integrations",
      support_ops: "Assess configuration health and identify risks",
      implementer: "Config health assessment with severity ratings",
    },
  },
  "upgrade-assistant": {
    label: "Upgrade Assistant",
    href: "/tools/upgrade-assistant",
    category: "maintain",
    descriptions: {
      business_owner: "Get help upgrading to a new version of your tools",
      support_ops: "Step-by-step upgrade guide with breaking changes",
      implementer: "Migration steps, breaking changes, effort estimate",
    },
  },
  "unit-test-generator": {
    label: "Unit Test Generator",
    href: "/tools/unit-test-generator",
    category: "maintain",
    descriptions: {
      business_owner: "Make sure your code works correctly",
      support_ops: "Generate test files for existing code",
      implementer: "Test scaffold with mocking approach",
    },
  },
};

/** Get tools grouped by lifecycle category, with descriptions for a specific persona. */
export function getToolsByCategory(persona: Persona) {
  const categories = {
    explore: { label: "Explore", description: getStageDescription("explore", persona), tools: [] as { label: string; href: string; description: string }[] },
    setup: { label: "Set Up", description: getStageDescription("setup", persona), tools: [] as { label: string; href: string; description: string }[] },
    troubleshoot: { label: "Troubleshoot", description: getStageDescription("troubleshoot", persona), tools: [] as { label: string; href: string; description: string }[] },
    maintain: { label: "Maintain", description: getStageDescription("maintain", persona), tools: [] as { label: string; href: string; description: string }[] },
  };

  for (const [, tool] of Object.entries(TOOL_CATALOG)) {
    categories[tool.category].tools.push({
      label: tool.label,
      href: tool.href,
      description: tool.descriptions[persona],
    });
  }

  return Object.values(categories);
}

/** Get all tools as a flat array with descriptions for a specific persona. */
export function getAllTools(persona: Persona) {
  return Object.entries(TOOL_CATALOG).map(([id, tool]) => ({
    id: id as ToolId,
    label: tool.label,
    href: tool.href,
    category: tool.category,
    description: tool.descriptions[persona],
  }));
}

type Category = "explore" | "setup" | "troubleshoot" | "maintain";

function getStageDescription(stage: Category, persona: Persona): string {
  const descriptions: Record<Category, Record<Persona, string>> = {
    explore: {
      business_owner: "Figure out what you need",
      support_ops: "Research tools and plan integrations",
      implementer: "Evaluate packages and architecture options",
    },
    setup: {
      business_owner: "Build and connect your services",
      support_ops: "Generate code and API integrations",
      implementer: "Scaffold implementations and wrappers",
    },
    troubleshoot: {
      business_owner: "Find and fix problems",
      support_ops: "Diagnose errors and understand code",
      implementer: "Debug errors, analyse code",
    },
    maintain: {
      business_owner: "Keep everything running smoothly",
      support_ops: "Audit dependencies and check health",
      implementer: "Audit, test, migrate, monitor health",
    },
  };
  return descriptions[stage][persona];
}
