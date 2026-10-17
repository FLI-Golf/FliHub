import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { WALKTHROUGH } from './config.mjs';
import { loadScriptSource } from './script-source.mjs';

const NAME = 'active-goals';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(WALKTHROUGH.dir.output, NAME);
const base = new URL(WALKTHROUGH.baseUrl);
const inspect = process.argv.includes('--inspect');
if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname) || base.port !== '5173') {
	throw new Error('Use the local development app on port 5173.');
}
if (!inspect && !process.argv.includes('--demo-data-confirmed')) {
	throw new Error('Confirm all visible data is synthetic with --demo-data-confirmed.');
}
for (const [name, value] of [['DEMO_USER', WALKTHROUGH.loginEmail], ['DEMO_PASSWORD', WALKTHROUGH.loginPassword]]) {
	if (!value) throw new Error(`Missing variable: ${name} (or shared walkthrough login override).`);
}

async function run() {
	await mkdir(outDir, { recursive: true });
	const source = await loadScriptSource(root, NAME);
	const narrationPath = path.join(outDir, `${NAME}.narration.json`);
	const narration = inspect ? { clips: [] } : JSON.parse(await readFile(narrationPath, 'utf8'));
	if (!inspect && (narration.clips.length !== source.beats.length ||
		narration.clips.some((clip, i) => clip.text !== source.beats[i].caption))) {
		throw new Error('Generate narration first: node scripts/walkthroughs/narrate.mjs active-goals');
	}
	const browser = await chromium.launch({
		executablePath: WALKTHROUGH.chromiumPath, headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
	});
	let context;
	let videoPath;
	let complete = false;
	let phase = 'login';
	let blocked = 0;
	let pageErrors = 0;
	let loginAllowed = true;
	const observations = { environment: 'local development', demoDataConfirmed: !inspect, actions: [] };
	const guard = async route => {
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
		loginAllowed = false;
		phase = 'inspection';
		context = await browser.newContext({
			viewport: WALKTHROUGH.viewport, serviceWorkers: 'block', storageState: state,
			...(!inspect ? { recordVideo: { dir: outDir, size: WALKTHROUGH.viewport } } : {})
		});
		await context.route('**/*', guard);
		await context.addInitScript(({ email, password }) => {
			const redact = () => {
				if (!document.documentElement) return;
				const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
				let node;
				while ((node = walker.nextNode())) {
					if (['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)) continue;
					let text = node.nodeValue;
					for (const secret of [email, password]) if (secret) text = text.split(secret).join('[demo account]');
					text = text.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[demo contact]');
					if (text !== node.nodeValue) node.nodeValue = text;
				}
			};
			new MutationObserver(redact).observe(document, { childList: true, subtree: true, characterData: true });
		}, { email: WALKTHROUGH.loginEmail, password: WALKTHROUGH.loginPassword });
		page = await context.newPage();
		const video = page.video();
		if (video) videoPath = await video.path();
		page.on('pageerror', () => pageErrors++);
		const started = Date.now();
		const visible = async text => page.getByText(text, { exact: true }).first().isVisible();
		const center = async locator => {
			await locator.waitFor({ state: 'visible' });
			await locator.evaluate(element => element.scrollIntoView({ block: 'center' }));
		};
		const activeLink = () => page.locator('a[href="/dashboard/active-goals"]').filter({ hasText: 'Active Goals' }).first();
		let goalHref;
		const actions = {
			'show-navigation': async () => {
				// Start on a goal-only surface, not a potentially financial dashboard.
				await page.goto(`${base.origin}/dashboard/marketing-goals`, { waitUntil: 'networkidle', timeout: 120000 });
				await page.getByRole('heading', { name: 'Marketing Goals', exact: true }).waitFor();
				await center(activeLink());
				await activeLink().hover();
				observations.sidebarNavigation = true;
			},
			'open-active-goals': async () => {
				await activeLink().click();
				await page.getByRole('heading', { name: 'Active Goals', exact: true }).waitFor();
				await page.waitForLoadState('networkidle');
				await page.getByRole('button', { name: 'What is this page?', exact: true }).click();
				await page.getByText('How to run this in standup', { exact: true }).waitFor();
				observations.helpExpanded = await visible('How to run this in standup');
				observations.activeGoalCards = await page.getByRole('link', { name: 'View', exact: true }).count();
				if (!observations.activeGoalCards) throw new Error('No existing active goals available.');
				observations.activeViewFilterControls = await page.locator('select,input:not([type="hidden"])').count();
			},
			'show-summary': async () => {
				await page.getByRole('button', { name: /How to run this in standup/ }).click();
				await center(page.getByText('Open Tasks', { exact: true }).first());
				observations.summaryLabels = {};
				for (const label of ['Active Goals', 'Open Tasks', 'Needs Approval', 'Approved Spend']) {
					observations.summaryLabels[label] = await visible(label);
				}
			},
			'show-goal-card': async () => {
				const view = page.getByRole('link', { name: 'View', exact: true }).first();
				goalHref = await view.getAttribute('href');
				await center(view);
				observations.reportControl = await page.getByRole('button', { name: 'Report PDF', exact: true }).first().isVisible();
				await page.mouse.wheel(0, 200);
			},
			'show-task-list': async () => {
				const toggle = page.getByRole('button', { name: /^Task list \(/ }).first();
				await center(toggle);
				await toggle.click();
				await page.mouse.wheel(0, 200);
				observations.expenseControls = await page.getByRole('button', { name: /^(Log Expense|Set Cost First)$/ }).count();
			},
			'open-goal': async () => {
				await page.locator(`a[href="${goalHref}"]`).filter({ hasText: 'View' }).first().click();
				await page.locator('button[type="submit"]').filter({ hasText: 'Update Goal' }).waitFor();
				await page.waitForLoadState('networkidle');
				await page.evaluate(() => window.scrollTo(0, 0));
				observations.goalDetail = true;
				observations.updateGoalControl = await page.getByRole('button', { name: 'Update Goal', exact: true }).isVisible();
			},
			'show-task-detail': async () => {
				const tasks = page.locator('button').filter({ has: page.locator('span.flex-1.truncate') });
				await center(page.getByRole('heading', { name: 'Tasks', exact: true }));
				observations.detailTaskCount = await tasks.count();
				observations.hasTasks = observations.detailTaskCount > 0;
				if (!observations.hasTasks) throw new Error('No existing tasks available for this walkthrough.');
				await tasks.first().click();
				await page.getByText('Move to:', { exact: true }).waitFor();
				await center(tasks.first());
				await page.mouse.wheel(0, 200);
				observations.linkedRecordsVisible = await visible('Linked Records');
				observations.linkedExpenseVisible = await visible('Expense:');
				observations.linkedWorkOrderVisible = await visible('Work Order:');
				observations.linkedApprovalVisible = await visible('Approval:');
				observations.taskDeleteControl = await page.getByRole('button', { name: 'Delete', exact: true }).isVisible();
			},
			'show-task-form': async () => {
				await page.getByRole('button', { name: 'Add Task', exact: true }).click();
				await page.getByRole('dialog').waitFor();
				observations.blankTaskForm = true;
			},
			'show-all-goals': async () => {
				await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
				await page.getByRole('link', { name: 'Back to Goals', exact: true }).click();
				await page.getByRole('heading', { name: 'Marketing Goals', exact: true }).waitFor();
				await page.evaluate(() => window.scrollTo(0, 0));
				observations.allGoalsNavigation = true;
			},
			finish: async () => {
				await activeLink().click();
				await page.getByRole('heading', { name: 'Active Goals', exact: true }).waitFor();
				await page.evaluate(() => window.scrollTo(0, 0));
			}
		};
		const beats = [];
		const clips = [];
		for (let i = 0; i < source.beats.length; i++) {
			const beat = source.beats[i];
			phase = beat.action;
			if (!actions[beat.action]) throw new Error('Unknown walkthrough action.');
			await actions[beat.action]();
			const elapsed = (Date.now() - started) / 1000;
			if (!inspect && beat.at > elapsed) await page.waitForTimeout((beat.at - elapsed) * 1000);
			const t = Number(((Date.now() - started) / 1000).toFixed(2));
			beats.push({ t, caption: beat.caption });
			observations.actions.push(beat.action);
			if (!inspect) {
				const clip = narration.clips[i];
				clips.push({ ...clip, t });
				await page.waitForTimeout((clip.duration + (beat.pause ?? 1.2)) * 1000);
			}
			if (blocked) throw new Error('A mutation was attempted and blocked.');
		}
		if (!inspect) await page.waitForTimeout(3000);
		observations.blockedMutations = blocked;
		observations.pageErrors = pageErrors;
		await context.close();
		context = null;
		if (!inspect) {
			await rename(videoPath, path.join(outDir, `${NAME}.webm`));
			videoPath = path.join(outDir, `${NAME}.webm`);
			await writeFile(path.join(outDir, `${NAME}.beats.json`), JSON.stringify({ name: NAME, viewport: WALKTHROUGH.viewport, beats }, null, 2));
			await writeFile(narrationPath, JSON.stringify({ ...narration, clips }, null, 2));
			await writeFile(path.join(outDir, `${NAME}.observations.json`), JSON.stringify(observations, null, 2));
		}
		complete = true;
		console.log(JSON.stringify(observations, null, 2));
	} catch (error) {
		console.error('Failure diagnostic:', JSON.stringify({
			phase, timeout: error?.name === 'TimeoutError', browserConnected: browser.isConnected(),
			blockedMutations: blocked, pageErrors
		}));
		throw new Error('Walkthrough failed; raw page/response details suppressed.');
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
