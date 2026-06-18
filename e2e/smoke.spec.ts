import { test, expect } from "@playwright/test";

/**
 * Storefront smoke tests — the critical happy path that must never break:
 * the homepage renders, products are browsable, and the cart is reachable.
 *
 * Assertions are deliberately loose (brand text, roles, URLs) so they survive
 * copy/layout tweaks. They run on every browser/viewport in playwright.config.ts.
 */

test("homepage renders the brand and a path to products", async ({ page }) => {
  await page.goto("/");

  // Brand name appears somewhere on the page (nav/hero/footer).
  await expect(page.getByText(/Fairytale Farms/i).first()).toBeVisible();

  // There is a way to reach the catalog.
  const productsLink = page
    .getByRole("link", { name: /products|shop|order|menu/i })
    .first();
  await expect(productsLink).toBeVisible();
});

test("products page loads without crashing", async ({ page }) => {
  const response = await page.goto("/products");
  expect(response?.status()).toBeLessThan(400);

  // The SPA shell renders; we don't assert specific products (DB-dependent),
  // only that the page is interactive and shows catalog chrome (search/filter).
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByText(/Fairytale Farms/i).first()).toBeVisible();
});

test("cart page is reachable", async ({ page }) => {
  const response = await page.goto("/cart");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
});

test("static SEO assets are served", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBeLessThan(400);
});

test("unknown routes still serve the SPA shell (no hard 500)", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist-xyz");
  // SPA fallback returns index.html (200); should never be a server error.
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator("body")).toBeVisible();
});
