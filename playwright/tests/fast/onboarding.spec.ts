import { test, expect } from "../../fixtures";

test.describe("Onboarding Flow", () => {
  test.describe.configure({ mode: "serial" });

  test("non-onboarded user is redirected to onboarding", async ({
    freeUserPage,
    supabaseAdmin,
  }) => {
    const userId = await supabaseAdmin.getFreeUserId();

    // Remove profile so user appears non-onboarded
    await supabaseAdmin.deleteUserProfile(userId);

    // Clear the onboarding cookie
    const context = freeUserPage.context();
    await context.clearCookies({ name: "plexease_onboarded" });

    await freeUserPage.goto("/dashboard");
    await freeUserPage.waitForURL("**/onboarding");

    await expect(freeUserPage.getByText("Welcome to Plexease")).toBeVisible();

    // Restore profile for other tests
    await supabaseAdmin.ensureUserProfile(userId);
  });

  test("onboarding flow completes all 4 steps", async ({
    freeUserPage,
    supabaseAdmin,
  }) => {
    const userId = await supabaseAdmin.getFreeUserId();

    // Remove profile so user appears non-onboarded
    await supabaseAdmin.deleteUserProfile(userId);

    // Clear the onboarding cookie
    const context = freeUserPage.context();
    await context.clearCookies({ name: "plexease_onboarded" });

    await freeUserPage.goto("/dashboard");
    await freeUserPage.waitForURL("**/onboarding");

    // Step 1: Select persona
    await freeUserPage.getByText("Business Owner").click();

    // Step 2: Select comfort level (not "I write code" to test full flow)
    await freeUserPage.getByText("I can follow docs and configs").click();

    // Step 3: Select platforms and click Next
    await freeUserPage.getByText("Shopify").click();
    await freeUserPage.getByRole("button", { name: "Next", exact: true }).click();

    // Step 4: Select primary goal — this submits the form
    await freeUserPage.getByText("Setting up integrations").click();

    // Should redirect to dashboard after completion
    await expect(freeUserPage.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });

    // Restore profile for other tests
    await supabaseAdmin.ensureUserProfile(userId);
  });
});
