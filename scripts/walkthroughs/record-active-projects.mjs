// Record the "Review active projects and open a report" walkthrough.
//
// Read-only: it never modifies data. It opens the Active Projects dashboard,
// reviews each active project in displayed order with a readable pause, opens
// one project's report (a PDF served by /api/projects/[id]/report/view) in its
// new tab, and holds on the loaded report until the final sentence finishes.
//
// Pacing is driven by measured narration clip durations in
// <name>.narration.json (run narrate.mjs first). The first narration beat is
// pinned to 10s on the video timeline; the final report gets a 3s hold.
//
// Usage:
//   pnpm run dev                 # start the app first (separate terminal)
//   node scripts/walkthroughs/narrate.mjs active-projects-report
//   node scripts/walkthroughs/record-active-projects.mjs
//
// Credentials come from DEMO_USER / DEMO_PASSWORD (git-ignored .env).

import { mkdir, readFile, writeFile, rename, copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { WALKTHROUGH } from './config.mjs';

const NAME = 'active-projects-report';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(WALKTHROUGH.dir.output, NAME);
await mkdir(outDir, { recursive: true });

const script = JSON.parse(await readFile(path.join(repoRoot, 'walkthroughs', NAME, 'script.json'), 'utf8'));

let clipDurations = [];
try {
	const narration = JSON.parse(await readFile(path.join(outDir, `${NAME}.narration.json`), 'utf8'));
	clipDurations = narration.clips.map((c) => c.duration);
} catch {
	console.warn('No narration manifest found; using default pacing. Run narrate.mjs first for synced pacing.');
}

const GAP_AFTER_CLIP = 0.9;   // silence between sentences
const FINAL_HOLD = 3.0;       // extra hold on the report after the last sentence
const LEAD_IN = 10.0;         // narration starts at this second on the video

if (!WALKTHROUGH.loginEmail || !WALKTHROUGH.loginPassword) {
	console.error('Missing demo login. Set DEMO_USER and DEMO_PASSWORD in .env.');
	process.exit(1);
}

const beats = [];
const beat = (t, caption) => beats.push({ t: Number(t.toFixed(2)), caption });
const holdFor = (beatIndex) =>
	clipDurations[beatIndex] != null ? clipDurations[beatIndex] + GAP_AFTER_CLIP : 3.5;

async function login(page) {
	await page.goto(`${WALKTHROUGH.baseUrl}/auth/login`, { waitUntil: 'domcontentloaded' });
	const emailInput = page.locator('input[name="email"]');
	if (await emailInput.count() === 0) return;
	try {
		await emailInput.waitFor({ state: 'visible', timeout: 5000 });
	} catch {
		return;
	}
	await emailInput.fill(WALKTHROUGH.loginEmail);
	await page.fill('input[name="password"]', WALKTHROUGH.loginPassword);
	await Promise.all([
		page.waitForNavigation({ timeout: 30000 }).catch(() => null),
		page.click('button[type="submit"]')
	]);
	await page.waitForTimeout(600);
}

async function run() {
	const line = (i) => script.lines[i].caption;

	const context = await chromium.launchPersistentContext(WALKTHROUGH.dir.auth, {
		executablePath: WALKTHROUGH.chromiumPath,
		headless: true,
		viewport: WALKTHROUGH.viewport,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
		recordVideo: { dir: outDir, size: WALKTHROUGH.viewport }
	});
	const page = context.pages()[0] ?? (await context.newPage());

	// Start the beat clock when the recording context is ready so beat times
	// match the video timeline (browser launch overhead is excluded).
	const startedAt = Date.now();
	const t0 = () => (Date.now() - startedAt) / 1000;

	await login(page);

	// Beat 1 — land on Active Projects, fully loaded.
	await page.goto(`${WALKTHROUGH.baseUrl}/dashboard/active-projects`, { waitUntil: 'domcontentloaded' });
	await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
	await page.waitForLoadState('networkidle').catch(() => {});
	// Pin the first narration beat to the lead-in second on the video timeline.
	const leadInWait = LEAD_IN - t0();
	if (leadInWait > 0) await page.waitForTimeout(leadInWait * 1000);
	beat(t0(), line(0));
	await page.waitForTimeout(holdFor(0) * 1000);

	// Beat 2 — summary cards at the top.
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
	beat(t0(), line(1));
	await page.waitForTimeout(holdFor(1) * 1000);

	// Beat 3 — begin the per-project review: bring the first cards into view.
	const cards = page.locator('div.grid.grid-cols-1.lg\\:grid-cols-2 > *');
	const cardCount = await cards.count();
	await cards.first().scrollIntoViewIfNeeded().catch(() => {});
	beat(t0(), line(2));
	await page.waitForTimeout(holdFor(2) * 1000);

	// Beat 4 — scroll through the list, pausing so each card stays readable.
	// One continuous narration line covers the scroll; step through cards.
	beat(t0(), line(3));
	const scrollBudgetMs = holdFor(3) * 1000;
	const steps = Math.max(1, cardCount);
	const perStep = scrollBudgetMs / steps;
	for (let i = 0; i < steps; i++) {
		await cards.nth(i).scrollIntoViewIfNeeded().catch(() => {});
		await page.waitForTimeout(Math.min(perStep, 1400));
	}

	// Beat 5 — settle on the first card before opening its report.
	await cards.first().scrollIntoViewIfNeeded().catch(() => {});
	beat(t0(), line(4));
	await page.waitForTimeout(holdFor(4) * 1000);

	// Beat 6 — open the first project's report.
	const reportLink = cards.first().locator('a[href*="/report/view"]').first();
	let reportUrl = null;
	if (await reportLink.count()) {
		reportUrl = await reportLink.getAttribute('href');
		// Perform the real click (opens a new tab in the live app), then load the
		// same report in the recorded tab so it appears in this single video.
		const [popup] = await Promise.all([
			context.waitForEvent('page', { timeout: 8000 }).catch(() => null),
			reportLink.click()
		]);
		if (popup) await popup.close().catch(() => {});
	}
	beat(t0(), line(5));
	await page.waitForTimeout(holdFor(5) * 1000);

	// Beat 7 — show the loaded report in the recorded tab, hold to finish + 3s.
	if (reportUrl) {
		await page.goto(reportUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
		await page.waitForLoadState('networkidle').catch(() => {});
		await page.waitForTimeout(2500);
	}
	beat(t0(), line(6));
	const finalHold = (clipDurations[6] != null ? clipDurations[6] + FINAL_HOLD : 6);
	await page.waitForTimeout(finalHold * 1000);

	const video = page.video();
	await context.close();
	const videoPath = await video.path();
	const finalVideo = path.join(outDir, `${NAME}.webm`);
	if (videoPath !== finalVideo) {
		await rename(videoPath, finalVideo).catch(async () => {
			await copyFile(videoPath, finalVideo);
			await unlink(videoPath).catch(() => {});
		});
	}

	await writeFile(
		path.join(outDir, `${NAME}.beats.json`),
		JSON.stringify({ name: NAME, viewport: WALKTHROUGH.viewport, beats }, null, 2)
	);

	console.log('Recorded:', finalVideo);
	console.log('Beats:', beats.length, '| final beat at', beats[beats.length - 1].t + 's', '| projects seen:', cardCount, '| report opened:', !!reportUrl);
}

run().catch((e) => {
	console.error('Recording failed:', e.message);
	process.exit(1);
});
