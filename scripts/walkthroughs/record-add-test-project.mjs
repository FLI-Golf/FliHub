// Record the "Add a Test Project" walkthrough.
//
// The editable source is walkthroughs/add-test-project/script.md; narrate.mjs
// turns it into a beat schedule (beats.json) with measured narration durations.
// This recorder follows that schedule, driving the Add Project form by its real
// field IDs. It creates one Test Project only if none exists, and never deletes
// or overwrites records.
//
// Usage:
//   pnpm run dev                 # start the app first (separate terminal)
//   node scripts/walkthroughs/narrate.mjs add-test-project
//   node scripts/walkthroughs/record-add-test-project.mjs
//
// Credentials come from DEMO_USER / DEMO_PASSWORD (git-ignored .env).

import { mkdir, readFile, rename, copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { WALKTHROUGH } from './config.mjs';
import { loadScriptSource } from './script-source.mjs';

const NAME = 'add-test-project';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(WALKTHROUGH.dir.output, NAME);
await mkdir(outDir, { recursive: true });

const script = await loadScriptSource(repoRoot, NAME);
const beatsFile = JSON.parse(await readFile(path.join(outDir, `${NAME}.beats.json`), 'utf8'));
const narration = JSON.parse(await readFile(path.join(outDir, `${NAME}.narration.json`), 'utf8'));

const FINAL_HOLD = 3.0;

// Form values, kept in one place so the demo stays consistent.
const PROJECT = {
	name: 'Test Project',
	departmentLabel: 'Executive',
	typeValue: 'activation',
	startDate: '2026-10-10',
	endDate: '2027-01-10',
	budget: '5000',
	forecasted: '4000',
	fiscalYear: '2027'
};

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

	const startedAt = Date.now();
	const t0 = () => (Date.now() - startedAt) / 1000;
	const waitUntil = async (t) => {
		const ms = (t - t0()) * 1000;
		if (ms > 0) await page.waitForTimeout(ms);
	};

	let created = false;

	const actions = {
		'open-projects': async () => {
			await page.goto(`${WALKTHROUGH.baseUrl}/dashboard/projects`, { waitUntil: 'domcontentloaded' });
			await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
			await page.waitForLoadState('networkidle').catch(() => {});
		},
		'open-form': async () => {
			// Guard: if a Test Project already exists, do not create another.
			const existing = await page.locator(`text=${PROJECT.name}`).count();
			if (existing > 0) {
				console.log(`"${PROJECT.name}" already exists — skipping creation.`);
				return;
			}
			await page.locator('button:has-text("Add Project")').first().click();
			await page.locator('#name').waitFor({ state: 'visible', timeout: 10000 });
		},
		'fill-identity': async () => {
			if (await page.locator('#name').count() === 0) return;
			await page.fill('#name', PROJECT.name);
			await page.selectOption('#department', { label: PROJECT.departmentLabel });
			await page.selectOption('#type', PROJECT.typeValue);
		},
		'fill-dates': async () => {
			if (await page.locator('#name').count() === 0) return;
			await page.fill('#startDate', PROJECT.startDate);
			await page.fill('#endDate', PROJECT.endDate);
		},
		'fill-budget': async () => {
			if (await page.locator('#name').count() === 0) return;
			await page.fill('#budget', PROJECT.budget);
			await page.fill('#forecastedExpenses', PROJECT.forecasted);
			await page.fill('#fiscalYear', PROJECT.fiscalYear);
		},
		'review-form': async () => {
			// Hold on the completed form so viewers can read every value.
			await page.locator('#fiscalYear').scrollIntoViewIfNeeded().catch(() => {});
		},
		'save-project': async () => {
			if (await page.locator('#name').count() === 0) return;
			await page.locator('button[type="submit"]:has-text("Create Project")').click();
			// The app reloads after a successful create.
			await page.waitForLoadState('domcontentloaded').catch(() => {});
			await page.waitForTimeout(2500);
			created = true;
		},
		'verify-saved': async () => {
			// Reload to prove persistence, then bring the saved project into view.
			await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
			await page.waitForLoadState('networkidle').catch(() => {});
			const row = page.locator(`text=${PROJECT.name}`).first();
			if (await row.count()) await row.scrollIntoViewIfNeeded().catch(() => {});
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
	// Add a buffer so the encoded video still holds a full FINAL_HOLD after the
	// last sentence, absorbing recorder/encoder clock drift.
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

	console.log('Recorded:', finalVideo, '| beats:', beatsFile.beats.length, '| created:', created);
}

run().catch((e) => {
	console.error('Recording failed:', e.message);
	process.exit(1);
});
