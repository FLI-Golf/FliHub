import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const TRANSCRIPT_TYPES = new Set([
	'metadata_suggestion',
	'clip_summarization',
	'transcript_extractions',
	'scene_detection',
	'logo_recognition',
	'player_recognition',
]);

function normalize(value: unknown): string {
	return String(value ?? '').trim().toLowerCase();
}

function resolveQueueType(value: string): string {
	if (value === 'all' || value === '') return 'metadata_suggestion';
	return TRANSCRIPT_TYPES.has(value) ? value : 'metadata_suggestion';
}

function matchesQuery(record: any, query: string): boolean {
	if (!query) return true;

	const haystack = [
		record.title,
		record.summary,
		record.transcriptText,
		record.tags,
		record.language,
		record.expand?.sourceAsset?.title,
		record.expand?.sourceAsset?.asset_type,
	].map((value) => normalize(value)).join(' ');

	return haystack.includes(query);
}

function buildJob(record: any) {
	const sourceAsset = record.expand?.sourceAsset;
	const confidence = record.confidence != null ? `${Math.round(Number(record.confidence) * 100)}%` : null;
	const normalizedStatus = normalize(record.status);
	const normalizedConfidence = Number(record.confidence || 0);
	const recommendedAction = normalizedStatus === 'approved'
		? 'approved'
		: normalizedStatus === 'rejected'
			? 'rejected'
			: normalizedConfidence >= 0.8 || normalizedStatus === 'reviewed'
				? 'approve'
				: 'review';

	return {
		id: record.id,
		title: record.title || record.summary || sourceAsset?.title || 'Untitled transcript',
		type: record.transcriptType || 'metadata_suggestion',
		source: sourceAsset?.title || sourceAsset?.name || 'media_ai_transcripts',
		status: record.status || 'pending',
		confidence,
		recommendedAction,
		tags: record.tags || '',
		approvedBy: record.approvedBy || null,
		approvedAt: record.approvedAt || null,
	};
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const query = normalize(url.searchParams.get('query'));
		const queueType = normalize(url.searchParams.get('queueType'));
		const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 8) || 8, 1), 25);

		const records = await pb.collection('media_ai_transcripts').getFullList({
			sort: '-created',
			expand: 'sourceAsset',
		}).catch(() => []);

		const filtered = records.filter((record: any) => {
			if (queueType && queueType !== 'all' && normalize(record.transcriptType) !== queueType) {
				return false;
			}

			return matchesQuery(record, query);
		});

		const counts = {
			total: records.length,
			matched: filtered.length,
			pending: filtered.filter((record: any) => normalize(record.status) === 'pending').length,
			reviewed: filtered.filter((record: any) => normalize(record.status) === 'reviewed').length,
			approved: filtered.filter((record: any) => normalize(record.status) === 'approved').length,
			rejected: filtered.filter((record: any) => normalize(record.status) === 'rejected').length,
		};

		filtered.sort((a: any, b: any) => {
			const rank = (record: any) => {
				const status = normalize(record.status);
				if (status === 'pending') return 0;
				if (status === 'reviewed') return 1;
				if (status === 'approved') return 2;
				if (status === 'rejected') return 3;
				return 4;
			};

			return rank(a) - rank(b);
		});

		return json({
			query,
			queueType,
			counts,
			jobs: filtered.slice(0, limit).map(buildJob),
		});
	} catch (error) {
		console.error('Error fetching Phase 7 queue:', error);
		return json({ message: 'Failed to fetch Phase 7 queue', error: String(error) }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json().catch(() => ({}));
		const action = normalize(body.action);
		const ids = Array.isArray(body.ids) ? body.ids.map((id) => String(id)).filter(Boolean) : [];
		const query = normalize(body.query);
		const queueType = normalize(body.queueType);
		const resolvedQueueType = resolveQueueType(queueType);
		const actor = pb.authStore.model?.id || pb.authStore.model?.email || 'system';
		const reviewNotes = String(body.reviewNotes ?? '').trim();

		const allRecords = await pb.collection('media_ai_transcripts').getFullList({
			sort: '-created',
			expand: 'sourceAsset',
		}).catch(() => []);

		const selected = allRecords.filter((record: any) => {
			if (ids.length > 0) {
				return ids.includes(record.id);
			}

			if (queueType && queueType !== 'all' && normalize(record.transcriptType) !== queueType) {
				return false;
			}

			return matchesQuery(record, query);
		});

		if (action === 'process' && selected.length === 0) {
			const assets = await pb.collection('media_assets').getFullList({
				sort: '-created',
				filter: query ? '' : '',
			}).catch(() => []);

			const existingKey = new Set(
				allRecords.map((record: any) => `${record.sourceAsset || ''}:${normalize(record.transcriptType)}`)
			);

			const candidateAssets = assets.filter((asset: any) => {
				if (!query) return true;
				const haystack = [asset.title, asset.tags, asset.notes, asset.asset_type]
					.map((value: any) => normalize(value))
					.join(' ');
				return haystack.includes(query);
			});

			const toCreate = candidateAssets
				.filter((asset: any) => !existingKey.has(`${asset.id}:${resolvedQueueType}`))
				.slice(0, 8)
				.map((asset: any) => pb.collection('media_ai_transcripts').create({
					title: `${asset.title || 'Untitled'} · ${resolvedQueueType}`,
					sourceAsset: asset.id,
					transcriptType: resolvedQueueType,
					status: 'pending',
					summary: `Queue item generated from media asset ${asset.title || asset.id}`,
					tags: asset.tags || '',
					language: 'en',
					requestCount: 1,
					createdBy: actor,
				}));

			if (toCreate.length > 0) {
				await Promise.all(toCreate);
			}
		}

		const updates = selected
			.filter((record: any) => {
				const status = normalize(record.status);
				return status !== 'approved' && status !== 'rejected';
			})
			.map(async (record: any) => {
				if (action === 'approve') {
					return pb.collection('media_ai_transcripts').update(record.id, {
						status: 'approved',
						approvedBy: actor,
						approvedAt: new Date().toISOString(),
						requestCount: Number(record.requestCount || 0) + 1,
						reviewNotes: reviewNotes || record.reviewNotes || '',
					});
				}

				if (action === 'reject') {
					return pb.collection('media_ai_transcripts').update(record.id, {
						status: 'rejected',
						approvedBy: actor,
						approvedAt: new Date().toISOString(),
						requestCount: Number(record.requestCount || 0) + 1,
						reviewNotes: reviewNotes || record.reviewNotes || '',
					});
				}

				return pb.collection('media_ai_transcripts').update(record.id, {
					status: 'pending',
					requestCount: Number(record.requestCount || 0) + 1,
					reviewNotes: reviewNotes || record.reviewNotes || '',
				});
			});

		await Promise.all(updates);

		const refreshed = await pb.collection('media_ai_transcripts').getFullList({
			sort: '-created',
			expand: 'sourceAsset',
		}).catch(() => []);

		const filtered = refreshed.filter((record: any) => {
			if (queueType && queueType !== 'all' && normalize(record.transcriptType) !== queueType) {
				return false;
			}

			return matchesQuery(record, query);
		});

		return json({
			action,
			updated: updates.length,
			counts: {
				total: refreshed.length,
				matched: filtered.length,
				pending: filtered.filter((record: any) => normalize(record.status) === 'pending').length,
				reviewed: filtered.filter((record: any) => normalize(record.status) === 'reviewed').length,
				approved: filtered.filter((record: any) => normalize(record.status) === 'approved').length,
				rejected: filtered.filter((record: any) => normalize(record.status) === 'rejected').length,
			},
			jobs: filtered.slice(0, 8).map(buildJob),
		});
	} catch (error) {
		console.error('Error updating Phase 7 queue:', error);
		return json({ message: 'Failed to update Phase 7 queue', error: String(error) }, { status: 500 });
	}
};