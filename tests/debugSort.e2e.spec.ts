import { test, expect } from "@playwright/test";

test("debug sort button click", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const ts = Date.now();
  const name = `E2E Debug ${ts}`;
  const email = `e2e_debug_${ts}@example.com`;
  const password = `TestPassword!${String(ts).slice(-4)}`;

  // Wait for landing page
  const startTraining = page.locator('button:has-text("Start Training")');
  const joinHeading = page.getByRole("heading", { name: "JOIN" });
  await expect(startTraining.or(joinHeading)).toBeVisible({ timeout: 30_000 });

  if (await startTraining.isVisible()) {
    await startTraining.first().click();
    await expect(joinHeading).toBeVisible({ timeout: 15_000 });
  }

  // Fill form
  await page.getByRole("textbox", { name: "FULL NAME" }).fill(name);
  await page.getByRole("textbox", { name: "EMAIL ADDRESS" }).fill(email);
  await page.getByRole("textbox", { name: "SECURE PASSWORD" }).fill(password);
  await page.getByRole("button", { name: "Create Profile" }).click();

  // Advance onboarding
  for (let i = 0; i < 12; i++) {
    const next = page.locator('button:has-text("Next Phase")');
    const init = page.locator('button:has-text("Initialize")');
    try {
      await expect(next.or(init)).toBeVisible({ timeout: 5_000 });
      if (await next.isVisible()) {
        await next.first().click();
      } else {
        await init.first().click();
      }
      await page.waitForTimeout(600);
    } catch {
      break;
    }
  }

  // Wait for tab bar
  const tabButtons = page.locator("div.fixed.bottom-0 button");
  await expect(tabButtons.first()).toBeVisible({ timeout: 60_000 });

  // Navigate to exercises
  await tabButtons.nth(1).click();
  await page.getByText("Library").first().waitFor({ timeout: 60_000 });

  // Wait for sort buttons
  const sortGroup = page.locator('[aria-label="Sort options"]');
  await expect(sortGroup).toBeVisible({ timeout: 30_000 });
  console.log("Sort group visible");

  const alphabeticalBtn = page.locator('button[aria-label="Sort by alphabetical"]');
  await expect(alphabeticalBtn).toBeVisible({ timeout: 5_000 });
  console.log("Alphabetical button visible before click");

  // Listen for page navigations
  page.on("framenavigated", (frame) => {
    console.log(`NAVIGATION: ${frame.url()}`);
  });

  // Click alphabetical
  await alphabeticalBtn.click();
  console.log("Clicked alphabetical");

  // Immediately check page content
  await page.waitForTimeout(500);
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
  console.log("Body HTML after click:", bodyHTML.substring(0, 300));

  // Check if sort group still exists
  const sortGroupExists = await sortGroup.count();
  console.log("Sort group count after click:", sortGroupExists);

  // Check if alphabetical button still exists with longer timeout
  try {
    await expect(alphabeticalBtn).toBeVisible({ timeout: 30_000 });
    console.log("Alphabetical button still visible after click");
  } catch (e) {
    console.log("Alphabetical button NOT visible after click");
    // Take a screenshot
    await page.screenshot({ path: ".sisyphus/evidence/debug-sort-after-click.png" });
    // Get the full page snapshot
    const snapshot = await page.evaluate(() => document.body.innerText);
    console.log("Page text:", snapshot.substring(0, 500));
    throw e;
  }

  const pressed = await alphabeticalBtn.getAttribute("aria-pressed");
  console.log("aria-pressed:", pressed);
});
