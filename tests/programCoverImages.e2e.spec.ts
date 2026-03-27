import { test, expect } from '@playwright/test';

// Reusable signup + onboarding helper (copied from programs-with-exercises.e2e.spec.ts)
async function signupAndOnboard(page: import('@playwright/test').Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const ts = Date.now();
  const name = `E2E User ${ts}`;
  const email = `e2e_${ts}@example.com`;
  const password = `TestPassword!${String(ts).slice(-4)}`;

  const startTraining = page.locator('button:has-text("Start Training")');
  const joinHeading = page.getByRole('heading', { name: 'JOIN' });

  // Wait for either entry points
  try { await expect(startTraining.or(joinHeading)).toBeVisible({ timeout: 30_000 }); } catch { }

  if (await startTraining.isVisible().catch(() => false)) {
    await startTraining.first().click().catch(() => {});
    await expect(joinHeading).toBeVisible({ timeout: 15_000 }).catch(() => {});
  }

  // Fill join form if present
  if (await joinHeading.count()) {
    try {
      await page.getByRole('textbox', { name: 'FULL NAME' }).fill(name).catch(() => {});
      await page.getByRole('textbox', { name: 'EMAIL ADDRESS' }).fill(email).catch(() => {});
      await page.getByRole('textbox', { name: 'SECURE PASSWORD' }).fill(password).catch(() => {});
      await page.getByRole('button', { name: 'Create Profile' }).click().catch(() => {});
    } catch {}
  }

  // Advance onboarding if present
  for (let i = 0; i < 12; i += 1) {
    const next = page.locator('button:has-text("Next Phase")');
    const init = page.locator('button:has-text("Initialize")');
    try {
      await expect(next.or(init)).toBeVisible({ timeout: 5_000 });
      if (await next.isVisible().catch(() => false)) {
        await next.first().click();
      } else {
        await init.first().click();
      }
      await page.waitForTimeout(600);
    } catch { break; }
  }
}
import path from 'path';
import fs from 'fs';

// Utility to create a tiny PNG in memory and write to a temp file
async function makeTempPng(): Promise<string> {
  const tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'tmp-'));
  const filePath = path.join(tmpDir, 'test-cover.png');
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  return filePath;
}

test.describe('Program cover image E2E', () => {
  test('uploads image path', async ({ page }) => {
    const title = `ProgUpload-${Date.now()}`;
    // Open app home and ensure we're past signup/onboarding so Build Program is visible
    await page.goto('/');
    const startTraining = page.locator('button:has-text("Start Training")');
    const joinHeading = page.getByRole('heading', { name: 'JOIN' });
    if (await startTraining.count()) {
      try {
        await startTraining.first().click({ timeout: 10000 });
        const ts = Date.now();
        const name = `E2E User ${ts}`;
        const email = `e2e_${ts}@example.com`;
        const password = `TestPassword!${String(ts).slice(-4)}`;
        const fillFirst = async (sels: string[], value: string) => {
          for (const sel of sels) {
            const el = page.locator(sel);
            if (await el.count()) { await el.first().fill(value); return true; }
          }
          return false;
        };
        await fillFirst(["input[name='name']","input[name='fullName']","input[placeholder*='Name']","input[type='text']"], name);
        await fillFirst(["input[name='email']","input[placeholder*='Email']","input[type='email']"], email);
        await fillFirst(["input[name='password']","input[placeholder*='Password']","input[type='password']"], password);
        const createProfile = page.locator('button:has-text("Create Profile")');
        if (await createProfile.count()) { await createProfile.first().click({ timeout: 10000 }); }
      } catch { }
    }
    // Navigate to Workouts tab where the Build Program button lives, then click Build
    const tabButtons = page.locator('div.fixed.bottom-0 button');
    await expect(tabButtons.first()).toBeVisible({ timeout: 60_000 });
    // Workouts is typically the third tab button
    await tabButtons.nth(2).click();
    const buildBtn = page.locator('button[title="Build Program"]');
    await expect(buildBtn.first()).toBeVisible({ timeout: 60_000 });
    await buildBtn.first().click();
    // Set title
    await page.fill('input[placeholder*="Push"]', title);
    // Prepare a test image and upload
    const filePath = await makeTempPng();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    // Save program
    await page.click('text=Save Program');
    // Navigate to Saved Programs and verify the card shows the image
    await page.click('text=Saved Programs');
    const card = page.locator(`text="${title}"`).first();
    await expect(card).toBeVisible();
    const img = card.locator('img');
    await expect(img).toBeVisible();
  });

  test('program cover image from Unsplash', async ({ page }) => {
    const title = `ProgUnsplash-${Date.now()}`;
    // Ensure signed up/onboarded so tab bar is available
    await signupAndOnboard(page);
    const tabButtons2 = page.locator('div.fixed.bottom-0 button');
    await expect(tabButtons2.first()).toBeVisible({ timeout: 60_000 });
    await tabButtons2.nth(2).click();
    const buildBtn2 = page.locator('button[title="Build Program"]');
    await expect(buildBtn2.first()).toBeVisible({ timeout: 60_000 });
    await buildBtn2.first().click();
    await page.fill('input[placeholder*="Push"]', title);
    // Mock Unsplash API if key not provided
    await page.route('https://api.unsplash.com/search/photos*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [{ id: 'mock1', alt_description: 'mock1', urls: { thumb: 'https://images.unsplash.com/photo-mock1?w=200', small: 'https://images.unsplash.com/photo-mock1?w=400', regular: 'https://images.unsplash.com/photo-mock1' } }] }),
      } as any);
    });
    // Open Unsplash chooser and wait for results
    await page.click('text=Choose from Unsplash');
    const unsplashImg = page.locator('img[alt="mock1"]');
    await expect(unsplashImg.first()).toBeVisible({ timeout: 30_000 });
    await unsplashImg.first().click();
    await page.click('text=Save Program');
    await page.click('text=Saved Programs');
    const card = page.locator(`text="${title}"`).first();
    await expect(card).toBeVisible();
    const img = card.locator('img');
    await expect(img).toBeVisible();
  });
});
