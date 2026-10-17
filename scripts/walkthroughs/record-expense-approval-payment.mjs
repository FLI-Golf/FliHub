// Record the "Expense Approval and Payment Pipeline" walkthrough.
//
// The editable source is walkthroughs/expense-approval-payment/script.md;
// narrate.mjs turns it into a beat schedule (beats.json) with measured
// narration durations. This recorder follows that schedule, driving the real
// UI: Expenses → Approvals → Work Orders.
//
// Authorized demo: creates one "DEMO — Expense Pipeline" expense, approves it,
// and records a simulated payment (reference DEMO-CHECK-001) through the normal
// UI. No external QuickBooks sync or messages. No records are deleted or
// overwritten. If the demo expense already exists, creation is skipped and the
// existing record is used.
//
// Usage:
//   pnpm run dev                 # start the app first (separate terminal)
//   node scripts/walkthroughs/narrate.mjs expense-approval-payment
//   node scripts/walkthroughs/record-expense-approval-payment.mjs
//
// Credentials come from DEMO_USER / DEMO_PASSWORD (git-ignored .env).

import { mkdir, readFile, rename, copyFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { WALKTHROUGH } from './config.mjs';
import { loadScriptSource } from './script-source.mjs';

const NAME = 'expense-approval-payment';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(WALKTHROUGH.dir.output, NAME);
await mkdir(outDir, { recursive: true });

const script = await loadScriptSource(repoRoot, NAME);
const beatsFile = JSON.parse(await readFile(path.join(outDir, `${NAME}.beats.json`), 'utf8'));
const narration = JSON.parse(await readFile(path.join(outDir, `${NAME}.narration.json`), 'utf8'));

const FINAL_HOLD = 3.0;

const EXPENSE = {
	description: 'DEMO — Expense Pipeline',
	amount: '250',
	category: 'Marketing',
	date: '2026-10-17'
};
const BANK_ACCOUNT_LABEL = 'Event Operations Account';
const PAYMENT_REF = 'DEMO-CHECK-001';

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

	const startedAt = Date.now();
	const t0 = () => (Date.now() - startedAt) / 1000;
	const waitUntil = async (t) => {
		const ms = (t - t0()) * 1000;
		if (ms > 0) await page.waitForTimeout(ms);
	};

	let created = false;
	let approved = false;
	let paid = false;

	// Approvals are grouped under collapsible headers (e.g. "Other 1 pending").
	// The card title falls back to a generic label, so match the auto-created
	// comment text instead, expanding collapsed groups until it appears.
	const APPROVAL_MARKER = 'Expense submitted for approval.';
	async function expandDemoGroup() {
		if (await page.locator(`text=${APPROVAL_MARKER}`).count() > 0) return;
		const toggles = page.locator('button:has-text("▼")');
		const n = await toggles.count();
		for (let i = 0; i < n; i++) {
			await toggles.nth(i).click().catch(() => {});
			await page.waitForTimeout(300);
			if (await page.locator(`text=${APPROVAL_MARKER}`).count() > 0) break;
		}
	}

	const actions = {
		'open-expenses': async () => {
			await page.goto(`${WALKTHROUGH.baseUrl}/dashboard/expenses`, { waitUntil: 'domcontentloaded' });
			await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
			await page.waitForLoadState('networkidle').catch(() => {});
		},
		'open-form': async () => {
			// Guard: reuse an existing demo expense instead of creating a duplicate.
			const existing = await page.locator(`text=${EXPENSE.description}`).count();
			if (existing > 0) {
				console.log(`"${EXPENSE.description}" already exists — will reuse it.`);
				return;
			}
			await page.locator('button:has-text("Add Expense")').first().click();
			await page.locator('#edit-description').waitFor({ state: 'visible', timeout: 10000 });
		},
		'fill-core': async () => {
			if (await page.locator('#edit-description').count() === 0) return;
			await page.fill('#edit-description', EXPENSE.description);
			await page.fill('#edit-amount', EXPENSE.amount);
			await page.fill('#edit-date', EXPENSE.date);
		},
		'fill-submit': async () => {
			if (await page.locator('#edit-description').count() === 0) return;
			await page.selectOption('#edit-category', EXPENSE.category);
			// Setting status to Submitted auto-creates the approval request.
			await page.selectOption('#edit-status', 'submitted');
		},
		'save-expense': async () => {
			if (await page.locator('#edit-description').count() === 0) return;
			await page.locator('button[type="submit"]:has-text("Add Expense")').click();
			// The app reloads after a successful create.
			await page.waitForLoadState('domcontentloaded').catch(() => {});
			await page.waitForTimeout(2500);
			created = true;
		},
		'show-approval': async () => {
			await page.goto(`${WALKTHROUGH.baseUrl}/dashboard/approvals`, { waitUntil: 'domcontentloaded' });
			await page.waitForLoadState('networkidle').catch(() => {});
			await expandDemoGroup();
			const card = page.locator(`text=${APPROVAL_MARKER}`).first();
			if (await card.count()) await card.scrollIntoViewIfNeeded().catch(() => {});
		},
		'approve': async () => {
			await expandDemoGroup();
			const card = page.locator(`text=${APPROVAL_MARKER}`).first();
			if (!(await card.count())) { console.warn('Demo expense approval card not found'); return; }
			const container = card.locator('xpath=ancestor::div[contains(@class,"p-5")]').first();
			const btn = container.locator('button:has-text("Approve")').first();
			if (await btn.count()) {
				await btn.click();
				await page.waitForTimeout(3000);
				approved = true;
			}
		},
		'show-work-order': async () => {
			await page.goto(`${WALKTHROUGH.baseUrl}/dashboard/work-orders`, { waitUntil: 'domcontentloaded' });
			await page.waitForLoadState('networkidle').catch(() => {});
			const row = page.locator(`text=${EXPENSE.description}`).first();
			if (await row.count()) await row.scrollIntoViewIfNeeded().catch(() => {});
		},
		'record-payment': async () => {
			const row = page.locator(`text=${EXPENSE.description}`).first();
			if (!(await row.count())) { console.warn('Demo work order row not found'); return; }
			const container = row.locator('xpath=ancestor::tr').first();
			const recordBtn = container.locator('button:has-text("Record in QB")').first();
			if (!(await recordBtn.count())) { console.warn('Record in QB button not found (may already be paid)'); return; }
			await recordBtn.click();
			await page.waitForTimeout(800);

			// The QB panel is the expanded row; scope to it.
			const panel = page.locator('tr.bg-blue-950\\/20').first();
			// Select the Event Operations Account (unlocks the payout fields).
			const accountSelect = panel.locator('select').first();
			const optionValue = await accountSelect.locator('option', { hasText: 'Event Operations' }).first().getAttribute('value').catch(() => null);
			if (optionValue) await accountSelect.selectOption(optionValue);
			await page.waitForTimeout(500);
			// Fictional reference; fields unlock once the account is selected.
			await panel.locator('input[placeholder*="Auto-generated"]').first().fill(PAYMENT_REF);
			await panel.locator('button:has-text("Generate Payment")').first().click();
			await page.waitForTimeout(3000);
			paid = true;
		},
		'verify-final': async () => {
			await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
			await page.waitForLoadState('networkidle').catch(() => {});
			const row = page.locator(`text=${EXPENSE.description}`).first();
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

	console.log('Recorded:', finalVideo, '| created:', created, '| approved:', approved, '| paid:', paid);
}

run().catch((e) => {
	console.error('Recording failed:', e.message);
	process.exit(1);
});
