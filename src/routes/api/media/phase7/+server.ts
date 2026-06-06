import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

const TRANSCRIPT_TYPES = new Set([
	'metadata_suggestion',
	'clip_summarization',
	'transcript_extractions',
	'scene_detection',
	'logo_recognition',
	'player_recognition',
]);

function normalizeTranscript(record: any) {
	return {
		...record,
		transcriptType: record?.transcriptType || record?.transcript_type || 'metadata_suggestion',
		sourceAsset: record?.sourceAsset || record?.source_asset || record?.asset || null,
		transcriptText: record?.transcriptText || record?.transcript_text || '',
	};
}

function sortByCreatedDesc<T extends { created?: string }>(rows: T[]): T[] {
	return [...rows].sort((a, b) => {
		const av = Date.parse(a?.created || '') || 0;
		const bv = Date.parse(b?.created || '') || 0;
		return bv - av;
	});
}

async function listTranscripts(pb: any) {
	try {
		try {
			const records = await pb.collection('media_ai_transcripts').getFullList({
				expand: 'sourceAsset',
			});
			return sortByCreatedDesc((Array.isArray(records) ? records : []).map(normalizeTranscript));
		} catch {
			// Retry without expand for schemas/environments where sourceAsset relation is missing.
			try {
				const records = await pb.collection('media_ai_transcripts').getFullList();
				return sortByCreatedDesc((Array.isArray(records) ? records : []).map(normalizeTranscript));
			} catch {
				// Fall through to REST fallbacks.
			}
		}

		try {
			const fallback = await pb.send('/api/collections/media_ai_transcripts/records', {
				method: 'GET',
				query: {
					page: 1,
					perPage: 200,
					expand: 'sourceAsset',
				},
			}) as { items?: any[] };

				return sortByCreatedDesc((fallback?.items || []).map(normalizeTranscript));
		} catch {
			try {
				const fallback = await pb.send('/api/collections/media_ai_transcripts/records', {
					method: 'GET',
					query: {
						page: 1,
						perPage: 200,
					},
				}) as { items?: any[] };

					return sortByCreatedDesc((fallback?.items || []).map(normalizeTranscript));
			} catch {
				return [];
			}
		}
	} catch (error) {
		console.warn('[phase7] listTranscripts hard-fail fallback to empty list', error);
		return [];
	}
}

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

function normalizeReviewStatus(value: unknown): 'pending' | 'reviewed' | 'approved' | 'rejected' {
	const status = normalize(value);
	if (status === 'approved') return 'approved';
	if (status === 'rejected') return 'rejected';
	if (status === 'reviewed') return 'reviewed';
	if (status === 'completed') return 'pending';
	return 'pending';
}

function buildRecommendation(record: any, status: 'pending' | 'reviewed' | 'approved' | 'rejected') {
	const reasons: string[] = [];
	let score = 52;

	const confidence = Number(record.confidence || 0);
	if (confidence >= 0.9) {
		score += 26;
		reasons.push('Very high confidence signal');
	} else if (confidence >= 0.8) {
		score += 18;
		reasons.push('Strong confidence signal');
	} else if (confidence >= 0.7) {
		score += 10;
		reasons.push('Moderate confidence signal');
	} else {
		reasons.push('Low confidence; review manually');
	}

	const tags = normalize(record.tags);
	if (tags.includes('sponsor') || tags.includes('player') || tags.includes('highlight')) {
		score += 8;
		reasons.push('Priority keyword match');
	}

	if (status === 'approved') {
		reasons.push('Already approved');
		return { action: 'approved', label: 'already approved', score: 100, reasons };
	}

	if (status === 'rejected') {
		reasons.push('Already rejected');
		return { action: 'rejected', label: 'already rejected', score: 12, reasons };
	}

	const clamped = Math.max(1, Math.min(99, Math.round(score)));
	if (clamped >= 78 || status === 'reviewed') {
		reasons.push('Ready for human approval');
		return { action: 'approve', label: 'approve candidate', score: clamped, reasons };
	}

	reasons.push('Needs additional review');
	return { action: 'review', label: 'needs review', score: clamped, reasons };
}

