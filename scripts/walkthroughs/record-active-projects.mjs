// Record the "Review active projects and open a report" walkthrough.
//
// Read-only: it never modifies data. The editable source is
// walkthroughs/active-projects-report/script.md; narrate.mjs turns it into a
// beat schedule (beats.json) with measured narration durations. This recorder
// simply follows that schedule, performing each beat's named action on time.
//
// Usage:
//   pnpm run dev                 # start the app first (separate terminal)
//   node scripts/walkthroughs/narrate.mjs active-projects-report
//   node scripts/walkthroughs/record-active-projects.mjs
//
// Credentials come from DEMO_USER / DEMO_PASSWORD (git-ignored .env).

import { mkdir, readFile, rename, copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { WALKTHROUGH } from './config.mjs';
import { loadScriptSource } from './script-source.mjs';

const NAME = 'active-projects-report';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(WALKTHROUGH.dir.output, NAME);
await mkdir(outDir, { recursive: true });

const script = await loadScriptSource(repoRoot, NAME);
const beatsFile = JSON.parse(await readFile(path.join(outDir, `${NAME}.beats.json`), 'utf8'));
const narration = JSON.parse(await readFile(path.join(outDir, `${NAME}.narration.json`), 'utf8'));

const FINAL_HOLD = 3.0;
const CARD_GRID = 'div.grid.grid-cols-1.lg\\:grid-cols-2 > *';

if (!WALKTHROUGH.loginEmail || !WALKTHROUGH.loginPassword) {
	console.error('Missing demo login. Set DEMO_USER and DEMO_PASSWORD in .env.');
	process.exit(1);
}

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
	const context = await chromium.launchPersistentContext(WALKTHROUGH.dir.auth, {
		executablePath: WALKTHROUGH.chromiumPath,
		headless: true,
		viewport: WALKTHROUGH.viewport,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
		recordVideo: { dir: outDir, size: WALKTHROUGH.viewport }
	});
	const page = context.pages()[0] ?? (await context.newPage());

	// Clock starts when the recording context is ready, so beat times match the
	// video timeline (browser launch overhead is excluded).
	const startedAt = Date.now();
	const t0 = () => (Date.now() - startedAt) / 1000;
	const waitUntil = async (t) => {
		const ms = (t - t0()) * 1000;
		if (ms > 0) await page.waitForTimeout(ms);
	};

	let reportUrl = null;

	const actions = {
		'open-dashboard': async () => {
			await page.goto(`${WALKTHROUGH.baseUrl}/dashboard/active-projects`, { waitUntil: 'domcontentloaded' });
			await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
			await page.waitForLoadState('networkidle').catch(() => {});
		},
		'show-summary': async () => {
			await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
		},
		'show-first-cards': async () => {
			await page.locator(CARD_GRID).first().scrollIntoViewIfNeeded().catch(() => {});
		},
		'scroll-all': async () => {
			const cards = page.locator(CARD_GRID);
			const count = await cards.count();
			for (let i = 0; i < count; i++) {
				await cards.nth(i).scrollIntoViewIfNeeded().catch(() => {});
				await page.waitForTimeout(180);
			}
		},
		'settle-first': async () => {
			await page.locator(CARD_GRID).first().scrollIntoViewIfNeeded().catch(() => {});
		},
		'open-report': async () => {
			const link = page.locator(CARD_GRID).first().locator('a[href*="/report/view"]').first();
			if (!(await link.count())) return;
			reportUrl = await link.getAttribute('href');
			// Real click (opens a new tab in the live app); close the popup and load
			// the same report in the recorded tab so it appears in this video.
			const [popup] = await Promise.all([
				context.waitForEvent('page', { timeout: 8000 }).catch(() => null),
				link.click()
			]);
			if (popup) await popup.close().catch(() => {});
			if (reportUrl) await page.goto(reportUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
		},
		'show-report': async () => {
			await page.waitForLoadState('networkidle').catch(() => {});
		}
	};

	await login(page);

	const lastBeat = beatsFile.beats[beatsFile.beats.length - 1];
	for (let i = 0; i < beatsFile.beats.length; i++) {
		const scheduled = beatsFile.beats[i].t;
		// Arrive slightly early so the UI is settled when narration starts.
		await waitUntil(Math.max(0, scheduled - 0.35));
		const actionName = script.beats[i]?.action;
		if (actionName && actions[actionName]) await actions[actionName]();
	}

	// Hold the final view until the last sentence finishes, plus the closing hold.
	const lastClip = narration.clips[narration.clips.length - 1];
	const endAt = lastClip
		? lastClip.t + lastClip.duration + FINAL_HOLD
		: lastBeat.t + 3.5 + FINAL_HOLD;
	await waitUntil(endAt);

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

	console.log('Recorded:', finalVideo, '| beats:', beatsFile.beats.length, '| report opened:', !!reportUrl);
}

run().catch((e) => {
	console.error('Recording failed:', e.message);
	process.exit(1);
});
