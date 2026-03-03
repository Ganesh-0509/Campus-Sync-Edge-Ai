import { test, expect } from "@playwright/test";

test.describe("Landing / Auth page", () => {
  test("shows the app title", async ({ page }) => {
    await page.goto("/");
    // The page should have a visible heading or brand text
    const heading = page.locator("h1, h2, [class*=brand], [class*=hero]").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("renders login / signup form", async ({ page }) => {
    await page.goto("/");
    // Should have email input + password input (or a sign-in button)
    const emailOrButton =
      page.locator('input[type="email"], input[name="email"], button:has-text("Sign")').first();
    await expect(emailOrButton).toBeVisible({ timeout: 10_000 });
  });
});
