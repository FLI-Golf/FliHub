// Read-only walkthrough. Authentication precedes capture; state stays in memory.
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { WALKTHROUGH } from './config.mjs';
import { loadScriptSource } from './script-source.mjs';

const NAME = 'reimbursements';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(WALKTHROUGH.dir.output, NAME);
const base = new URL(WALKTHROUGH.baseUrl);
if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname) || base.port !== '5173') {
	throw new Error('Use the local development app on port 5173.');
}
if (!process.argv.includes('--demo-data-confirmed')) {
	throw new Error('Confirm all visible data is synthetic with --demo-data-confirmed before recording.');
}
for (const [name, value] of [['DEMO_USER', WALKTHROUGH.loginEmail], ['DEMO_PASSWORD', WALKTHROUGH.loginPassword]]) {
	if (!value) throw new Error(`Missing variable: ${name} (or shared walkthrough login override).`);
}

async function run() {
	await mkdir(outDir, { recursive: true });
	const source = await loadScriptSource(root, NAME);
	const narrationPath = path.join(outDir, `${NAME}.narration.json`);
	const schedule = JSON.parse(await readFile(path.join(outDir, `${NAME}.beats.json`), 'utf8'));
	const narration = JSON.parse(await readFile(narrationPath, 'utf8'));
	if (schedule.beats.length !== source.beats.length ||
		source.beats.some((beat, i) => beat.caption !== schedule.beats[i].caption) ||
		(narration.clips.length && (narration.clips.length !== source.beats.length ||
			narration.clips.some((clip, i) => clip.text !== source.beats[i].caption)))) {
		throw new Error('Source and generated narration differ; run narrate.mjs reimbursements first.');
	}
	const browser = await chromium.launch({
		executablePath: WALKTHROUGH.chromiumPath, headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
	});
	let context;
	let recordedVideo;
	let videoPath;
	let recordedPage;
	let complete = false;
	let phase = 'login';
	let blocked = 0;
	let pageErrors = 0;
	const observations = { environment: 'local development', demoDataConfirmed: true, actions: [] };
	let loginAllowed = true;
	const guard = async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		if (['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return route.continue();
		if (loginAllowed && request.method() === 'POST' && url.origin === base.origin && url.pathname === '/auth/login') {
			loginAllowed = false;
			return route.continue();
		}
		blocked++;
		await route.abort('blockedbyclient');
	};
	try {
		context = await browser.newContext({ viewport: WALKTHROUGH.viewport, serviceWorkers: 'block' });
		await context.route('**/*', guard);
		let page = await context.newPage();
		await page.goto(`${base.origin}/auth/login`, { waitUntil: 'networkidle', timeout: 120000 });
		await page.locator('input[name="email"]').fill(WALKTHROUGH.loginEmail);
		await page.locator('input[name="password"]').fill(WALKTHROUGH.loginPassword);
		const responsePromise = page.waitForResponse(response =>
			response.request().method() === 'POST' && new URL(response.url()).pathname === '/auth/login',
		{ timeout: 120000 });
		await page.getByRole('button', { name: 'Login', exact: true }).click();
		const response = await responsePromise;
		const body = await response.text();
		observations.loginStatus = response.status();
		console.log('Login diagnostic:', JSON.stringify({
			status: response.status(),
			crossSitePostRejected: /Cross-site POST form submissions are forbidden/i.test(body),
			invalidCredentialsMessage: /Invalid email or password/i.test(body)
		}));
		await page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 60000 });
		const state = await context.storageState();
		await context.close();
		phase = 'recording';
		context = await browser.newContext({
			viewport: WALKTHROUGH.viewport, serviceWorkers: 'block', storageState: state,
			recordVideo: { dir: outDir, size: WALKTHROUGH.viewport }
		});
		await context.route('**/*', guard);
		await context.addInitScript(({ email, password }) => {
			const redact = () => {
				const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
				let node;
				while ((node = walker.nextNode())) {
					if (['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)) continue;
					let text = node.nodeValue;
					for (const secret of [email, password]) if (secret) text = text.split(secret).join('[demo account]');
					if (text !== node.nodeValue) node.nodeValue = text;
				}
			};
			new MutationObserver(redact).observe(document, { childList: true, subtree: true, characterData: true });
		}, { email: WALKTHROUGH.loginEmail, password: WALKTHROUGH.loginPassword });
		page = await context.newPage();
		recordedPage = page;
		recordedVideo = page.video();
		videoPath = await recordedVideo.path();
		page.on('pageerror', () => pageErrors++);
		const started = Date.now();
		const elapsed = () => (Date.now() - started) / 1000;
		const waitUntil = async (time) => {
			if (elapsed() < time) await page.waitForTimeout((time - elapsed()) * 1000);
		};
		const visible = async (text) => page.getByText(text, { exact: true }).first().isVisible();
		const expand = async (name) => {
			const button = page.getByRole('button', { name: new RegExp(name) });
			await button.scrollIntoViewIfNeeded();
			await button.click();
		};
		const actions = {
			'open-claimant': async () => {
				await page.goto(`${base.origin}/dashboard/reimbursements`, { waitUntil: 'networkidle', timeout: 120000 });
				await page.getByRole('heading', { name: 'Reimbursements', exact: true }).waitFor();
			},
			'show-summary': async () => {
				await page.getByText('Pending Review', { exact: true }).evaluate(element =>
					element.scrollIntoView({ block: 'center' }));
				observations.claimantSummaries = {};
				for (const label of ['Claim total cap', 'Pending Review', 'Approved (Unpaid)', 'Total Paid Out', 'Total Claims']) {
					observations.claimantSummaries[label] = await visible(label);
				}
			},
			'show-vault': async () => {
				await expand('Bank Statement Vault');
				await page.getByRole('button', { name: 'Upload PDF', exact: false }).evaluate(element =>
					element.scrollIntoView({ block: 'start' }));
			},
			'show-items': async () => {
				await expand('Find My Reimbursement Items');
				await page.getByRole('button', { name: /^WO#/ }).evaluate(element =>
					element.scrollIntoView({ block: 'start' }));
			},
			'show-claim': async () => {
				await expand('My Claims');
				const claim = page.locator('button').filter({ has: page.locator('p.truncate') }).filter({ hasText: /submitted/ }).first();
				await claim.scrollIntoViewIfNeeded();
				await claim.click();
				await page.locator('table').last().scrollIntoViewIfNeeded();
			},
			'show-new-claim': async () => {
				await page.getByRole('button', { name: 'New Claim', exact: false }).click();
				await page.getByRole('dialog').waitFor();
				observations.newClaimForm = { opened: true, enteredData: false, submitted: false };
			},
			'show-admin': async () => {
				await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
				await page.getByRole('link', { name: 'Admin View', exact: true }).click();
				await page.getByRole('heading', { name: 'Reimbursements — Admin', exact: true }).waitFor();
				await page.waitForLoadState('networkidle');
				observations.adminPanels = {
					duplicateAudit: await visible('Duplicate Audit'),
					businessPurposeReview: await visible('Business Purpose Review')
				};
			},
			'show-admin-detail': async () => {
				const row = page.locator('tbody tr').filter({ has: page.locator('td:nth-child(3) > button') }).first();
				await row.scrollIntoViewIfNeeded();
				await row.locator('td:nth-child(3) > button').click();
				await row.locator('xpath=following-sibling::tr[1]').getByText('Line Items', { exact: true }).evaluate(element =>
					element.scrollIntoView({ block: 'start' }));
				observations.reviewControls = {
					approve: await page.getByRole('button', { name: 'Approve', exact: true }).first().isVisible(),
					reject: await page.getByRole('button', { name: 'Reject', exact: true }).first().isVisible()
				};
			},
			'show-payment-filter': async () => {
				const filter = page.locator('select').filter({ has: page.locator('option[value="approved"]') }).first();
				await filter.scrollIntoViewIfNeeded();
				await filter.selectOption('approved');
				observations.approvedFilterEmpty = await visible('No claims match the current filters.');
				observations.paymentExecuted = false;
			},
			finish: async () => {
				await page.locator('select').filter({ has: page.locator('option[value="approved"]') }).first().selectOption('all');
				await page.getByRole('heading', { name: 'Reimbursements — Admin', exact: true }).scrollIntoViewIfNeeded();
			}
		};
		const beats = [];
		const clips = [];
		for (let i = 0; i < source.beats.length; i++) {
			const beat = source.beats[i];
			if (!actions[beat.action]) throw new Error('Unknown walkthrough action.');
			phase = beat.action;
			await actions[beat.action]();
			await waitUntil(beat.at ?? 0);
			const t = Number(elapsed().toFixed(2));
			beats.push({ t, caption: beat.caption });
			observations.actions.push(beat.action);
			const clip = narration.clips[i];
			if (clip) clips.push({ ...clip, t });
			await page.waitForTimeout(((clip?.duration ?? 5) + (beat.pause ?? 0.9)) * 1000);
			if (blocked) throw new Error('A non-login mutation was attempted and blocked.');
		}
		await page.waitForTimeout(3000);
		observations.blockedMutations = blocked;
		observations.pageErrors = pageErrors;
		await context.close();
		context = null;
		await rename(videoPath, path.join(outDir, `${NAME}.webm`));
		videoPath = path.join(outDir, `${NAME}.webm`);
		await writeFile(path.join(outDir, `${NAME}.beats.json`), JSON.stringify({ name: NAME, viewport: WALKTHROUGH.viewport, beats }, null, 2));
		await writeFile(narrationPath, JSON.stringify({ ...narration, clips }, null, 2));
		await writeFile(path.join(outDir, `${NAME}.observations.json`), JSON.stringify(observations, null, 2));
		complete = true;
		console.log(`Recorded ${NAME}: ${beats.length} beats; ${blocked} blocked mutations; ${pageErrors} page errors.`);
	} catch (error) {
		// Do not log raw Playwright errors: locators and responses can contain account data.
		console.error('Failure diagnostic:', JSON.stringify({
			timeout: error?.name === 'TimeoutError',
			browserConnected: browser.isConnected(),
			pageClosed: recordedPage?.isClosed() ?? true,
			blockedMutations: blocked,
			pageErrors
		}));
		throw new Error(`Walkthrough failed during ${phase}; raw details suppressed. Check the local server and demo access.`);
	} finally {
		try {
			if (context) await context.close();
		} finally {
			await browser.close();
			if (!complete && videoPath) await unlink(videoPath);
		}
	}
}

run().catch(error => {
	console.error(error.message);
	process.exitCode = 1;
});
