import { test, expect } from "@playwright/test";

test.describe('Exercise Detail Modal', () => {
  test.beforeEach(async ({ page }) => {
    const ts = Date.now();
    const name = `Test User ${ts}`;
    const email = `test_${ts}@example.com`;
    const password = `Password123!`;

    // 1. Navigate to landing page
    await page.goto('http://localhost:7770', { waitUntil: 'domcontentloaded' });
    
    // Wait for initial load
    await expect(page.locator('h1')).toContainText('BODY BRIDGE', { timeout: 15000 });
    
    // 2. Start Training (Signup)
    const startBtn = page.getByRole('button', { name: 'Start Training' });
    await expect(startBtn).toBeVisible();
    await startBtn.click();
    
    // 3. Fill and submit signup form
    await page.getByPlaceholder('FULL NAME').fill(name);
    await page.getByPlaceholder('EMAIL ADDRESS').fill(email);
    await page.getByPlaceholder('SECURE PASSWORD').fill(password);
    await page.getByRole('button', { name: 'Create Profile' }).click();
    
    // 4. Onboarding Flow - Quick path through
    await expect(page.getByText('Identity', { exact: false })).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Next Phase' }).click();
    
    await expect(page.getByText('Objective', { exact: false })).toBeVisible({ timeout: 10000 });
    await page.getByText('Strength', { exact: false }).click();
    await page.getByRole('button', { name: 'Next Phase' }).click();
    
    await expect(page.getByText('Tier', { exact: false })).toBeVisible({ timeout: 10000 });
    await page.getByText('Intermediate', { exact: false }).click();
    await page.getByRole('button', { name: 'Next Phase' }).click();
    
    await expect(page.getByText('Frequency', { exact: false })).toBeVisible({ timeout: 10000 });
    await page.locator('button').filter({ hasText: /^4$/ }).click();
    await page.getByRole('button', { name: 'Next Phase' }).click();
    
    await expect(page.getByText('Verified', { exact: false })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Initialize' }).click();
    
    // 5. Wait for dashboard
    await expect(page.getByText(/Hi, .+/i)).toBeVisible({ timeout: 20000 });
    
    // 6. Navigate to Exercises view using TabBar
    const exercisesTab = page.locator('[role="tab"]').filter({ hasText: 'Exercises' });
    await expect(exercisesTab).toBeVisible({ timeout: 10000 });
    await exercisesTab.click();
    
    // Wait for exercise cards to be present
    await page.waitForSelector('[data-testid="exercise-card"]', { timeout: 15000 });
  });

  test('opens exercise detail modal when clicking on an exercise card', async ({ page }) => {
    // Get first exercise card
    const firstCard = page.locator('[data-testid="exercise-card"]').first();
    await expect(firstCard).toBeVisible();
    
    // Store exercise name before clicking
    const cardName = await firstCard.locator('h3').textContent();
    
    // Click on the exercise card (avoiding the play button)
    await firstCard.click({ position: { x: 10, y: 10 } });
    
    // Verify detail modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Verify exercise name in modal matches card name
    const modalTitle = modal.locator('h2');
    await expect(modalTitle).toBeVisible();
    if (cardName) {
      await expect(modalTitle).toHaveText(cardName);
    }
  });

  test('shows visible play video control for exercises with video', async ({ page }) => {
    // Wait for exercise cards to load
    await page.waitForSelector('[data-testid="exercise-card"]', { timeout: 10000 });
    
    // Find an exercise with video indicator
    const videoCard = page.locator('[data-testid="exercise-card"]').filter({ hasText: /Play/i }).first();
    await expect(videoCard).toBeVisible();
    
    // Click on the exercise card
    await videoCard.click();
    
    // Verify detail modal is visible
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Verify video player is present
    const videoPlayer = page.locator('video, iframe').first();
    await expect(videoPlayer).toBeVisible();
    
    // Verify play controls are visible
    if (await videoPlayer.locator('..').locator('button[aria-label*="play"], button[aria-label*="Play"]').count() > 0) {
      await expect(page.locator('button[aria-label*="play"], button[aria-label*="Play"]').first()).toBeVisible();
    }
  });

  test('allows scrolling through all exercise details', async ({ page }) => {
    // Get first exercise card
    const firstCard = page.locator('[data-testid="exercise-card"]').first();
    await firstCard.click({ position: { x: 10, y: 10 } });
    
    // Verify detail modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Verify title is visible
    await expect(modal.locator('h2')).toBeVisible();
    
    // Verify instructions section exists
    await expect(modal.locator('text=Instructions')).toBeVisible();
    
    // Scroll to instructions
    await modal.locator('text=Instructions').scrollIntoViewIfNeeded();
    
    // Verify instruction steps are visible
    const instructionSteps = modal.locator('ol li');
    await expect(instructionSteps.first()).toBeVisible();
    
    // Verify Add to Workout button is visible at bottom
    const addToWorkoutButton = modal.locator('button:has-text("Add to Workout")');
    await expect(addToWorkoutButton).toBeVisible();
    
    // Scroll to final action (Add to Workout button)
    await addToWorkoutButton.scrollIntoViewIfNeeded();
    
    // Verify button is still visible after scrolling
    await expect(addToWorkoutButton).toBeVisible();
  });

  test('closes detail modal when clicking close button', async ({ page }) => {
    // Get first exercise card
    const firstCard = page.locator('[data-testid="exercise-card"]').first();
    await firstCard.click({ position: { x: 10, y: 10 } });
    
    // Verify detail modal is visible
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Click close button
    await page.click('button[aria-label="Close exercise details"]');
    
    // Verify modal is closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('closes detail modal when clicking backdrop', async ({ page }) => {
    // Get first exercise card
    const firstCard = page.locator('[data-testid="exercise-card"]').first();
    await firstCard.click({ position: { x: 10, y: 10 } });
    
    // Verify detail modal is visible
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Click backdrop (fixed overlay behind modal)
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/80').first();
    await backdrop.click({ force: true });
    
    // Verify modal is closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('displays exercise image when no video is available', async ({ page }) => {
    // Get first exercise card (likely no video)
    const firstCard = page.locator('[data-testid="exercise-card"]').first();
    await firstCard.click({ position: { x: 10, y: 10 } });
    
    // Verify detail modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Check for image element when video might not be present
    const image = modal.locator('img').first();
    const video = modal.locator('video, iframe').first();
    
    // Either image or video should be present
    await expect(image.or(video)).toBeVisible();
    
    // If no video, verify image is displayed properly
    if (await video.count() === 0) {
      await expect(image).toBeVisible();
      await expect(image).toHaveJSProperty('complete', true);
    }
  });

  test('adds exercise to workout from detail modal', async ({ page }) => {
    // Get first exercise card
    const firstCard = page.locator('[data-testid="exercise-card"]').first();
    await firstCard.click({ position: { x: 10, y: 10 } });
    
    // Verify detail modal is visible
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    
    // Click Add to Workout button
    await page.click('button:has-text("Add to Workout")');
    
    // Verify modal is closed after adding
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('video preview modal opens from exercise card play button', async ({ page }) => {
    // Find an exercise card with video (has Play icon visible)
    const allCards = page.locator('[data-testid="exercise-card"]');
    const cardCount = await allCards.count();
    
    let videoCard = null;
    for (let i = 0; i < cardCount; i++) {
      const card = allCards.nth(i);
      const playButton = card.locator('button').filter({ has: page.locator('svg') }).first();
      if (await playButton.count() > 0) {
        videoCard = card;
        break;
      }
    }
    
    if (videoCard) {
      // Click the play button (not the card itself)
      const playButton = videoCard.locator('button').filter({ has: page.locator('svg') }).first();
      await playButton.click();
      
      // Verify video preview modal is visible
      await expect(page.locator('[role="dialog"]').nth(1)).toBeVisible({ timeout: 5000 });
      
      // Verify video player is present
      await expect(page.locator('video, iframe').first()).toBeVisible();
      
      // Close video preview
      await page.click('button[aria-label="Close video preview"]');
      
      // Verify video preview modal is closed
      await expect(page.locator('[role="dialog"]').nth(1)).not.toBeVisible({ timeout: 3000 });
    } else {
      // Skip test if no video exercises found
      console.log('No video exercises found, skipping video preview test');
      test.skip();
    }
  });

  test('displays correct exercise metadata in detail modal', async ({ page }) => {
    // Get first exercise card and store its name
    const firstCard = page.locator('[data-testid="exercise-card"]').first();
    const cardName = await firstCard.locator('h3').textContent();
    
    // Click on the exercise card
    await firstCard.click({ position: { x: 10, y: 10 } });
    
    // Verify detail modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // Verify exercise name matches
    await expect(modal.locator('h2')).toHaveText(cardName || '');
    
    // Verify metadata sections are present
    await expect(modal.locator('text=Equipment').or(modal.locator('[data-testid="equipment-section"]'))).toBeVisible();
    await expect(modal.locator('text=Instructions').or(modal.locator('[data-testid="instructions-section"]'))).toBeVisible();
  });
});