function buildJob(record: any) {
	const sourceAsset = record.expand?.sourceAsset;
	const confidence = record.confidence != null ? `${Math.round(Number(record.confidence) * 100)}%` : null;
	const status = normalizeReviewStatus(record.status);
	const recommendation = buildRecommendation(record, status);

	return {
		id: record.id,
		title: record.title || record.summary || sourceAsset?.title || 'Untitled transcript',
		type: record.transcriptType || 'metadata_suggestion',
		source: sourceAsset?.title || sourceAsset?.name || 'media_ai_transcripts',
		status,
		confidence,
		recommendedAction: recommendation.action,
		recommendationLabel: recommendation.label,
		recommendationScore: recommendation.score,
		recommendationReasons: recommendation.reasons,
		tags: record.tags || '',
		approvedBy: record.approvedBy || null,
		approvedAt: record.approvedAt || null,
	};
}

export const GET: RequestHandler = async ({ locals, url }) => {
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
		const query = normalize(url.searchParams.get('query'));
		const queueType = normalize(url.searchParams.get('queueType'));
		const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 8) || 8, 1), 25);

		const records = await listTranscripts(pb);

		const filtered = records.filter((record: any) => {
			if (queueType && queueType !== 'all' && normalize(record.transcriptType || record.transcript_type) !== queueType) {
				return false;
			}

			return matchesQuery(record, query);
		});

		const counts = {
			total: records.length,
			matched: filtered.length,
			pending: filtered.filter((record: any) => normalizeReviewStatus(record.status) === 'pending').length,
			reviewed: filtered.filter((record: any) => normalizeReviewStatus(record.status) === 'reviewed').length,
			approved: filtered.filter((record: any) => normalizeReviewStatus(record.status) === 'approved').length,
			rejected: filtered.filter((record: any) => normalizeReviewStatus(record.status) === 'rejected').length,
		};

		filtered.sort((a: any, b: any) => {
			const rank = (record: any) => {
				const status = normalizeReviewStatus(record.status);
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
		const body = await request.json().catch(() => ({}));
		const action = normalize(body.action);
		const ids = Array.isArray(body.ids) ? body.ids.map((id) => String(id)).filter(Boolean) : [];
		const query = normalize(body.query);
		const queueType = normalize(body.queueType);
		const resolvedQueueType = resolveQueueType(queueType);
		const actor = ctx.userId || ctx.profile?.id || 'system';
		const reviewNotes = String(body.reviewNotes ?? '').trim();

		const allRecords = await listTranscripts(pb);

		const selected = allRecords.filter((record: any) => {
			if (ids.length > 0) {
				return ids.includes(record.id);
			}

			if (queueType && queueType !== 'all' && normalize(record.transcriptType || record.transcript_type) !== queueType) {
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
				allRecords.map((record: any) => `${record.sourceAsset || record.source_asset || record.asset || ''}:${normalize(record.transcriptType || record.transcript_type)}`)
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

		const refreshed = await listTranscripts(pb);

		const filtered = refreshed.filter((record: any) => {
			if (queueType && queueType !== 'all' && normalize(record.transcriptType || record.transcript_type) !== queueType) {
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
				pending: filtered.filter((record: any) => normalizeReviewStatus(record.status) === 'pending').length,
				reviewed: filtered.filter((record: any) => normalizeReviewStatus(record.status) === 'reviewed').length,
				approved: filtered.filter((record: any) => normalizeReviewStatus(record.status) === 'approved').length,
				rejected: filtered.filter((record: any) => normalizeReviewStatus(record.status) === 'rejected').length,
			},
			jobs: filtered.slice(0, 8).map(buildJob),
		});
	} catch (error) {
		console.error('Error updating Phase 7 queue:', error);
		return json({ message: 'Failed to update Phase 7 queue', error: String(error) }, { status: 500 });
	}
};