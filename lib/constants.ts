// Usage limits per tier
export const FREE_MONTHLY_LIMIT = 10;
export const ESSENTIALS_MONTHLY_LIMIT = 100;
export const PRO_MONTHLY_LIMIT = 1000;

// Warning thresholds (75% and 95% of each tier)
export const FREE_USAGE_WARNING = 7;
export const FREE_USAGE_DANGER = 9;
export const ESSENTIALS_USAGE_WARNING = 75;
export const ESSENTIALS_USAGE_DANGER = 95;
export const PRO_USAGE_WARNING = 750;
export const PRO_USAGE_DANGER = 950;

/** Get the usage limit for a plan tier. */
export function getUsageLimit(plan: "free" | "essentials" | "pro"): number {
  switch (plan) {
    case "pro": return PRO_MONTHLY_LIMIT;
    case "essentials": return ESSENTIALS_MONTHLY_LIMIT;
    default: return FREE_MONTHLY_LIMIT;
  }
}

// Tool names
export const TOOL_NAME_NUGET_ADVISOR = "nuget-advisor";
export const TOOL_NAME_CODE_EXPLAINER = "code-explainer";
export const TOOL_NAME_INTEGRATION_PLANNER = "integration-planner";
export const TOOL_NAME_CODE_GENERATOR = "integration-code-generator";
export const TOOL_NAME_DEPENDENCY_AUDIT = "dependency-audit";
export const TOOL_NAME_ERROR_EXPLAINER = "error-explainer";
export const TOOL_NAME_PACKAGE_ADVISOR = "package-advisor";
export const TOOL_NAME_API_WRAPPER_GENERATOR = "api-wrapper-generator";
export const TOOL_NAME_UNIT_TEST_GENERATOR = "unit-test-generator";
export const TOOL_NAME_HEALTH_CHECKER = "health-checker";
export const TOOL_NAME_MIGRATION_ASSISTANT = "migration-assistant";

// Billing
export const GRACE_PERIOD_DAYS = 1;
export const CHECKOUT_POLL_INTERVAL_MS = 2000;
export const CHECKOUT_POLL_TIMEOUT_MS = 30000;

// Stripe Price IDs (set in Stripe Dashboard, stored in env)
export const STRIPE_PRICE_PRO_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!;
export const STRIPE_PRICE_PRO_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!;
export const STRIPE_PRICE_ESSENTIALS_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_MONTHLY!;
export const STRIPE_PRICE_ESSENTIALS_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_ANNUAL!;
