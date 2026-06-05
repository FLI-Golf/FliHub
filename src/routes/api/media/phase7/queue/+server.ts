import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

const ALLOWED_JOB_TYPES = new Set([
	'player_recognition',
	'logo_recognition',
	'scene_detection',
	'transcript_extraction',
	'clip_summarization',
	'metadata_suggestion'
]);

export const POST: RequestHandler = async ({ locals, request }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const role = ctx.profile?.role || '';
	if (!['admin', 'leader', 'marketing', 'marketing_lead'].includes(role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	const pb = ctx.pb;

	try {
		const body = await request.json();
		const assetId = String(body?.assetId || '').trim();
		const jobType = String(body?.jobType || 'metadata_suggestion').trim();

		if (!assetId) {
			return json({ message: 'assetId is required' }, { status: 400 });
		}
		if (!ALLOWED_JOB_TYPES.has(jobType)) {
			return json({ message: 'Invalid jobType' }, { status: 400 });
		}

		const asset = await pb.collection('media_assets').getOne(assetId).catch(() => null);
		if (!asset) {
			return json({ message: 'Asset not found' }, { status: 404 });
		}

		const job = await pb.collection('media_ai_jobs').create({
			asset: assetId,
			job_type: jobType,
			status: 'queued',
			provider: 'manual_dashboard',
			model_name: 'manual-queue'
		});

		return json({
			ok: true,
			jobId: job.id,
			assetId,
			jobType: job.job_type,
			status: job.status
		});
	} catch (error) {
		console.error('Error queueing Phase 7 AI job:', error);
		return json({ message: 'Failed to queue Phase 7 AI job', error: String(error) }, { status: 500 });
	}
};
