// Record the "Talent Tournaments Overview" walkthrough.
//
// Read-only: it never modifies data. The Create Tournament form is opened and
// cancelled without saving. The editable source is
// walkthroughs/talent-tournaments/script.md; narrate.mjs turns it into a beat
// schedule (beats.json) with measured narration durations. This recorder
// follows that schedule.
//
// Usage:
//   pnpm run dev                 # start the app first (separate terminal)
//   node scripts/walkthroughs/narrate.mjs talent-tournaments
//   node scripts/walkthroughs/record-talent-tournaments.mjs
//
// Credentials come from DEMO_USER / DEMO_PASSWORD (git-ignored .env).

import { mkdir, readFile, rename, copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { WALKTHROUGH } from './config.mjs';
import { loadScriptSource } from './script-source.mjs';

const NAME = 'talent-tournaments';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(WALKTHROUGH.dir.output, NAME);
await mkdir(outDir, { recursive: true });

const script = await loadScriptSource(repoRoot, NAME);
const beatsFile = JSON.parse(await readFile(path.join(outDir, `${NAME}.beats.json`), 'utf8'));
const narration = JSON.parse(await readFile(path.join(outDir, `${NAME}.narration.json`), 'utf8'));

const FINAL_HOLD = 3.0;

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
	// The login button has hover animations that can block the stability check;
	// dispatch the click directly and wait for navigation.
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

	// Capture browser errors for diagnosis. Values are sanitized; never log
	// credentials or auth state.
	page.on('pageerror', (e) => console.log('[pageerror]', String(e.message || e).slice(0, 300)));
	page.on('console', (m) => {
		if (m.type() === 'error') console.log('[console.error]', m.text().slice(0, 300));
	});
	page.on('requestfailed', (r) => console.log('[requestfailed]', r.url(), r.failure()?.errorText));

	const startedAt = Date.now();
	const t0 = () => (Date.now() - startedAt) / 1000;
	const waitUntil = async (t) => {
		const ms = (t - t0()) * 1000;
		if (ms > 0) await page.waitForTimeout(ms);
	};

	const actions = {
		// Beat 1 — navigate via the sidebar (Talent > Tournaments).
		'open-tournaments': async () => {
			await page.goto(`${WALKTHROUGH.baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
			await page.waitForTimeout(800);
			const link = page.locator('a[href="/dashboard/talent/tournaments"]').first();
			if (await link.count()) {
				await link.click();
			} else {
				await page.goto(`${WALKTHROUGH.baseUrl}/dashboard/talent/tournaments`, { waitUntil: 'domcontentloaded' });
			}
			await page.locator('h1:has-text("Tournaments")').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
			await page.waitForLoadState('networkidle').catch(() => {});
		},
		// Beat 2 — overview: banner + season budget summary.
		'show-overview': async () => {
			await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
		},
		// Beat 3 — filters row.
		'show-filters': async () => {
			const filters = page.locator('text=Status').first();
			if (await filters.count()) await filters.scrollIntoViewIfNeeded().catch(() => {});
		},
		// Beat 4 — the tournament list.
		'show-list': async () => {
			const first = page.locator('h3:has-text("FLI Golf Season Opener")').first();
			if (await first.count()) await first.scrollIntoViewIfNeeded().catch(() => {});
			await page.mouse.wheel(0, 300);
		},
		// Beat 5 — open the first tournament's detail page.
		'open-detail': async () => {
			const view = page.locator('a[href*="/dashboard/talent/tournaments/"]').filter({ hasText: 'View' }).first();
			if (await view.count()) {
				await view.click();
				await page.waitForLoadState('domcontentloaded').catch(() => {});
			}
			await page.waitForLoadState('networkidle').catch(() => {});
			await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
		},
		// Beat 6 — scroll the detail page to related-record sections.
		'show-relationships': async () => {
			const rel = page.locator('text=Results by Franchise').first();
			if (await rel.count()) await rel.scrollIntoViewIfNeeded().catch(() => {});
			await page.mouse.wheel(0, 400);
		},
		// Beat 7 — back to list, open the Create Tournament form.
		'open-create-form': async () => {
			await page.goto(`${WALKTHROUGH.baseUrl}/dashboard/talent/tournaments`, { waitUntil: 'domcontentloaded' });
			await page.waitForLoadState('networkidle').catch(() => {});
			await page.locator('button:has-text("Create Tournament")').first().click();
			await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 10000 });
		},
		// Beat 8 — cancel without saving.
		'cancel-form': async () => {
			const cancel = page.locator('button:has-text("Cancel")').first();
			if (await cancel.count()) await cancel.click();
			await page.waitForTimeout(800);
		},
		// Beat 9 — settle back on the list.
		'show-final': async () => {
			await page.locator('h1:has-text("Tournaments")').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
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

	console.log('Recorded:', finalVideo, '| beats:', beatsFile.beats.length);
}

run().catch((e) => {
	console.error('Recording failed:', e.message);
	process.exit(1);
});
