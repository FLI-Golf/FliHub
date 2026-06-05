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

async function main() {
	const baseUrl = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';

	if (!email || !password) {
		throw new Error('Missing PocketBase admin credentials in .env');
	}

	const auth = await requestJson(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identity: email, password })
	});
	const token = auth.token as string;

	const assets = await requestJson(`${baseUrl}/api/collections/media_assets/records?page=1&perPage=1`, {
		headers: { Authorization: token }
	});

	if (!assets.items || assets.items.length === 0) {
		console.log('No media assets found; cannot queue one-shot job.');
		return;
	}

	const asset = assets.items[0];
	const queued = await requestJson(`${baseUrl}/api/collections/media_ai_jobs/records`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: token
		},
		body: JSON.stringify({
			asset: asset.id,
			job_type: 'metadata_suggestion',
			status: 'queued',
			provider: 'one-shot',
			model_name: 'one-shot'
		})
	});

	console.log(`Queued job ${queued.id} for asset ${asset.id}.`);

	const { stdout, stderr } = await execFileAsync('npx', ['tsx', 'scripts/process-media-ai-jobs.ts'], {
		cwd: process.cwd(),
		env: process.env,
		timeout: 120000,
		maxBuffer: 1024 * 1024
	});

	if (stdout.trim()) console.log(stdout.trim());
	if (stderr.trim()) console.error(stderr.trim());

	const verify = await requestJson(`${baseUrl}/api/collections/media_ai_jobs/records/${queued.id}`, {
		headers: { Authorization: token }
	});

	const summary = await requestJson(
		`${baseUrl}/api/collections/media_ai_summaries/records?page=1&perPage=10&filter=${encodeURIComponent(`job = "${queued.id}"`)}`,
		{ headers: { Authorization: token } }
	);

	console.log(
		JSON.stringify(
			{
				jobId: queued.id,
				status: verify.status,
				summariesCreated: summary.totalItems || 0,
				completedAt: verify.completed_at || null
			},
			null,
			2
		)
	);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});
