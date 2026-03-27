import { test, expect } from "@playwright/test";

test("exercise cards render Convex storage cover images", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });

  // If we land on the unauthenticated experience, complete a minimal signup/onboarding.
  const startTraining = page.locator('button:has-text("Start Training")');
  if (await startTraining.count()) {
    try {
      await startTraining.first().click({ timeout: 10_000 });

      const ts = Date.now();
      const name = `E2E User ${ts}`;
      const email = `e2e_${ts}@example.com`;
      const password = `TestPassword!${String(ts).slice(-4)}`;

      const fillFirst = async (sels: string[], value: string) => {
        for (const sel of sels) {
          const el = page.locator(sel);
          if (await el.count()) {
            await el.first().fill(value);
            return true;
          }
        }
        return false;
      };

      await fillFirst(
        [
          "input[name='name']",
          "input[name='fullName']",
          "input[placeholder*='Name']",
          "input[type='text']",
        ],
        name,
      );
      await fillFirst(
        ["input[name='email']", "input[placeholder*='Email']", "input[type='email']"],
        email,
      );
      await fillFirst(
        [
          "input[name='password']",
          "input[placeholder*='Password']",
          "input[type='password']",
        ],
        password,
      );

      const createProfile = page.locator('button:has-text("Create Profile")');
      if (await createProfile.count()) {
        await createProfile.first().click({ timeout: 10_000 });
      }

      // Advance onboarding if present.
      for (let i = 0; i < 3; i += 1) {
        const next = page.locator('button:has-text("Next Phase")');
        if (await next.count()) {
          await next.first().click({ timeout: 10_000 });
          await page.waitForTimeout(500);
          continue;
        }
        const init = page.locator('button:has-text("Initialize")');
        if (await init.count()) {
          await init.first().click({ timeout: 10_000 });
          await page.waitForTimeout(500);
        }
        break;
      }
    } catch {
      // If signup flow changes, still attempt to continue; later selectors will fail clearly.
    }
  }

  // If already on JOIN/signup form, fill it.
  const joinHeading = page.getByRole("heading", { name: "JOIN" });
  if (await joinHeading.count()) {
    const ts = Date.now();
    const name = `E2E User ${ts}`;
    const email = `e2e_${ts}@example.com`;
    const password = `TestPassword!${String(ts).slice(-4)}`;

    try {
      await page.getByRole("textbox", { name: "FULL NAME" }).fill(name);
      await page.getByRole("textbox", { name: "EMAIL ADDRESS" }).fill(email);
      await page.getByRole("textbox", { name: "SECURE PASSWORD" }).fill(password);
      await page.getByRole("button", { name: "Create Profile" }).click();

      // Advance onboarding if present.
      for (let i = 0; i < 12; i += 1) {
        const next = page.locator('button:has-text("Next Phase")');
        if (await next.count()) {
          await next.first().click({ timeout: 10_000 });
          await page.waitForTimeout(600);
          continue;
        }
        const init = page.locator('button:has-text("Initialize")');
        if (await init.count()) {
          await init.first().click({ timeout: 10_000 });
          await page.waitForTimeout(600);
          continue;
        }
        break;
      }
    } catch {
      // ignore; later waits will fail clearly
    }
  }

  // Wait for tab bar and click Exercises tab (2nd button).
  const tabButtons = page.locator("div.fixed.bottom-0 button");
  await expect(tabButtons.first()).toBeVisible({ timeout: 60_000 });
  await tabButtons.nth(1).click();

  // Exercises view header
  await page.getByText("Library").first().waitFor({ timeout: 60_000 });

  // Search for an exercise we already updated via the script.
  const search = page.getByPlaceholder("Search movements...");
  await search.fill("Elbow Flexion");

  const card = page.locator('div:has(h3:text("Elbow Flexion"))').first();
  await expect(card).toBeVisible({ timeout: 60_000 });

  const img = card.locator("img").first();
  const src = await img.getAttribute("src");
  expect(src).toContain("convex.cloud/api/storage/");
});
