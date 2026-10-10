// Record the "Tournament Payouts & Manager Cut" walkthrough.
//
// Demonstrates, through the live application UI only:
//   - the tournament prize-pool settings and seeded finishing order,
//   - how professional payouts are calculated per placement,
//   - how a manager's percentage reduces a pro's net allocation,
//   - the per-tournament math verification against the configured rules,
//   - the final payout summary, held until the last narration sentence finishes.
//
// Pacing is driven by the measured narration clip durations in
// <name>.narration.json (run narrate.mjs first): each beat holds the view until
// its sentence finishes, and the final summary gets an extra 3s hold.
// The demo-data reset runs AFTER recording stops, so it never appears on video.
//
// Usage:
//   pnpm run dev            # start the app first (separate terminal)
//   node scripts/walkthroughs/narrate.mjs tournament-payouts
//   node scripts/walkthroughs/record-payouts.mjs
//
// Credentials come from WALKTHROUGH_LOGIN_EMAIL / WALKTHROUGH_LOGIN_PASSWORD (or a
// git-ignored .env). Output lands in walkthroughs/output/ (git-ignored).

import { mkdir, readFile, writeFile, rename, copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { WALKTHROUGH } from './config.mjs';

const NAME = 'tournament-payouts';
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
const FINAL_HOLD = 3.0;       // extra hold on the final summary after the last sentence

if (!WALKTHROUGH.loginEmail || !WALKTHROUGH.loginPassword) {
	console.error('Missing demo login. Set WALKTHROUGH_LOGIN_EMAIL and WALKTHROUGH_LOGIN_PASSWORD (or in .env).');
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
	await page.waitForTimeout(2000);
}

async function run() {
	const startedAt = Date.now();
	const t0 = () => (Date.now() - startedAt) / 1000;
	const line = (i) => script.lines[i].caption;

	const context = await chromium.launchPersistentContext(WALKTHROUGH.dir.auth, {
		executablePath: WALKTHROUGH.chromiumPath,
		headless: true,
		viewport: WALKTHROUGH.viewport,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
		recordVideo: { dir: outDir, size: WALKTHROUGH.viewport }
	});
	const page = context.pages()[0] ?? (await context.newPage());

	await login(page);

	// Beat 1 — land on the payout testing dashboard.
	await page.goto(`${WALKTHROUGH.baseUrl}/dashboard/talent/payout-testing`, { waitUntil: 'domcontentloaded' });
	await page.waitForTimeout(2500);
	beat(t0(), line(0));
	await page.waitForTimeout(holdFor(0) * 1000);

	// Beat 2 — season summary strip.
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
	beat(t0(), line(1));
	await page.waitForTimeout(holdFor(1) * 1000);

	// Beat 3 — seed the first tournament through the UI.
	const firstCard = page.locator('div.rounded-xl.border.overflow-hidden').first();
	const seedButton = firstCard.locator('button:has-text("Seed Results")');
	if (await seedButton.count()) {
		await seedButton.scrollIntoViewIfNeeded();
		await page.waitForTimeout(600);
		await seedButton.click();
		await page.waitForTimeout(5000);
	}
	beat(t0(), line(2));
	await page.waitForTimeout(holdFor(2) * 1000);

	// Beat 4 — expand to reveal standings and the math check.
	const expandToggle = page.locator('div.rounded-xl.border.overflow-hidden').first().locator('button').last();
	await expandToggle.scrollIntoViewIfNeeded();
	await expandToggle.click();
	await page.waitForTimeout(1500);
	beat(t0(), line(3));
	await page.waitForTimeout(holdFor(3) * 1000);

	// Beat 5 — pro rows: gross, manager cut percentage, net.
	await page.mouse.wheel(0, 420);
	beat(t0(), line(4));
	await page.waitForTimeout(holdFor(4) * 1000);

	// Beat 6 — back to the summary; hold until the last sentence finishes + 3s.
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
	await page.waitForTimeout(600);
	beat(t0(), line(5));
	const finalHold = (clipDurations[5] != null ? clipDurations[5] + FINAL_HOLD : 6);
	await page.waitForTimeout(finalHold * 1000);

	// Stop recording before touching any demo data.
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

	// Reset the seeded tournament off-camera so demo data stays clean.
	try {
		const cleanup = await chromium.launchPersistentContext(WALKTHROUGH.dir.auth, {
			executablePath: WALKTHROUGH.chromiumPath,
			headless: true,
			viewport: WALKTHROUGH.viewport,
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
		});
		const cleanupPage = cleanup.pages()[0] ?? (await cleanup.newPage());
		await cleanupPage.goto(`${WALKTHROUGH.baseUrl}/dashboard/talent/payout-testing`, { waitUntil: 'domcontentloaded' });
		await cleanupPage.waitForTimeout(2500);
		const resetToggle = cleanupPage.locator('div.rounded-xl.border.overflow-hidden').first().locator('button[title*="Reset"]');
		if (await resetToggle.count()) {
			await resetToggle.click();
			await cleanupPage.waitForTimeout(3000);
		}
		await cleanup.close();
		console.log('Demo data reset off-camera.');
	} catch (e) {
		console.warn('Off-camera reset skipped:', e.message);
	}

	await writeFile(
		path.join(outDir, `${NAME}.beats.json`),
		JSON.stringify({ name: NAME, viewport: WALKTHROUGH.viewport, beats }, null, 2)
	);

	console.log('Recorded:', finalVideo);
	console.log('Beats:', beats.length, '| final beat at', beats[beats.length - 1].t + 's');
}

run().catch((e) => {
	console.error('Recording failed:', e.message);
	process.exit(1);
});
