import { chromium } from "playwright";

import {
  fetchExercises,
  generateUploadUrl,
  uploadToStorage,
  getStorageUrl,
  updateExerciseImageUrl,
} from "./convexAdminClient.js";

function parseArgs(argv) {
  const args = {
    dryRun: false,
    limit: null,
    start: 0,
    delayMs: 1500,
    headless: true,
    log: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--no-headless") args.headless = false;
    else if (a === "--headless") args.headless = true;
    else if (a === "--limit") {
      const v = argv[i + 1];
      i += 1;
      args.limit = v ? Number(v) : null;
    } else if (a === "--start") {
      const v = argv[i + 1];
      i += 1;
      args.start = v ? Number(v) : 0;
    } else if (a === "--delay") {
      const v = argv[i + 1];
      i += 1;
      args.delayMs = v ? Number(v) : args.delayMs;
    } else if (a === "--log") {
      const v = argv[i + 1];
      i += 1;
      args.log = v || null;
    }
  }
  return args;
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function extractYouTubeVideoId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const ID_RE = /^[\w-]{11}$/;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = parsed.searchParams.get("v");
      if (v && ID_RE.test(v)) return v;
      const embedMatch = parsed.pathname.match(/^\/embed\/([\w-]{11})/);
      if (embedMatch) return embedMatch[1];
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([\w-]{11})/);
      if (shortsMatch) return shortsMatch[1];
      return null;
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      if (id && ID_RE.test(id)) return id;
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

function toYouTubeEmbedUrl(videoId) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    controls: "0",
    rel: "0",
    modestbranding: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

async function maybeDismissYouTubeConsent(page) {
  const candidates = [
    'button:has-text("Accept all")',
    'button:has-text("I agree")',
    'button:has-text("Accept")',
    'button:has-text("Agree")',
  ];
  for (const sel of candidates) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click({ timeout: 1000 });
        await page.waitForTimeout(500);
        break;
      }
    } catch {
      // ignore
    }
  }
}

async function prepareYouTubeContext(context) {
  // Best-effort: reduce GDPR consent interstitials.
  await context.addCookies([
    {
      name: "CONSENT",
      value: "YES+cb.20210328-17-p0.en+FX+405",
      domain: ".youtube.com",
      path: "/",
    },
  ]);
}

