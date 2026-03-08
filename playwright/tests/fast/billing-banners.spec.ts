import { test, expect } from "../../fixtures";

test.describe("Billing Banners", () => {
  test.describe.configure({ mode: "serial" });

  test("no banners for free user", async ({ freeUserPage }) => {
    await freeUserPage.goto("/dashboard");
    await expect(
      freeUserPage.getByText(/your pro plan is cancelled/i)
    ).not.toBeVisible();
    await expect(
      freeUserPage.getByText(/payment failed/i)
    ).not.toBeVisible();
    await expect(
      freeUserPage.getByText(/expires tomorrow/i)
    ).not.toBeVisible();
  });

  test("cancelled subscription shows amber banner", async ({ freeUserPage, supabaseAdmin }) => {
    const userId = await supabaseAdmin.getFreeUserId();
    await supabaseAdmin.setSubscriptionState(userId, {
      status: "active",
      cancelAtPeriodEnd: true,
    });

    await freeUserPage.goto("/dashboard");
    await expect(
      freeUserPage.getByText(/your pro plan is cancelled/i)
    ).toBeVisible();
    await expect(
      freeUserPage.getByRole("button", { name: /resubscribe/i })
    ).toBeVisible();

    // cleanup
    await supabaseAdmin.resetSubscription(userId);
  });

  test("grace period shows red banner", async ({ freeUserPage, supabaseAdmin }) => {
    const userId = await supabaseAdmin.getFreeUserId();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.setSubscriptionState(userId, {
      status: "active",
      gracePeriodEnd: tomorrow,
    });

    await freeUserPage.goto("/dashboard");
    await expect(
      freeUserPage.getByText(/expires tomorrow/i)
    ).toBeVisible();
    await expect(
      freeUserPage.getByRole("button", { name: /resubscribe/i })
    ).toBeVisible();

    // cleanup
    await supabaseAdmin.resetSubscription(userId);
  });

  test("past_due shows payment failed banner", async ({ freeUserPage, supabaseAdmin }) => {
    const userId = await supabaseAdmin.getFreeUserId();
    await supabaseAdmin.setSubscriptionState(userId, {
      status: "past_due",
    });

    await freeUserPage.goto("/dashboard");
    await expect(
      freeUserPage.getByText(/payment failed/i)
    ).toBeVisible();
    await expect(
      freeUserPage.getByRole("button", { name: /update payment method/i })
    ).toBeVisible();

    // cleanup
    await supabaseAdmin.resetSubscription(userId);
  });
});
