import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const isCI = !!process.env.CI;

export default defineConfig({
  fullyParallel: false,
  forbidOnly: isCI,
  retries: 1,
  reporter: isCI ? [["html", { open: "never" }], ["github"]] : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  webServer: {
    command: isCI ? "npm start" : "npm run dev",
    port: 3000,
    reuseExistingServer: !isCI,
    cwd: path.resolve(__dirname, ".."),
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.TEST_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      NEXT_PUBLIC_STRIPE_PRICE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!,
      NEXT_PUBLIC_STRIPE_PRICE_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!,
      NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_MONTHLY!,
      NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_ANNUAL!,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
    },
  },
  projects: [
    {
      name: "fast",
      testDir: "./tests/fast",
      testIgnore: ["**/billing-banners*"],
      fullyParallel: true,
      workers: isCI ? 2 : 4,
    },
    {
      name: "fast-serial",
      testDir: "./tests/fast",
      testMatch: ["**/billing-banners*"],
      fullyParallel: false,
      workers: 1,
      dependencies: ["fast"],
    },
    {
      name: "slow",
      testDir: "./tests/slow",
      fullyParallel: false,
      workers: 1,
    },
  ],
});