async function captureMidpointFrame(page) {
  await maybeDismissYouTubeConsent(page);

  await page.addStyleTag({
    content: `
      .ytp-chrome-top, .ytp-chrome-bottom, .ytp-gradient-top, .ytp-gradient-bottom,
      .ytp-pause-overlay, .ytp-ce-element { display: none !important; }
    `,
  });

  // Wait for the <video> element to exist.
  await page.waitForSelector("video", { timeout: 60_000 });

  // Best-effort: kick playback so metadata loads.
  await page.evaluate(() => {
    const v = document.querySelector("video");
    if (!v) return;
    v.muted = true;
    // Ignore autoplay policy errors.
    void v.play().catch(() => {});
  });

  await page.waitForFunction(
    () => {
      const v = document.querySelector("video");
      return v && Number.isFinite(v.duration) && v.duration > 0;
    },
    undefined,
    { timeout: 60_000 },
  );

  const duration = await page.evaluate(() => document.querySelector("video").duration);
  const target = Math.max(0, Math.min(duration * 0.5, duration - 0.25));

  // Pause before seeking to avoid frame skipping.
  await page.evaluate(() => {
    const v = document.querySelector("video");
    v.pause();
  });

  // Seek and wait until we are near the target time.
  await page.evaluate((t) => {
    const v = document.querySelector("video");
    v.currentTime = t;
  }, target);

  await page.waitForFunction(
    (t) => {
      const v = document.querySelector("video");
      return v && Math.abs(v.currentTime - t) < 0.75;
    },
    target,
  );

  // Ensure paused (some embeds may auto-play after seek).
  await page.evaluate(() => {
    const v = document.querySelector("video");
    v.pause();
  });

  const videoLocator = page.locator("video").first();
  return await videoLocator.screenshot({ type: "png" });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const all = await fetchExercises();
  const withVideo = all.filter((ex) => typeof ex.videoUrl === "string" && ex.videoUrl.trim() !== "");
  const start = Number.isFinite(args.start) && args.start > 0 ? Math.floor(args.start) : 0;
  const end = args.limit ? start + Math.max(0, Math.floor(args.limit)) : withVideo.length;
  const total = withVideo.slice(start, end);

  console.log(`[captureExerciseImages] total exercises: ${all.length}`);
  console.log(`[captureExerciseImages] exercises with videoUrl: ${withVideo.length}`);
  console.log(
    `[captureExerciseImages] processing: ${total.length} (start=${start}, end=${end}, dryRun=${args.dryRun})`,
  );

  let logHandle = null;
  if (args.log) {
    const fs = await import("node:fs");
    logHandle = fs.createWriteStream(args.log, { flags: "a" });
  }

  const browser = await chromium.launch({
    headless: args.headless,
    args: [
      "--autoplay-policy=no-user-gesture-required",
      "--mute-audio",
      "--disable-gpu",
    ],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await prepareYouTubeContext(context);

  const page = await context.newPage();

  let ok = 0;
  let failed = 0;

  for (let idx = 0; idx < total.length; idx += 1) {
    const ex = total[idx];
    const name = ex.name || ex._id;

    try {
      const videoId = extractYouTubeVideoId(ex.videoUrl);
      if (!videoId) {
        throw new Error(`unsupported videoUrl: ${ex.videoUrl}`);
      }
      const url = `https://www.youtube.com/watch?v=${videoId}`;

      console.log(`[${idx + 1}/${total.length}] ${name} -> ${url}`);
      let pngBytes;
      let lastErr = null;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
          pngBytes = await captureMidpointFrame(page);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          try {
            await page.waitForTimeout(1000);
            await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
          } catch {
            // ignore
          }
        }
      }
      if (!pngBytes) {
        throw lastErr || new Error("failed to capture frame");
      }
      if (args.dryRun) {
        ok += 1;
        if (logHandle) {
          logHandle.write(
            JSON.stringify({
              index: start + idx,
              _id: ex._id,
              name: ex.name,
              videoUrl: ex.videoUrl,
              ok: true,
              dryRun: true,
            }) + "\n",
          );
        }
        await sleep(args.delayMs);
        continue;
      }

      let storageId;
      let storageUrl;
      let uploadErr = null;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const uploadUrl = await generateUploadUrl();
          storageId = await uploadToStorage(uploadUrl, pngBytes, "image/png");
          storageUrl = await getStorageUrl(storageId);
          uploadErr = null;
          break;
        } catch (e) {
          uploadErr = e;
          await sleep(500);
        }
      }
      if (!storageId || !storageUrl) {
        throw uploadErr || new Error("upload failed");
      }
      if (!storageUrl) {
        throw new Error(`getUrl returned null for storageId=${storageId}`);
      }

      await updateExerciseImageUrl(ex._id, storageUrl);
      ok += 1;

      if (logHandle) {
        logHandle.write(
          JSON.stringify({
            index: start + idx,
            _id: ex._id,
            name: ex.name,
            videoUrl: ex.videoUrl,
            ok: true,
            storageId,
            imageUrl: storageUrl,
          }) + "\n",
        );
      }
    } catch (err) {
      failed += 1;
      console.error(`[captureExerciseImages] FAIL ${name}: ${err?.message || String(err)}`);

      if (logHandle) {
        logHandle.write(
          JSON.stringify({
            index: start + idx,
            _id: ex._id,
            name: ex.name,
            videoUrl: ex.videoUrl,
            ok: false,
            error: err?.message || String(err),
          }) + "\n",
        );
      }
    }

    await sleep(args.delayMs);
  }

  await browser.close();
  if (logHandle) logHandle.end();
  console.log(`[captureExerciseImages] done ok=${ok} failed=${failed}`);
  if (failed > 0) process.exitCode = 1;
}

await main();
