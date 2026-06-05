import path from 'path';
import dotenv from 'dotenv';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const execFileAsync = promisify(execFile);

async function requestJson(url: string, options: RequestInit = {}) {
	const response = await fetch(url, options);
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(`${response.status} ${JSON.stringify(payload)}`);
	}
	return payload;
}

async function runStep(label: string, args: string[]) {
	const { stdout, stderr } = await execFileAsync('npx', args, {
		cwd: process.cwd(),
		env: process.env,
		timeout: 180000,
		maxBuffer: 1024 * 1024
	});

	console.log(`\n=== ${label} ===`);
	if (stdout.trim()) console.log(stdout.trim());
	if (stderr.trim()) console.error(stderr.trim());
}

async function verifyPhase6(baseUrl: string, token: string) {
	const collections = [
		'media_marketplace_listings',
		'media_purchase_requests',
		'media_download_audits',
		'media_dashboard_snapshots'
	];

	const counts: Record<string, number> = {};
	for (const collection of collections) {
		const rows = await requestJson(`${baseUrl}/api/collections/${collection}/records?page=1&perPage=1`, {
			headers: { Authorization: token }
		});
		counts[collection] = Number(rows.totalItems || 0);
	}

	return counts;
}

async function main() {
	const baseUrl = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';

	if (!email || !password) {
		throw new Error('Missing PocketBase admin credentials in .env');
	}

	await runStep('Apply Module 8-10 schema', ['tsx', 'scripts/update-media-assets-phase6.ts']);
	await runStep('Seed Module 8-10 data', ['tsx', 'scripts/seed-media-assets-phase6.ts']);

	const auth = await requestJson(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identity: email, password })
	});

	const counts = await verifyPhase6(baseUrl, auth.token as string);
	console.log('\n=== Module 8-10 verification ===');
	console.log(JSON.stringify(counts, null, 2));
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});
