// Usage limits
export const FREE_MONTHLY_LIMIT = 20;
export const USAGE_WARNING_THRESHOLD = 15;  // 75% — amber state
export const USAGE_DANGER_THRESHOLD = 19;   // 95% — red state

// Tool names
export const TOOL_NAME_NUGET_ADVISOR = "nuget-advisor";

// Billing
export const GRACE_PERIOD_DAYS = 1;
export const CHECKOUT_POLL_INTERVAL_MS = 2000;
export const CHECKOUT_POLL_TIMEOUT_MS = 30000;

// Stripe Price IDs (set in Stripe Dashboard, stored in env)
export const STRIPE_PRICE_ID_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!;
export const STRIPE_PRICE_ID_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!;
