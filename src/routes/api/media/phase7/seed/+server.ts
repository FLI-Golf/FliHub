import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';

const DEMO_CREATED_BY = 'phase7-demo';

const DEMO_SCENARIOS = [
	{
		transcriptType: 'metadata_suggestion',
		jobType: 'metadata_suggestion',
		status: 'pending',
		confidence: 0.93,
		titleSuffix: 'metadata suggestion',
		tags: 'highlight,sponsor,player',
		summaryLabel: 'Suggested metadata',
		transcriptLabel: 'Transcript match',
	},
	{
		transcriptType: 'clip_summarization',
		jobType: 'clip_summarization',
		status: 'pending',
		confidence: 0.88,
		titleSuffix: 'clip summary',
		tags: 'recap,highlight',
		summaryLabel: 'Clip summary',
		transcriptLabel: 'Summary transcript',
	},
	{
		transcriptType: 'transcript_extractions',
		jobType: 'transcript_extraction',
		status: 'reviewed',
		confidence: 0.82,
		titleSuffix: 'transcript extraction',
		tags: 'transcript,quote',
		summaryLabel: 'Transcript extraction',
		transcriptLabel: 'Extracted quote',
	},
	{
		transcriptType: 'scene_detection',
		jobType: 'scene_detection',
		status: 'pending',
		confidence: 0.79,
		titleSuffix: 'scene detection',
		tags: 'scene,course,b-roll',
		summaryLabel: 'Scene detection',
		transcriptLabel: 'Scene note',
	},
	{
		transcriptType: 'logo_recognition',
		jobType: 'logo_recognition',
		status: 'approved',
		confidence: 0.9,
		titleSuffix: 'logo recognition',
		tags: 'logo,sponsor,branding',
		summaryLabel: 'Logo recognition',
		transcriptLabel: 'Branding mention',
	},
	{
		transcriptType: 'player_recognition',
		jobType: 'player_recognition',
		status: 'pending',
		confidence: 0.86,
		titleSuffix: 'player recognition',
		tags: 'player,feature,roster',
		summaryLabel: 'Player recognition',
		transcriptLabel: 'Player callout',
	},
] as const;

async function deleteRows(pb: any, collection: string, rows: Array<{ id: string }>) {
	for (const row of rows) {
		await pb.collection(collection).delete(row.id).catch(() => undefined);
	}
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

async function loadAssets(pb: any) {
	try {
		return await pb.collection('media_assets').getFullList({
			sort: '-created',
			fields: 'id,title,asset_type,media_category,tags,duration_seconds',
		});
	} catch {
		const fallback = await pb.send('/api/collections/media_assets/records', {
			method: 'GET',
			query: {
				page: 1,
				perPage: 50,
			},
		}) as { items?: any[] };

		const items = fallback?.items || [];
		items.sort((a: any, b: any) => {
			const av = Date.parse(a?.created || '') || 0;
			const bv = Date.parse(b?.created || '') || 0;
			return bv - av;
		});

		return items;
	}
}

function buildTranscript(asset: any, scenario: (typeof DEMO_SCENARIOS)[number], index: number) {
	const title = asset.title || `Demo Asset ${index + 1}`;
	const category = asset.media_category || asset.asset_type || 'media';
	const assetTags = String(asset.tags || '').trim();
	const tags = [scenario.tags, assetTags].filter(Boolean).join(',');
	const transcriptText = `${scenario.transcriptLabel}: ${title} includes searchable ${category} moments for the Phase 7 demo queue.`;
	const approvedFields = scenario.status === 'approved'
		? {
			approvedBy: DEMO_CREATED_BY,
			approvedAt: new Date().toISOString(),
		}
		: {};

	return {
		title: `${title} - ${scenario.titleSuffix}`,
		asset: asset.id,
		sourceAsset: asset.id,
		transcriptType: scenario.transcriptType,
		status: scenario.status,
		transcriptText,
		transcript_text: transcriptText,
		summary: `${scenario.summaryLabel} for ${title}. This demo row is intended to validate queue filters, approvals, and search behavior in the dashboard panel.`,
		tags,
		language: 'en',
		durationSeconds: Number(asset.duration_seconds || 0) || null,
		speakerCount: 1,
		confidence: scenario.confidence,
		estimatedRevenue: 250 + index * 50,
		downloadCount: index,
		requestCount: index + 1,
		reviewNotes: `Demo seed for ${scenario.transcriptType}.`,
		createdBy: DEMO_CREATED_BY,
		...approvedFields,
	};
}

export const POST: RequestHandler = async ({ locals }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const role = ctx.profile?.role || '';
	if (!['admin', 'leader'].includes(role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	try {
		const adminPb = await createAdminPb();
		const assets = await loadAssets(adminPb);

		if (!assets.length) {
			return json({ message: 'Need at least one media asset before seeding Phase 7 demo data.' }, { status: 400 });
		}

		const [existingRows, existingJobs] = await Promise.all([
			adminPb.collection('media_ai_transcripts').getFullList({
				filter: `createdBy = "${DEMO_CREATED_BY}"`,
				fields: 'id',
			}).catch(() => []),
			adminPb.collection('media_ai_jobs').getFullList({
				filter: `provider = "${DEMO_CREATED_BY}"`,
				fields: 'id',
			}).catch(() => []),
		]);

		await deleteRows(adminPb, 'media_ai_transcripts', existingRows as Array<{ id: string }>);
		await deleteRows(adminPb, 'media_ai_jobs', existingJobs as Array<{ id: string }>);

		const created = [];
		for (const [index, scenario] of DEMO_SCENARIOS.entries()) {
			const asset = assets[index % assets.length];
			const job = await adminPb.collection('media_ai_jobs').create({
				asset: asset.id,
				job_type: scenario.jobType,
				status: 'completed',
				provider: DEMO_CREATED_BY,
				model_name: 'phase7-demo',
			});

			const transcript = await adminPb.collection('media_ai_transcripts').create({
				...buildTranscript(asset, scenario, index),
				job: job.id,
			});

			created.push({
				id: transcript.id,
				transcriptType: scenario.transcriptType,
				title: transcript.title,
			});
		}

		return json({
			ok: true,
			created: created.length,
			queueTypes: created.map((row) => row.transcriptType),
			rows: created,
		});
	} catch (error: any) {
		console.error('Failed to seed Phase 7 demo data:', error);
		return json(
			{
				message: 'Failed to seed Phase 7 demo data',
				error: error?.response || error?.data || error?.message || String(error),
			},
			{ status: 500 }
		);
	}
};