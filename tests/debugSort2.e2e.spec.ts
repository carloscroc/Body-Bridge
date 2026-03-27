import { test, expect } from "@playwright/test";

test("debug sort button crash recovery", async ({ page }) => {
  test.setTimeout(120_000);

  // Capture console errors
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // Capture page errors (uncaught exceptions)
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });

  const ts = Date.now();
  const startTraining = page.locator('button:has-text("Start Training")');
  const joinHeading = page.getByRole("heading", { name: "JOIN" });
  await expect(startTraining.or(joinHeading)).toBeVisible({ timeout: 30_000 });

  if (await startTraining.isVisible()) {
    await startTraining.first().click();
    await expect(joinHeading).toBeVisible({ timeout: 15_000 });
  }

  await page.getByRole("textbox", { name: "FULL NAME" }).fill(`E2E Debug2 ${ts}`);
  await page.getByRole("textbox", { name: "EMAIL ADDRESS" }).fill(`e2e_debug2_${ts}@example.com`);
  await page.getByRole("textbox", { name: "SECURE PASSWORD" }).fill(`TestPassword!${String(ts).slice(-4)}`);
  await page.getByRole("button", { name: "Create Profile" }).click();

  for (let i = 0; i < 12; i++) {
    const next = page.locator('button:has-text("Next Phase")');
    const init = page.locator('button:has-text("Initialize")');
    try {
      await expect(next.or(init)).toBeVisible({ timeout: 5_000 });
      if (await next.isVisible()) await next.first().click();
      else await init.first().click();
      await page.waitForTimeout(600);
    } catch { break; }
  }

  const tabButtons = page.locator("div.fixed.bottom-0 button");
  await expect(tabButtons.first()).toBeVisible({ timeout: 60_000 });
  await tabButtons.nth(1).click();
  await page.getByText("Library").first().waitFor({ timeout: 60_000 });

  const sortGroup = page.locator('[aria-label="Sort options"]');
  await expect(sortGroup).toBeVisible({ timeout: 30_000 });

  console.log("=== Console errors before click:", consoleErrors.length);
  consoleErrors.forEach((e, i) => console.log(`  Error ${i}: ${e.substring(0, 200)}`));
  
  // Clear errors before click
  consoleErrors.length = 0;
  pageErrors.length = 0;

  const alphabeticalBtn = page.locator('button[aria-label="Sort by alphabetical"]');
  await expect(alphabeticalBtn).toBeVisible({ timeout: 5_000 });
  
  // Click and immediately wait
  await alphabeticalBtn.click();
  
  // Wait a bit and check what happened
  await page.waitForTimeout(2_000);
  
  console.log("=== Console errors after click:", consoleErrors.length);
  consoleErrors.forEach((e, i) => console.log(`  Error ${i}: ${e.substring(0, 300)}`));
  
  console.log("=== Page errors after click:", pageErrors.length);
  pageErrors.forEach((e, i) => console.log(`  Page Error ${i}: ${e.substring(0, 300)}`));

  // Check root div content
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById("root");
    return root ? root.innerHTML.substring(0, 500) : "NO ROOT FOUND";
  });
  console.log("=== Root content:", rootContent);
  
  // Wait longer to see if app recovers (Vite HMR?)
  await page.waitForTimeout(5_000);
  
  const rootContent2 = await page.evaluate(() => {
    const root = document.getElementById("root");
    return root ? root.innerHTML.substring(0, 200) : "NO ROOT FOUND";
  });
  console.log("=== Root content after 5s:", rootContent2);
  
  // Wait even longer
  await page.waitForTimeout(10_000);
  
  const rootContent3 = await page.evaluate(() => {
    const root = document.getElementById("root");
    return root ? root.innerHTML.substring(0, 200) : "NO ROOT FOUND";
  });
  console.log("=== Root content after 15s:", rootContent3);
  
  await page.screenshot({ path: ".sisyphus/evidence/debug-sort-crash.png" });
});
