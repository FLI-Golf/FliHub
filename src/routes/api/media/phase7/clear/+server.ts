import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';

const TEST_JOB_PROVIDERS = new Set([
	'phase7-demo',
	'phase7_queue',
	'seed-engine',
	'smoke-rest',
	'process-endpoint-smoke',
	'one-shot',
]);

const TEST_TERMS = [
	'test',
	'seed',
	'smoke',
	'phase 7',
	'phase7',
	'phase7-demo',
	'phase7_queue',
	'one-shot',
	'process-endpoint-smoke',
	'seed-engine',
];

function normalize(value: unknown): string {
	return String(value ?? '').trim().toLowerCase();
}

function includesTestTerm(...values: unknown[]): boolean {
	const haystack = values.map((value) => normalize(value)).join(' ');
	if (!haystack) return false;
	return TEST_TERMS.some((term) => haystack.includes(term));
}

async function createAdminPb() {
	const baseUrl = env.POCKETBASE_URL || 'http://127.0.0.1:8090';
	const email = env.POCKETBASE_ADMIN_EMAIL || '';
	const password = env.POCKETBASE_ADMIN_PASSWORD || '';

	if (!email || !password) {
		throw new Error('Missing PocketBase admin credentials in environment');
	}

	const pb = new PocketBase(baseUrl);
	pb.autoCancellation(false);
	await pb.admins.authWithPassword(email, password);
	return pb;
}

async function listCollection(pb: any, collection: string) {
	try {
		return await pb.collection(collection).getFullList({ sort: '-created' });
	} catch {
		const fallback = await pb.send(`/api/collections/${collection}/records`, {
			method: 'GET',
			query: {
				page: 1,
				perPage: 200,
			},
		}) as { items?: any[] };
		return fallback?.items || [];
	}
}

async function deleteRows(pb: any, collection: string, rows: any[]) {
	let deleted = 0;
	for (const row of rows) {
		await pb.collection(collection).delete(row.id).catch(() => undefined);
		deleted += 1;
	}
	return deleted;
}

export const POST: RequestHandler = async ({ locals }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const role = ctx.profile?.role || '';
	if (!['admin', 'leader'].includes(role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	try {
		const pb = await createAdminPb();
		const [jobs, transcripts, summaries, detections] = await Promise.all([
			listCollection(pb, 'media_ai_jobs'),
			listCollection(pb, 'media_ai_transcripts'),
			listCollection(pb, 'media_ai_summaries'),
			listCollection(pb, 'media_ai_detections'),
		]);

		const jobCandidates = (jobs as any[]).filter((job: any) =>
			TEST_JOB_PROVIDERS.has(normalize(job.provider)) ||
			TEST_JOB_PROVIDERS.has(normalize(job.model_name)) ||
			includesTestTerm(job.provider, job.model_name, JSON.stringify(job.result_json || {}), job.error_message)
		);
		const jobIds = new Set(jobCandidates.map((row: any) => row.id));

		const transcriptCandidates = (transcripts as any[]).filter((row: any) =>
			jobIds.has(row.job) ||
			normalize(row.createdBy) === 'phase7-demo' ||
			includesTestTerm(row.title, row.summary, row.tags, row.reviewNotes, row.transcriptText, row.transcript_text)
		);
		const summaryCandidates = (summaries as any[]).filter((row: any) =>
			jobIds.has(row.job) ||
			includesTestTerm(row.summary_text, row.suggested_title, JSON.stringify(row.suggested_tags_json || []))
		);
		const detectionCandidates = (detections as any[]).filter((row: any) =>
			jobIds.has(row.job) || includesTestTerm(row.label, row.detection_type, JSON.stringify(row.metadata_json || {}))
		);

		const deleted = {
			media_ai_detections: await deleteRows(pb, 'media_ai_detections', detectionCandidates),
			media_ai_summaries: await deleteRows(pb, 'media_ai_summaries', summaryCandidates),
			media_ai_transcripts: await deleteRows(pb, 'media_ai_transcripts', transcriptCandidates),
			media_ai_jobs: await deleteRows(pb, 'media_ai_jobs', jobCandidates),
		};

		return json({ ok: true, deleted, deletedTotal: Object.values(deleted).reduce((sum, count) => sum + count, 0) });
	} catch (error) {
		return json({ message: 'Failed to clear Phase 7 test data', error: String(error) }, { status: 500 });
	}
};
