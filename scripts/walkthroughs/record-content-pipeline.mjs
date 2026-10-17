import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { WALKTHROUGH } from './config.mjs';
import { loadScriptSource } from './script-source.mjs';

const NAME = 'content-pipeline';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(WALKTHROUGH.dir.output, NAME);
const base = new URL(WALKTHROUGH.baseUrl);
const inspect = process.argv.includes('--inspect');
const stages = ['Brief', 'Shoot', 'Edit', 'Approval', 'Published', 'Paid'];
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
		throw new Error('Generate narration first: node scripts/walkthroughs/narrate.mjs content-pipeline');
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
		const center = async locator => {
			await locator.waitFor({ state: 'visible' });
			await locator.evaluate(element => element.scrollIntoView({ block: 'center' }));
		};
		const contentLink = () => page.locator('a[href="/dashboard/content"]').first();
		const column = label => page.locator('div.flex-shrink-0.w-52').filter({
			has: page.locator('span.uppercase').filter({ hasText: new RegExp(`^${label}$`) })
		});
		const board = () => column('Brief').locator('..');
		const panel = () => page.locator('div.w-72.shrink-0');
		const summary = label => page.locator('p.uppercase').filter({ hasText: new RegExp(`^${label}$`) });
		const readCount = async locator => {
			const value = (await locator.innerText()).trim();
			if (!/^\d+$/.test(value)) throw new Error('A displayed count is unavailable.');
			return Number(value);
		};
		const captureDetail = async () => {
			const detail = panel();
			await detail.waitFor();
			const fields = {};
			for (const label of ['Department:', 'Project:', 'Budget:', 'Actual:', 'Due:']) {
				fields[label] = await detail.getByText(label, { exact: false }).count() > 0;
			}
			return {
				fields,
				publishedLink: await detail.locator('a[target="_blank"]').count() > 0,
				linkedTaskCount: await detail.locator('div.rounded-md').count(),
				noLinkedTasks: await detail.getByText('No tasks linked yet.', { exact: true }).count() > 0,
				approve: await detail.getByRole('button', { name: 'Approve', exact: true }).count() > 0,
				reject: await detail.getByRole('button', { name: 'Reject', exact: true }).count() > 0,
				attachmentInputs: await detail.locator('input[type="file"]').count()
			};
		};
		const actions = {
			'show-navigation': async () => {
				await page.goto(`${base.origin}/dashboard/manage-media-content`, { waitUntil: 'networkidle', timeout: 120000 });
				await center(contentLink());
				await contentLink().hover();
				observations.navigationLabel = (await contentLink().innerText()).replace(/\d+/g, '').trim();
			},
			'show-summary': async () => {
				await contentLink().click();
				await page.getByRole('heading', { name: 'Content Pipeline', exact: true }).waitFor();
				await page.waitForLoadState('networkidle');
				observations.counts = {};
				for (const label of ['Total', ...stages]) {
					observations.counts[label] = await readCount(summary(label).locator('..').locator('p').last());
				}
				observations.filterInputs = await page.locator('select,input:not([type="hidden"])').count();
				await center(summary('Total'));
			},
			'show-approval-indicator': async () => {
				const banner = page.locator('div.text-yellow-300.text-sm').filter({ hasText: /waiting for approval/ }).first();
				observations.approvalWaiting = await banner.count()
					? Number((await banner.innerText()).trim().match(/^\d+/)[0]) : 0;
				if (!observations.approvalWaiting) throw new Error('No approval-waiting indicator available for this script.');
				await center(banner);
			},
			'show-board-start': async () => {
				await board().evaluate(element => { element.scrollLeft = 0; });
				await column('Brief').locator('span.uppercase').first().evaluate(element => {
					element.scrollIntoView({ block: 'start' });
					window.scrollBy(0, -100);
				});
				observations.columnCounts = {};
				for (const label of stages) {
					observations.columnCounts[label] = await readCount(column(label).locator('span.font-bold').first());
					if (observations.columnCounts[label] !== observations.counts[label]) throw new Error('Summary and column counts differ.');
				}
				observations.cards = await board().locator('[draggable="true"]').count();
				if (!observations.cards) throw new Error('No existing content cards available.');
			},
			'show-board-end': async () => {
				await board().evaluate(element => { element.scrollLeft = element.scrollWidth; });
				await column('Paid').locator('span.uppercase').first().evaluate(element => {
					element.scrollIntoView({ block: 'start' });
					window.scrollBy(0, -100);
				});
			},
			'show-detail': async () => {
				const card = board().locator('[draggable="true"]').first().locator('div.block');
				await card.click();
				await center(panel());
				observations.firstDetail = await captureDetail();
			},
			'show-review-detail': async () => {
				await panel().getByRole('button', { name: '×', exact: true }).click();
				const card = column('Approval').locator('[draggable="true"]').filter({ hasText: 'Needs Approval' }).first().locator('div.block');
				await card.click();
				await center(panel());
				observations.approvalDetail = await captureDetail();
				if (!observations.approvalDetail.approve || !observations.approvalDetail.reject) throw new Error('Review controls unavailable.');
			},
			'show-published-detail': async () => {
				await panel().getByRole('button', { name: '×', exact: true }).click();
				const card = column('Published').locator('[draggable="true"]').first().locator('div.block');
				await card.click();
				await center(panel());
				observations.publishedDetail = await captureDetail();
				const detail = observations.publishedDetail;
				if (detail.publishedLink || detail.fields['Actual:'] ||
					!detail.fields['Budget:'] || !detail.fields['Due:']) {
					throw new Error('Published detail differs from narration; inspect and update the script.');
				}
			},
			'show-form-top': async () => {
				await panel().getByRole('button', { name: '×', exact: true }).click();
				await page.getByRole('button', { name: 'New Content', exact: true }).click();
				const dialog = page.getByRole('dialog');
				await dialog.waitFor();
				await dialog.locator('#content-title').evaluate(element => element.scrollIntoView({ block: 'center' }));
				observations.newForm = {
					titleRequired: await dialog.locator('#content-title').evaluate(element => element.required),
					departmentRequired: await dialog.locator('#content-department').evaluate(element => element.required),
					attachmentInputs: await dialog.locator('input[type="file"]').count(),
					fields: await dialog.locator('input[id],select[id],textarea[id]').evaluateAll(elements => elements.map(element => element.id)),
					submitted: false
				};
			},
			'show-form-bottom': async () => {
				await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).scrollIntoViewIfNeeded();
			},
			finish: async () => {
				await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
				await board().evaluate(element => { element.scrollLeft = 0; });
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
			blockedMutations: blocked, pageErrors, observations
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
