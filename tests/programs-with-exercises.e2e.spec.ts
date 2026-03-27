import { test, expect } from "@playwright/test";

/**
 * Helper: Dynamic signup + onboarding advancement.
 * Reused pattern from exercisesSort.e2e.spec.ts.
 */
async function signupAndOnboard(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const ts = Date.now();
  const name = `E2E Prog ${ts}`;
  const email = `e2e_prog_${ts}@example.com`;
  const password = `TestPassword!${String(ts).slice(-4)}`;

  const startTraining = page.locator('button:has-text("Start Training")');
  const joinHeading = page.getByRole("heading", { name: "JOIN" });

  await expect(startTraining.or(joinHeading)).toBeVisible({ timeout: 30_000 });

  if (await startTraining.isVisible()) {
    await startTraining.first().click();
    await expect(joinHeading).toBeVisible({ timeout: 15_000 });
  }

  const nameInput = page.getByRole("textbox", { name: "FULL NAME" });
  await expect(nameInput).toBeVisible({ timeout: 10_000 });
  await nameInput.fill(name);
  await page.getByRole("textbox", { name: "EMAIL ADDRESS" }).fill(email);
  await page.getByRole("textbox", { name: "SECURE PASSWORD" }).fill(password);
  await page.getByRole("button", { name: "Create Profile" }).click();

  for (let i = 0; i < 12; i += 1) {
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
}

/**
 * Helper: Navigate to the Workouts tab via the bottom TabBar.
 */
async function goToWorkouts(page: import("@playwright/test").Page) {
  const wBtn = page.getByRole("button", { name: "Workouts" });
  if ((await wBtn.count()) > 0 && (await wBtn.first().isVisible())) {
    await wBtn.first().click();
  } else {
    const tabButtons = page.locator("div.fixed.bottom-0 button");
    await expect(tabButtons.first()).toBeVisible({ timeout: 60_000 });
    await tabButtons.nth(2).click();
  }
  // Wait for the Workouts view header to confirm navigation
  await page.getByText("Training Programs").first().waitFor({ timeout: 60_000 });
}

test.describe("Program creation and instantiation", () => {
  test("create program with exercise, see in Saved Programs, open WorkoutDetail", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // ── Signup & onboarding ──
    await signupAndOnboard(page);

    // ── Navigate to Workouts tab ──
    await goToWorkouts(page);

    const programTitle = `Test Program ${Date.now()}`;
    const searchTerm = "Zottman";

    // ── Open ProgramBuilder ──
    const buildBtn = page.locator('button[title="Build Program"]');
    await expect(buildBtn).toBeVisible({ timeout: 15_000 });
    await buildBtn.click();

    // Wait for ProgramBuilder modal to appear
    await expect(page.getByText("New Program")).toBeVisible({ timeout: 10_000 });

    // ── Fill program title ──
    const titleInput = page.getByPlaceholder("e.g., Push / Pull / Legs");
    await expect(titleInput).toBeVisible({ timeout: 5_000 });
    await titleInput.fill(programTitle);

    // ── Verify exercise count starts at 0 ──
    // The ProgramBuilder shows "Exercises" label with count beside it
    const exerciseCountLabel = page.locator('text=Exercises').first();
    await expect(exerciseCountLabel).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('span:text-is("(0)")').last()).toBeVisible();

    // ── Add exercise via ExercisePicker ──
    const addBtn = page.locator('button:has-text("Add")').first();
    await addBtn.click();

    // Wait for ExercisePicker to open
    await expect(page.getByText("Add Exercises")).toBeVisible({
      timeout: 10_000,
    });

    // Search for a stable exercise
    const searchInput = page.getByPlaceholder("Search exercises...");
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await searchInput.fill(searchTerm);

    // Wait for exercise cards to load
    await page.waitForTimeout(2_000);

    // Click the first exercise card to SELECT it
    const exerciseCards = page.locator(
      'button.relative.aspect-\\[4\\/5\\]'
    );
    await expect(exerciseCards.first()).toBeVisible({ timeout: 15_000 });
    await exerciseCards.first().scrollIntoViewIfNeeded();

    // Get the exercise name before clicking
    const exerciseNameEl = exerciseCards.first().locator("h4").first();
    const exerciseName = (await exerciseNameEl.textContent()) ?? "";
    expect(exerciseName.length).toBeGreaterThan(0);

    // First click: select the exercise card
    await exerciseCards.first().click();

    // Wait for the centered Add (+) button to appear on the selected card
    // The add button is a white circle with a Plus icon inside
    const centerAddBtn = exerciseCards
      .first()
      .locator("button.relative.w-16.h-16");
    await expect(centerAddBtn).toBeVisible({ timeout: 5_000 });

    // Second click: click the centered add button to add the exercise
    // Use evaluate to click the button directly to bypass pointer interception/nesting issues
    await centerAddBtn.evaluate(el => (el as HTMLElement).click());

    // Wait for the success animation (600ms) then ExercisePicker should close
    // and exercise should be added to the list in ProgramBuilder
    await expect(page.getByText("Add Exercises")).not.toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);

    // ── Verify exercise count incremented to 1 ──
    // Use a simpler selector for the count
    await expect(page.getByText("(1)")).toBeVisible({ timeout: 10_000 });

    // Verify the exercise name appears in the ProgramBuilder list
    // Use last() because the ExercisePicker might still have the name in the background
    await expect(page.getByText(exerciseName).last()).toBeVisible({
      timeout: 5_000,
    });

    // ── Save the program ──
    const saveBtn = page.locator('button:has-text("Save Program")');
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();

    // Wait for modal to close (ProgramBuilder disappears)
    await expect(page.getByText("New Program")).not.toBeVisible({
      timeout: 10_000,
    });

    // ── Verify program appears in Saved Programs section ──
    const savedSection = page.getByText("Saved Programs");
    await expect(savedSection).toBeVisible({ timeout: 15_000 });

    // The program card with our title should be visible
    const programCard = page.locator(`text=${programTitle}`).first();
    await expect(programCard).toBeVisible({ timeout: 15_000 });

    // Screenshot: Saved Programs showing the new program
    await page.screenshot({
      path: ".sisyphus/evidence/task-5-saved-programs.png",
    });

    // ── Click the saved program card to open WorkoutDetail ──
    // The saved program is a button in the horizontal scroll area
    const savedProgramBtn = page
      .locator(`button:has-text("${programTitle}")`)
      .first();
    await savedProgramBtn.click();

    // ── Verify WorkoutDetail opens with correct heading ──
    const workoutHeading = page.locator("h1").filter({ hasText: programTitle });
    await expect(workoutHeading).toBeVisible({ timeout: 15_000 });

    // ── Verify the exercise name appears in the circuit sequence ──
    // Exercise names are in h4 elements, rendered uppercase italic
    const exerciseInList = page
      .locator("h4")
      .filter({ hasText: new RegExp(exerciseName, "i") });
    await expect(exerciseInList.first()).toBeVisible({ timeout: 15_000 });

    // Screenshot: WorkoutDetail showing the program with exercise
    await page.screenshot({
      path: ".sisyphus/evidence/task-5-workout-detail.png",
    });
  });

  test("create program with title but no exercises (backward compatibility)", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // ── Signup & onboarding ──
    await signupAndOnboard(page);

    // ── Navigate to Workouts tab ──
    await goToWorkouts(page);

    const programTitle = `Empty Program ${Date.now()}`;

    // ── Open ProgramBuilder ──
    const buildBtn = page.locator('button[title="Build Program"]');
    await expect(buildBtn).toBeVisible({ timeout: 15_000 });
    await buildBtn.click();

    await expect(page.getByText("New Program")).toBeVisible({ timeout: 10_000 });

    // ── Fill title only, no exercises ──
    const titleInput = page.getByPlaceholder("e.g., Push / Pull / Legs");
    await titleInput.fill(programTitle);

    // Verify "No exercises yet" placeholder
    await expect(page.getByText("No exercises yet")).toBeVisible();

    // ── Save ──
    const saveBtn = page.locator('button:has-text("Save Program")');
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();

    // Wait for modal to close
    await expect(page.getByText("New Program")).not.toBeVisible({
      timeout: 10_000,
    });

    // ── Verify program appears in Saved Programs ──
    const savedSection = page.getByText("Saved Programs");
    await expect(savedSection).toBeVisible({ timeout: 15_000 });

    const programCard = page.locator(`text=${programTitle}`).first();
    await expect(programCard).toBeVisible({ timeout: 15_000 });

    // Verify the card shows "0 exercises"
    const savedProgramBtn = page
      .locator(`button:has-text("${programTitle}")`)
      .first();
    const exerciseCount = savedProgramBtn.locator('text="0 exercises"');
    await expect(exerciseCount).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Full pipeline: Program → ProgramBuilder → Player", () => {
  /**
   * Helper: Add an exercise by search term via ExercisePicker.
   * Returns the exercise name that was added.
   */
  async function addExerciseBySearch(
    page: import("@playwright/test").Page,
    searchTerm: string
  ): Promise<string> {
    // Open ExercisePicker
    const addBtn = page.locator('button:has-text("Add")').first();
    await addBtn.click();
    await expect(page.getByText("Add Exercises")).toBeVisible({ timeout: 10_000 });

    // Search
    const searchInput = page.getByPlaceholder("Search exercises...");
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(2_000);

    // Click first exercise card to select
    const exerciseCards = page.locator('button.relative.aspect-\\[4\\/5\\]');
    await expect(exerciseCards.first()).toBeVisible({ timeout: 15_000 });
    await exerciseCards.first().scrollIntoViewIfNeeded();

    // Grab the name
    const nameEl = exerciseCards.first().locator("h4").first();
    const name = (await nameEl.textContent()) ?? "";
    expect(name.length).toBeGreaterThan(0);

    // First click: select
    await exerciseCards.first().click();

    // Second click: centered add button
    const centerAddBtn = exerciseCards.first().locator("button.relative.w-16.h-16");
    await expect(centerAddBtn).toBeVisible({ timeout: 5_000 });
    await centerAddBtn.evaluate((el) => (el as HTMLElement).click());

    // Wait for ExercisePicker to close
    await expect(page.getByText("Add Exercises")).not.toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);

    return name;
  }

  test("create program with 3 exercises, verify order in builder and player", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    // ── Signup & onboarding ──
    await signupAndOnboard(page);
    await goToWorkouts(page);

    const programTitle = `Pipeline Test ${Date.now()}`;
    const searchTerms = ["bench", "squat", "push up"];

    // ── Open ProgramBuilder ──
    const buildBtn = page.locator('button[title="Build Program"]');
    await expect(buildBtn).toBeVisible({ timeout: 15_000 });
    await buildBtn.click();
    await expect(page.getByText("New Program")).toBeVisible({ timeout: 10_000 });

    // ── Fill title ──
    const titleInput = page.getByPlaceholder("e.g., Push / Pull / Legs");
    await expect(titleInput).toBeVisible({ timeout: 5_000 });
    await titleInput.fill(programTitle);

    // ── Add 3 exercises ──
    const exerciseNames: string[] = [];
    for (let i = 0; i < searchTerms.length; i++) {
      const name = await addExerciseBySearch(page, searchTerms[i]);
      exerciseNames.push(name);

      // Verify exercise count incremented
      await expect(page.locator(`span:text-is("(${i + 1})")`).last()).toBeVisible({ timeout: 10_000 });
    }

    // ── Verify correct order in ProgramBuilder list ──
    // The exercise list in ProgramBuilder uses h4 tags for names
    const builderExerciseNames = page
      .locator(".space-y-3 > div h4")
      .filter({ has: page.locator("text=/./") });
    const builderCount = await builderExerciseNames.count();
    expect(builderCount).toBe(3);

    for (let i = 0; i < 3; i++) {
      const text = await builderExerciseNames.nth(i).textContent();
      expect(text?.trim()).toBe(exerciseNames[i]);
    }

    // ── Verify reps/sets metadata is visible in ProgramBuilder ──
    // Each exercise row shows either "N sets" + "N reps" OR a duration badge,
    // plus a "Rest Ns" badge. Verify each exercise row has at least one metadata badge.
    const exerciseRows = page.locator('.space-y-3 > div');
    const rowCount = await exerciseRows.count();
    expect(rowCount).toBe(3);
    for (let i = 0; i < rowCount; i++) {
      const row = exerciseRows.nth(i);
      // Each row must have at least one metadata span (sets, reps, duration, or rest)
      const metaBadges = row.locator('span.text-\\[10px\\]');
      expect(await metaBadges.count()).toBeGreaterThanOrEqual(1);
    }

    // ── Save the program ──
    const saveBtn = page.locator('button:has-text("Save Program")');
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();
    await expect(page.getByText("New Program")).not.toBeVisible({ timeout: 10_000 });

    // ── Verify program appears in Saved Programs ──
    await expect(page.getByText("Saved Programs")).toBeVisible({ timeout: 15_000 });
    const programCard = page.locator(`text=${programTitle}`).first();
    await expect(programCard).toBeVisible({ timeout: 15_000 });

    // ── Click saved program to open WorkoutDetail ──
    const savedProgramBtn = page
      .locator(`button:has-text("${programTitle}")`)
      .first();
    await savedProgramBtn.click();

    // ── Verify WorkoutDetail heading ──
    const workoutHeading = page.locator("h1").filter({ hasText: programTitle });
    await expect(workoutHeading).toBeVisible({ timeout: 15_000 });

    // ── Verify CIRCUIT SEQUENCE header ──
    await expect(page.getByText("CIRCUIT SEQUENCE")).toBeVisible({ timeout: 10_000 });

    // ── Verify all 3 exercises load in player in correct order ──
    // WorkoutDetail renders exercises as h4 elements (uppercase italic) inside circuit list
    // Scroll down to make exercises visible
    const scrollContainer = page.locator('.overflow-y-auto.custom-scrollbar').first();
    await scrollContainer.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(1_000);

    for (const name of exerciseNames) {
      const exerciseInList = page
        .locator("h4")
        .filter({ hasText: new RegExp(name, "i") });
      await expect(exerciseInList.first()).toBeVisible({ timeout: 15_000 });
    }

    // Verify the count label
    await expect(
      page.getByText(`${exerciseNames.length} MOVEMENTS`)
    ).toBeVisible({ timeout: 10_000 });

    // ── Verify exercise order in player matches ProgramBuilder order ──
    // Collect all h4 texts inside the circuit sequence area
    const circuitExerciseNames = page.locator(".space-y-3 h4");
    const playerCount = await circuitExerciseNames.count();
    expect(playerCount).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < exerciseNames.length; i++) {
      const playerText = await circuitExerciseNames.nth(i).textContent();
      expect(playerText?.trim().toLowerCase()).toContain(
        exerciseNames[i].toLowerCase()
      );
    }

    // ── Verify reps/duration metadata visible in player ──
    // Each exercise row shows duration or reps + muscleGroup
    const exerciseMetaTexts = page.locator(".space-y-3 p");
    const metaCount = await exerciseMetaTexts.count();
    expect(metaCount).toBeGreaterThanOrEqual(3);

    // ── Screenshot evidence ──
    await page.screenshot({
      path: ".sisyphus/evidence/task-6-full-pipeline.png",
    });
  });

  test("empty exercises program saves and shows 0 exercises in Saved Programs", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // ── Signup & onboarding ──
    await signupAndOnboard(page);
    await goToWorkouts(page);

    const programTitle = `Empty Pipeline ${Date.now()}`;

    // ── Open ProgramBuilder ──
    const buildBtn = page.locator('button[title="Build Program"]');
    await expect(buildBtn).toBeVisible({ timeout: 15_000 });
    await buildBtn.click();
    await expect(page.getByText("New Program")).toBeVisible({ timeout: 10_000 });

    // ── Fill title, do NOT add exercises ──
    const titleInput = page.getByPlaceholder("e.g., Push / Pull / Legs");
    await titleInput.fill(programTitle);

    // Verify "No exercises yet" placeholder
    await expect(page.getByText("No exercises yet")).toBeVisible();

    // Verify count shows (0)
    await expect(page.locator('span:text-is("(0)")').last()).toBeVisible();

    // ── Save ──
    const saveBtn = page.locator('button:has-text("Save Program")');
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();
    await expect(page.getByText("New Program")).not.toBeVisible({ timeout: 10_000 });

    // ── Verify in Saved Programs ──
    await expect(page.getByText("Saved Programs")).toBeVisible({ timeout: 15_000 });
    const programCard = page.locator(`text=${programTitle}`).first();
    await expect(programCard).toBeVisible({ timeout: 15_000 });

    // ── Verify "0 exercises" label on the card ──
    const savedProgramBtn = page
      .locator(`button:has-text("${programTitle}")`)
      .first();
    const exerciseCountLabel = savedProgramBtn.locator('text="0 exercises"');
    await expect(exerciseCountLabel).toBeVisible({ timeout: 10_000 });

    // ── Screenshot evidence ──
    await page.screenshot({
      path: ".sisyphus/evidence/task-6-empty-program.png",
    });
  });
});
