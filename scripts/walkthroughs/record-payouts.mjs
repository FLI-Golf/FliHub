// Record the "Tournament Payouts & Manager Cut" walkthrough.
//
// Demonstrates, through the live application UI only:
//   - the tournament prize-pool settings and seeded finishing order,
//   - how professional payouts are calculated per placement,
//   - how a manager's percentage reduces a pro's net allocation,
//   - the per-tournament math verification against the configured rules,
//   - the final paid result.
//
// The script drives a real browser, records a WebM of the application UI, and
// writes a caption/narration timeline (beat + caption text + timestamps) that the
// narration/assembly step uses to sync audio and captions to the video.
//
// Usage:
//   pnpm run dev            # start the app first (separate terminal)
//   node scripts/walkthroughs/record-payouts.mjs
//
// Credentials come from WALKTHROUGH_LOGIN_EMAIL / WALKTHROUGH_LOGIN_PASSWORD (or a
// git-ignored .env). Output lands in walkthroughs/output/ (git-ignored).

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { WALKTHROUGH } from './config.mjs';

const NAME = 'tournament-payouts';
const outDir = path.join(WALKTHROUGH.dir.output, NAME);
await mkdir(outDir, { recursive: true });

if (!WALKTHROUGH.loginEmail || !WALKTHROUGH.loginPassword) {
	console.error('Missing demo login. Set WALKTHROUGH_LOGIN_EMAIL and WALKTHROUGH_LOGIN_PASSWORD (or in .env).');
	process.exit(1);
}

// Caption beats with the elapsed time (seconds) at which each action completes.
// The narration script is generated from these so audio stays in sync.
const beats = [];
const beat = (t, caption) => beats.push({ t: Number(t.toFixed(2)), caption });

async function login(page) {
	await page.goto(`${WALKTHROUGH.baseUrl}/auth/login`, { waitUntil: 'domcontentloaded' });
	// The persistent context may already be authenticated and redirect away.
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

	const context = await chromium.launchPersistentContext(WALKTHROUGH.dir.auth, {
		executablePath: WALKTHROUGH.chromiumPath,
		headless: true,
		viewport: WALKTHROUGH.viewport,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
		recordVideo: { dir: outDir, size: WALKTHROUGH.viewport }
	});
	const page = context.pages()[0] ?? (await context.newPage());

	await login(page);

	// Navigate to the payout testing page.
	await page.goto(`${WALKTHROUGH.baseUrl}/dashboard/talent/payout-testing`, { waitUntil: 'domcontentloaded' });
	await page.waitForTimeout(3000);
	beat(t0(), 'In FliHub, an admin opens the payout testing dashboard for the season.');

	// Show the season summary strip (prize pool, franchise, to pros, to managers).
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
	await page.waitForTimeout(4000);
	beat(t0(), 'The season summary shows the prize pool split between pros, managers, and franchises.');

	// Seed the first tournament through the UI to produce a finishing order and payouts.
	const firstCard = page.locator('div.rounded-xl.border.overflow-hidden').first();
	const seedButton = firstCard.locator('button:has-text("Seed Results")');
	if (await seedButton.count()) {
		await seedButton.scrollIntoViewIfNeeded();
		await page.waitForTimeout(800);
		await seedButton.click();
		await page.waitForTimeout(5000);
		beat(t0(), 'Seeding the first tournament produces a finishing order and calculates each placement\'s payout.');
		await page.waitForTimeout(1500);
	} else {
		beat(t0(), 'The first tournament already has a finishing order and calculated payouts.');
	}

	// Expand the first tournament to reveal standings and the math check.
	const expandToggle = page.locator('div.rounded-xl.border.overflow-hidden').first().locator('button').last();
	await expandToggle.scrollIntoViewIfNeeded();
	await expandToggle.click();
	await page.waitForTimeout(2000);
	beat(t0(), 'Expanding the tournament shows the team standings and the prize-pool math check.');
	await page.waitForTimeout(2500);

	// Scroll to the pro rows showing gross, manager cut percentage, and net.
	await page.mouse.wheel(0, 420);
	await page.waitForTimeout(2500);
	beat(t0(), 'Each pro row lists the gross payout, the manager\'s percentage cut, and the resulting net.');
	await page.waitForTimeout(3500);

	// Scroll back to the summary to close on the totals.
	await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
	await page.waitForTimeout(2500);
	beat(t0(), 'The summary confirms the tournament total matches the configured payout rules.');
	// Hold the final result long enough to read before resetting.
	await page.waitForTimeout(5000);

	// Reset the tournament so the demo data returns to a clean state.
	const resetToggle = page.locator('div.rounded-xl.border.overflow-hidden').first().locator('button[title*="Reset"]');
	if (await resetToggle.count()) {
		await resetToggle.click();
		await page.waitForTimeout(3000);
		beat(t0(), 'The demonstration resets the seeded tournament so the demo data stays clean.');
		await page.waitForTimeout(2500);
	}

	const video = page.video();
	await context.close();
	const videoPath = await video.path();
	const finalVideo = path.join(outDir, `${NAME}.webm`);
	// Playwright auto-names the file; rename it deterministically.
	if (videoPath !== finalVideo) {
		const { rename, copyFile, unlink } = await import('node:fs/promises');
		await rename(videoPath, finalVideo).catch(async () => {
			await copyFile(videoPath, finalVideo);
			await unlink(videoPath).catch(() => {});
		});
	}

	// Persist the caption timeline for narration + assembly.
	await writeFile(
		path.join(outDir, `${NAME}.beats.json`),
		JSON.stringify({ name: NAME, viewport: WALKTHROUGH.viewport, beats }, null, 2)
	);

	console.log('Recorded:', finalVideo);
	console.log('Beats:', beats.length);
}

run().catch((e) => {
	console.error('Recording failed:', e.message);
	process.exit(1);
});
