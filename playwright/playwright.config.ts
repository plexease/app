import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
    cwd: path.resolve(__dirname, ".."),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.TEST_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      NEXT_PUBLIC_STRIPE_PRICE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!,
      NEXT_PUBLIC_STRIPE_PRICE_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
    },
  },
});
