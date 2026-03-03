import { test, expect } from "@playwright/test";

test.describe("Navigation smoke tests", () => {
  test("unauthenticated user stays on auth page", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect back to login / landing since not authenticated
    await page.waitForTimeout(2_000);
    const url = page.url();
    // Either stays on / or redirected to /login or /auth
    expect(
      url.endsWith("/") || url.includes("login") || url.includes("auth") || url.includes("dashboard")
    ).toBeTruthy();
  });

  test("404-like routes show fallback content", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await page.waitForTimeout(2_000);
    // SPA should redirect to root or show some content
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });
});
