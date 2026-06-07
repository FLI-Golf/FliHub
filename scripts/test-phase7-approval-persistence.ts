import path from 'path';
import dotenv from 'dotenv';
import PocketBase from 'pocketbase';
import { GET, POST } from '../src/routes/api/media/phase7/+server';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PB_URL = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

function assert(condition: boolean, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

type MockLocals = {
	pb: {
		authStore: {
			isValid: boolean;
			model: { id: string };
		};
	};
};

async function authAdmin() {
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';
	assert(Boolean(email && password), 'Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD');
	await pb.collection('_superusers').authWithPassword(email, password);
}

async function findAllowedProfileUserId(): Promise<string> {
	const page = await pb.collection('user_profiles').getList(1, 200);
	const profiles = page.items as any[];

	const allowed = new Set(['admin', 'leader', 'marketing', 'marketing_lead']);
	const candidate = profiles.find((profile: any) => allowed.has(String(profile?.role || '').trim()));

	assert(Boolean(candidate), 'No user_profiles record found with an allowed Phase 7 role');
	const userId = String((candidate as any).userId || '').trim();
	assert(Boolean(userId), 'Allowed profile is missing userId');
	return userId;
}

async function createRegressionRows() {
	const assets = await pb.collection('media_assets').getList(1, 1);
	assert(assets.items.length > 0, 'Need at least one media_assets record for regression test');

	const asset = assets.items[0] as any;
	const marker = `phase7-regression-${Date.now()}`;

	const job = await pb.collection('media_ai_jobs').create({
		asset: asset.id,
		job_type: 'metadata_suggestion',
		status: 'completed',
		provider: marker,
		model_name: 'phase7-regression',
		result_json: {
			reviewStatus: 'pending',
			review_status: 'pending',
		},
	});

	const transcript = await pb.collection('media_ai_transcripts').create({
		title: `[TEST] ${marker}`,
		asset: asset.id,
		sourceAsset: asset.id,
		transcriptType: 'metadata_suggestion',
		status: 'pending',
		transcriptText: `Regression transcript for ${marker}`,
		transcript_text: `Regression transcript for ${marker}`,
		summary: `Regression summary for ${marker}`,
		tags: 'phase7,regression,test',
		language: 'en',
		requestCount: 1,
		createdBy: marker,
		job: job.id,
	});

	return {
		marker,
		jobId: job.id as string,
		transcriptId: transcript.id as string,
	};
}

async function cleanupRows(transcriptId: string, jobId: string) {
	await pb.collection('media_ai_transcripts').delete(transcriptId).catch(() => undefined);
	await pb.collection('media_ai_jobs').delete(jobId).catch(() => undefined);
}

async function invokeApprove(locals: MockLocals, transcriptId: string) {
	const req = new Request('http://localhost/api/media/phase7', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			action: 'approve',
			ids: [transcriptId],
			queueType: 'all',
			query: '',
			debug: true,
		}),
	});

	const response = await POST({ request: req, locals } as any);
	const payload = await response.json().catch(() => ({}));

	assert(response.ok, `POST /api/media/phase7 failed: ${response.status} ${JSON.stringify(payload)}`);
	assert(Number(payload?.updated ?? 0) >= 1, `Expected updated >= 1, got ${payload?.updated ?? 0}`);
}

async function waitForApprovedViaGet(locals: MockLocals, transcriptId: string): Promise<void> {
	for (let attempt = 0; attempt < 5; attempt++) {
		const url = new URL('http://localhost/api/media/phase7');
		url.searchParams.set('queueType', 'all');
		url.searchParams.set('limit', '25');

		const response = await GET({ locals, url } as any);
		const payload = await response.json().catch(() => ({}));
		assert(response.ok, `GET /api/media/phase7 failed: ${response.status} ${JSON.stringify(payload)}`);

		const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];
		const row = jobs.find((job: any) => String(job?.id) === transcriptId);
		if (row && String(row.status || '').toLowerCase() === 'approved') {
			return;
		}

		await sleep(300);
	}

	throw new Error('Approved status did not persist in GET /api/media/phase7 within retry window');
}

async function main() {
	console.log('Running Phase 7 approval persistence regression test...');
	await authAdmin();

	const userId = await findAllowedProfileUserId();
	const locals: MockLocals = {
		pb: {
			authStore: {
				isValid: true,
				model: { id: userId },
			},
		},
	};

	const { transcriptId, jobId } = await createRegressionRows();
	try {
		await invokeApprove(locals, transcriptId);
		await waitForApprovedViaGet(locals, transcriptId);
		console.log('PASS: Phase 7 approve persists and is returned as approved by GET queue.');
	} finally {
		await cleanupRows(transcriptId, jobId);
	}
}

main().catch((error) => {
	console.error('FAIL: Phase 7 approval regression test failed');
	console.error(error);
	process.exit(1);
});
