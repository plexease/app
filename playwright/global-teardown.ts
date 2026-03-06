import dotenv from "dotenv";
import path from "path";
import { resetUsageForUser, resetProSubscription, ensureTestUser } from "./helpers/supabase-admin";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

async function globalTeardown() {
  const freeEmail = process.env.TEST_FREE_USER_EMAIL!;
  const freePassword = process.env.TEST_FREE_USER_PASSWORD!;
  const proEmail = process.env.TEST_PRO_USER_EMAIL!;
  const proPassword = process.env.TEST_PRO_USER_PASSWORD!;

  // Look up user IDs
  const freeUserId = await ensureTestUser(freeEmail, freePassword);
  const proUserId = await ensureTestUser(proEmail, proPassword);

  console.log("Cleaning up test data...");
  await resetUsageForUser(freeUserId);
  await resetUsageForUser(proUserId);
  await resetProSubscription(proUserId);
  console.log("Global teardown complete.");
}

export default globalTeardown;
