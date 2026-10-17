// Record the "Tournament Payout Review" walkthrough.
//
// Seeds the FLI Golf Season Opener only, then reviews the result. No other
// tournament is seeded, nothing is reset, and no payments are initiated.
// The editable source is walkthroughs/tournament-payout-review/script.md;
// narrate.mjs turns it into a beat schedule (beats.json). This recorder follows
// that schedule.
//
// Target: the production UI. Set WALKTHROUGH_BASE_URL to the deployed origin.
// Credentials come from DEMO_USER / DEMO_PASSWORD (git-ignored .env) and are
// entered through the normal login UI — never logged.
//
// Usage:
//   WALKTHROUGH_BASE_URL=https://<prod-origin> node scripts/walkthroughs/narrate.mjs tournament-payout-review
//   WALKTHROUGH_BASE_URL=https://<prod-origin> node scripts/walkthroughs/record-tournament-payout-review.mjs
//   node scripts/walkthroughs/assemble.mjs tournament-payout-review

import { mkdir, readFile, rename, copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { WALKTHROUGH } from './config.mjs';
import { loadScriptSource } from './script-source.mjs';

const NAME = 'tournament-payout-review';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(WALKTHROUGH.dir.output, NAME);
await mkdir(outDir, { recursive: true });

const script = await loadScriptSource(repoRoot, NAME);
const beatsFile = JSON.parse(await readFile(path.join(outDir, `${NAME}.beats.json`), 'utf8'));
const narration = JSON.parse(await readFile(path.join(outDir, `${NAME}.narration.json`), 'utf8'));

const FINAL_HOLD = 3.0;
const PAGE = '/dashboard/talent/payout-testing';
const CARD = 'div.rounded-xl.border.overflow-hidden';

if (!WALKTHROUGH.loginEmail || !WALKTHROUGH.loginPassword) {
	console.error('Missing demo login. Set DEMO_USER and DEMO_PASSWORD in .env.');
	process.exit(1);
}

async function login(page) {
	await page.goto(`${WALKTHROUGH.baseUrl}/auth/login`, { waitUntil: 'domcontentloaded' });
	const emailInput = page.locator('input[name="email"]');
	if (await emailInput.count() === 0) return;
	try {
		await emailInput.waitFor({ state: 'visible', timeout: 8000 });
	} catch {
		return;
	}
	await emailInput.fill(WALKTHROUGH.loginEmail);
	await page.fill('input[name="password"]', WALKTHROUGH.loginPassword);
	await page.locator('button[type="submit"]').dispatchEvent('click');
	await page.waitForNavigation({ timeout: 30000 }).catch(() => null);
	await page.waitForTimeout(800);
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

	// Capture browser errors for diagnosis. Sanitized; never log credentials.
	page.on('pageerror', (e) => console.log('[pageerror]', String(e.message || e).slice(0, 300)));
	page.on('console', (m) => {
		if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 300));
	});
	page.on('requestfailed', (r) => console.log('[requestfailed]', r.url(), r.failure()?.errorText));
	page.on('crash', () => console.log('[page] crashed'));

	const startedAt = Date.now();
	const t0 = () => (Date.now() - startedAt) / 1000;
	const waitUntil = async (t) => {
		const ms = (t - t0()) * 1000;
		if (ms > 0) await page.waitForTimeout(ms);
	};

	// The Season Opener is tournament #1 — the first card.
	const openerCard = () => page.locator(CARD).filter({ hasText: 'Season Opener' }).first();

	let seeded = false;

	const actions = {
		'open-payout-testing': async () => {
			await page.goto(`${WALKTHROUGH.baseUrl}${PAGE}`, { waitUntil: 'domcontentloaded' });
			await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
			await page.waitForLoadState('networkidle').catch(() => {});
		},
		'show-not-seeded': async () => {
			await openerCard().scrollIntoViewIfNeeded().catch(() => {});
		},
		'seed-opener': async () => {
			const card = openerCard();
			const seedBtn = card.locator('button:has-text("Seed Results")');
			if (await seedBtn.count()) {
				await seedBtn.click();
				await page.waitForTimeout(5000);
				seeded = true;
			} else {
				console.log('Season Opener already seeded — reviewing existing results.');
			}
		},
		'show-standings': async () => {
			await openerCard().scrollIntoViewIfNeeded().catch(() => {});
		},
		'expand-opener': async () => {
			const card = openerCard();
			const toggle = card.locator('button').last();
			await toggle.scrollIntoViewIfNeeded().catch(() => {});
			await toggle.click().catch(() => {});
			await page.waitForTimeout(1500);
		},
		'show-pro-rows': async () => {
			await page.mouse.wheel(0, 420);
		},
		'show-pool-math': async () => {
			// The Math Check strip sits at the top of the expanded detail.
			const card = openerCard();
			await card.locator('text=Math Check').first().scrollIntoViewIfNeeded().catch(() => {});
		},
		'show-links': async () => {
			await page.mouse.wheel(0, 500);
		},
		'show-reconcile': async () => {
			const card = openerCard();
			await card.locator('text=Math Check').first().scrollIntoViewIfNeeded().catch(() => {});
		},
		'show-final': async () => {
			await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
		}
	};

	await login(page);

	const lastBeat = beatsFile.beats[beatsFile.beats.length - 1];
	for (let i = 0; i < beatsFile.beats.length; i++) {
		const scheduled = beatsFile.beats[i].t;
		await waitUntil(Math.max(0, scheduled - 0.35));
		const actionName = script.beats[i]?.action;
		if (actionName && actions[actionName]) await actions[actionName]();
	}

	const lastClip = narration.clips[narration.clips.length - 1];
	const endAt = lastClip ? lastClip.t + lastClip.duration + FINAL_HOLD + 1.0 : lastBeat.t + 3.5 + FINAL_HOLD;
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

	console.log('Recorded:', finalVideo, '| seeded:', seeded);
}

run().catch((e) => {
	console.error('Recording failed:', e.message);
	process.exit(1);
});
