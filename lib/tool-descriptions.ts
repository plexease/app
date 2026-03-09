import type { Persona } from "@/lib/types/persona";

export type ToolId =
  | "code-explainer"
  | "error-explainer"
  | "package-advisor"
  | "integration-planner"
  | "code-generator"
  | "api-wrapper-generator"
  | "unit-test-generator"
  | "dependency-audit"
  | "health-checker"
  | "migration-assistant";

type ToolDescriptions = {
  label: string;
  href: string;
  category: "explore" | "setup" | "troubleshoot" | "maintain";
  descriptions: Record<Persona, string>;
};

export const TOOL_CATALOG: Record<ToolId, ToolDescriptions> = {
  "package-advisor": {
    label: "Package Advisor",
    href: "/tools/package-advisor",
    category: "explore",
    descriptions: {
      business_owner: "Get recommendations for the right tools",
      support_ops: "Compare packages and libraries for your stack",
      implementer: "Package comparison with compatibility analysis",
    },
  },
  "integration-planner": {
    label: "Integration Planner",
    href: "/tools/integration-planner",
    category: "explore",
    descriptions: {
      business_owner: "Plan how to connect your services",
      support_ops: "Architecture and approach for integrations",
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
  "error-explainer": {
    label: "Error Explainer",
    href: "/tools/error-explainer",
    category: "troubleshoot",
    descriptions: {
      business_owner: "Find out why something stopped working",
      support_ops: "Diagnose error messages and stack traces",
      implementer: "Root cause analysis from errors and traces",
    },
  },
  "code-explainer": {
    label: "Code Explainer",
    href: "/tools/code-explainer",
    category: "troubleshoot",
    descriptions: {
      business_owner: "Understand what a piece of code does in plain English",
      support_ops: "Break down code snippets to understand logic and dependencies",
      implementer: "Parse code, identify patterns and packages",
    },
  },
  "dependency-audit": {
    label: "Dependency Audit",
    href: "/tools/dependency-audit",
    category: "maintain",
    descriptions: {
      business_owner: "Check if your project's tools are up to date",
      support_ops: "Audit dependencies for updates and vulnerabilities",
      implementer: "Dependency audit table with status badges",
    },
  },
  "health-checker": {
    label: "Health Checker",
    href: "/tools/health-checker",
    category: "maintain",
    descriptions: {
      business_owner: "Get a health report for your setup",
      support_ops: "Assess configuration health and risks",
      implementer: "Config health assessment with severity ratings",
    },
  },
  "migration-assistant": {
    label: "Migration Assistant",
    href: "/tools/migration-assistant",
    category: "maintain",
    descriptions: {
      business_owner: "Get help upgrading to a new version",
      support_ops: "Step-by-step migration with breaking changes",
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
