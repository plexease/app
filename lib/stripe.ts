import Stripe from "stripe";

const requiredEnvVars = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const key = process.env.STRIPE_SECRET_KEY!;
const isDev = process.env.NODE_ENV !== "production";

if (isDev && !key.startsWith("sk_test_")) {
  throw new Error("STRIPE_SECRET_KEY must be a test key in development");
}
if (!isDev && !key.startsWith("sk_live_")) {
  throw new Error("STRIPE_SECRET_KEY must be a live key in production");
}

export const stripe = new Stripe(key, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});
