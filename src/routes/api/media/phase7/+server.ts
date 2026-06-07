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
	const rawJobType = record?.jobType || record?.job_type || '';
	const transcriptType = record?.transcriptType || record?.transcript_type || rawJobType || 'metadata_suggestion';
	const normalizedType = transcriptType === 'transcript_extraction' ? 'transcript_extractions' : transcriptType;
	const statusCandidates = [
		record?.reviewStatus,
		record?.review_status,
		record?.reviewState,
		record?.review_state,
		record?.status,
	];
	const status = statusCandidates
		.map((value) => normalize(value))
		.find((value) => value === 'approved' || value === 'rejected' || value === 'reviewed' || value === 'pending' || value === 'completed') || 'pending';

	return {
		...record,
		transcriptType: normalizedType,
		sourceAsset: record?.sourceAsset || record?.source_asset || record?.asset || null,
		transcriptText: record?.transcriptText || record?.transcript_text || '',
		jobId: record?.jobId || record?.job || record?.job_id || record?.aiJob || record?.ai_job || null,
		status,
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

async function listAssets(pb: any) {
	try {
		const rows = await pb.collection('media_assets').getFullList();
		return Array.isArray(rows) ? rows : [];
	} catch {
		try {
			const fallback = await pb.send('/api/collections/media_assets/records', {
				method: 'GET',
				query: { page: 1, perPage: 200 },
			}) as { items?: any[] };
			return fallback?.items || [];
		} catch {
			return [];
		}
	}
}

async function listAiJobs(pb: any) {
	try {
		const rows = await pb.collection('media_ai_jobs').getFullList();
		return Array.isArray(rows) ? rows : [];
	} catch {
		try {
			const fallback = await pb.send('/api/collections/media_ai_jobs/records', {
				method: 'GET',
				query: { page: 1, perPage: 200 },
			}) as { items?: any[] };
			return fallback?.items || [];
		} catch {
			return [];
		}
	}
}

async function hydrateTranscripts(pb: any, records: any[]) {
	if (!records.length) return records;

	const [assets, jobs] = await Promise.all([listAssets(pb), listAiJobs(pb)]);
	const assetMap = new Map(assets.map((asset: any) => [asset.id, asset]));
	const jobMap = new Map(jobs.map((job: any) => [job.id, job]));
	const jobsByAssetAndType = new Map<string, any>();

	for (const job of sortByCreatedDesc(jobs as any[])) {
		const jobType = normalize(job?.job_type || job?.jobType);
		const normalizedType = jobType === 'transcript_extraction' ? 'transcript_extractions' : jobType;
		const assetId = String(job?.asset || '').trim();
		if (!assetId || !normalizedType) continue;
		const key = `${assetId}:${normalizedType}`;
		if (!jobsByAssetAndType.has(key)) jobsByAssetAndType.set(key, job);
	}

	return records.map((record: any) => {
		const explicitJobId = record.jobId || record.job || record.job_id || record.aiJob || record.ai_job || record.expand?.job?.id || '';
		let linkedJob = jobMap.get(explicitJobId);
		const sourceAssetId = record.sourceAsset || record.source_asset || record.asset || linkedJob?.asset || null;
		if (!linkedJob && sourceAssetId) {
			const key = `${sourceAssetId}:${normalize(record.transcriptType || record.transcript_type)}`;
			linkedJob = jobsByAssetAndType.get(key) || null;
		}

		let jobResult: any = null;
		try {
			if (linkedJob?.result_json && typeof linkedJob.result_json === 'string') {
				jobResult = JSON.parse(linkedJob.result_json);
			} else if (linkedJob?.result_json && typeof linkedJob.result_json === 'object') {
				jobResult = linkedJob.result_json;
			}
		} catch {
			jobResult = null;
		}

		const sourceAsset = sourceAssetId ? assetMap.get(sourceAssetId) : null;
		const hasExpand = Boolean(record.expand?.sourceAsset);
		const title = record.title || record.summary || record.transcriptText || sourceAsset?.title || 'Untitled transcript';
		const jobReviewStatus = jobResult?.reviewStatus || jobResult?.review_status || jobResult?.status || null;

		return {
			...record,
			title,
			jobId: linkedJob?.id || explicitJobId || null,
			sourceAsset: sourceAssetId,
			transcriptType: record.transcriptType || (linkedJob?.job_type === 'transcript_extraction' ? 'transcript_extractions' : linkedJob?.job_type) || 'metadata_suggestion',
			confidence: record.confidence ?? null,
			provider: record.provider || linkedJob?.provider || null,
			jobReviewStatus,
			jobStatus: linkedJob?.status || null,
			expand: hasExpand || !sourceAsset
				? record.expand
				: {
					...(record.expand || {}),
					sourceAsset,
				},
		};
	});
}

function normalize(value: unknown): string {
	return String(value ?? '').trim().toLowerCase();
}

function parseDebugFlag(value: unknown): boolean {
	const normalized = normalize(value);
	return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

const TAG_RULES = [
	{ tag: 'sponsor', reason: 'Sponsor terms detected', weight: 14, terms: ['sponsor', 'brand', 'partner', 'activation', 'logo'] },
	{ tag: 'player', reason: 'Player terms detected', weight: 12, terms: ['player', 'pro', 'golfer', 'athlete', 'roster'] },
	{ tag: 'highlight', reason: 'Highlight terms detected', weight: 10, terms: ['highlight', 'recap', 'best shot', 'moment', 'feature'] },
	{ tag: 'equipment', reason: 'Equipment terms detected', weight: 9, terms: ['shoe', 'club', 'driver', 'putter', 'ball'] },
	{ tag: 'interview', reason: 'Interview terms detected', weight: 8, terms: ['interview', 'quote', 'press', 'post-round'] },
	{ tag: 'broadcast', reason: 'Broadcast terms detected', weight: 8, terms: ['broadcast', 'segment', 'camera', 'b-roll', 'live'] },
	{ tag: 'scene', reason: 'Scene terms detected', weight: 7, terms: ['scene', 'course', 'crowd', 'fairway', 'green'] },
];

function splitTags(value: unknown): string[] {
	return String(value || '')
		.split(',')
		.map((v) => normalize(v))
		.filter(Boolean);
}

function deriveMockMetadata(record: any) {
	const sourceAsset = record.expand?.sourceAsset;
	const transcriptType = normalize(record.transcriptType || record.transcript_type);
	const bag = [
		record.title,
		record.summary,
		record.transcriptText,
		record.transcript_text,
		record.tags,
		record.provider,
		sourceAsset?.title,
		sourceAsset?.asset_type,
		sourceAsset?.media_category,
		transcriptType,
	]
		.map((value) => normalize(value))
		.join(' ');

	const tagWeights = new Map<string, number>();
	const reasons: string[] = [];

	for (const explicitTag of splitTags(record.tags)) {
		tagWeights.set(explicitTag, Math.max(tagWeights.get(explicitTag) || 0, 8));
	}

	for (const rule of TAG_RULES) {
		if (rule.terms.some((term) => bag.includes(term))) {
			tagWeights.set(rule.tag, Math.max(tagWeights.get(rule.tag) || 0, rule.weight));
			reasons.push(rule.reason);
		}
	}

	if (transcriptType === 'logo_recognition') {
		tagWeights.set('branding', Math.max(tagWeights.get('branding') || 0, 12));
		reasons.push('Queue type aligns with branding metadata');
	}
	if (transcriptType === 'player_recognition') {
		tagWeights.set('player_feature', Math.max(tagWeights.get('player_feature') || 0, 12));
		reasons.push('Queue type aligns with player metadata');
	}
	if (transcriptType === 'clip_summarization') {
		tagWeights.set('summary', Math.max(tagWeights.get('summary') || 0, 9));
		reasons.push('Queue type aligns with summary metadata');
	}

	const rankedTags = [...tagWeights.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([tag]) => tag);

	const signalScore = [...tagWeights.values()].reduce((acc, value) => acc + value, 0);
	const signalBoost = Math.min(32, Math.round(signalScore / 3));

	return {
		tags: rankedTags,
		reasons,
		signalBoost,
	};
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

function normalizeReviewStatusFromRecord(record: any): 'pending' | 'reviewed' | 'approved' | 'rejected' {
	if (record?.rejectedAt || record?.rejected_at) return 'rejected';
	if (record?.approvedAt || record?.approved_at) return 'approved';

	const candidates = [
		record?.jobReviewStatus,
		record?.reviewStatus,
		record?.review_status,
		record?.reviewState,
		record?.review_state,
		record?.status,
	];
	const normalized = candidates
		.map((candidate) => normalizeReviewStatus(candidate));

	if (normalized.includes('approved')) return 'approved';
	if (normalized.includes('rejected')) return 'rejected';
	if (normalized.includes('reviewed')) return 'reviewed';
	if (normalized.includes('pending')) return 'pending';

	const raw = candidates.map((candidate) => normalize(candidate));
	if (raw.includes('completed')) return 'pending';

	return 'pending';
}

function buildRecommendation(record: any, status: 'pending' | 'reviewed' | 'approved' | 'rejected') {
	const mockMeta = deriveMockMetadata(record);
	const reasons: string[] = [];
	let score = 44 + mockMeta.signalBoost;

	if (mockMeta.reasons.length > 0) {
		reasons.push(...mockMeta.reasons.slice(0, 3));
	}

	const rawConfidence = Number(record.confidence || 0);
	const confidence = rawConfidence > 0
		? rawConfidence
		: Math.min(0.91, 0.48 + mockMeta.signalBoost / 100 + (status === 'reviewed' ? 0.08 : 0));

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

	const tags = new Set([normalize(record.tags), ...mockMeta.tags].join(',').split(',').map((tag) => normalize(tag)).filter(Boolean));
	if (tags.has('sponsor') || tags.has('player') || tags.has('highlight')) {
		score += 8;
		reasons.push('Priority keyword match');
	}

	if (mockMeta.tags.length >= 3) {
		score += 6;
		reasons.push('Multiple metadata signals agree');
	}

	if (status === 'approved') {
		reasons.push('Already approved');
		return { action: 'approved', label: 'already approved', score: 100, reasons, tags: mockMeta.tags };
	}

	if (status === 'rejected') {
		reasons.push('Already rejected');
		return { action: 'rejected', label: 'already rejected', score: 12, reasons, tags: mockMeta.tags };
	}

	const clamped = Math.max(1, Math.min(99, Math.round(score)));
	if (clamped >= 78 || status === 'reviewed') {
		reasons.push('Ready for human approval');
		return { action: 'approve', label: 'approve candidate', score: clamped, reasons, tags: mockMeta.tags };
	}

	reasons.push('Needs additional review');
	return { action: 'review', label: 'needs review', score: clamped, reasons, tags: mockMeta.tags };
}

function buildJob(record: any) {
	const sourceAsset = record.expand?.sourceAsset;
	const confidence = record.confidence != null ? `${Math.round(Number(record.confidence) * 100)}%` : null;
	const status = normalizeReviewStatusFromRecord(record);
	const recommendation = buildRecommendation(record, status);

	return {
		id: record.id,
		title: record.title || record.summary || sourceAsset?.title || 'Untitled transcript',
		type: record.transcriptType || 'metadata_suggestion',
		source: sourceAsset?.title || sourceAsset?.name || record.provider || 'media_ai_transcripts',
		status,
		confidence,
		recommendedAction: recommendation.action,
		recommendationLabel: recommendation.label,
		recommendationScore: recommendation.score,
		recommendationReasons: recommendation.reasons,
		mockTags: recommendation.tags,
		tags: record.tags || '',
		approvedBy: record.approvedBy || null,
		approvedAt: record.approvedAt || null,
	};
}

async function persistReviewState(pb: any, record: any, action: string, actor: string, reviewNotes: string) {
	const nextStatus = action === 'approve'
		? 'approved'
		: action === 'reject'
			? 'rejected'
			: 'pending';

	const timestamp = new Date().toISOString();
	const requestCount = Number(record.requestCount || record.request_count || 0) + 1;
	const notes = reviewNotes || record.reviewNotes || record.review_notes || '';
	const approvalPayload = action === 'approve'
		? {
			approvedBy: actor,
			approvedAt: timestamp,
			approved_by: actor,
			approved_at: timestamp,
			rejectedBy: null,
			rejectedAt: null,
			rejected_by: null,
			rejected_at: null,
		}
		: action === 'reject'
			? {
				rejectedBy: actor,
				rejectedAt: timestamp,
				rejected_by: actor,
				rejected_at: timestamp,
				approvedBy: null,
				approvedAt: null,
				approved_by: null,
				approved_at: null,
			}
			: {
				approvedBy: null,
				approvedAt: null,
				approved_by: null,
				approved_at: null,
				rejectedBy: null,
				rejectedAt: null,
				rejected_by: null,
				rejected_at: null,
			};

	const candidates = [
		{ reviewStatus: nextStatus, requestCount, reviewNotes: notes, ...approvalPayload },
		{ review_status: nextStatus, request_count: requestCount, review_notes: notes, ...approvalPayload },
		{ reviewState: nextStatus, requestCount, reviewNotes: notes, ...approvalPayload },
		{ review_state: nextStatus, request_count: requestCount, review_notes: notes, ...approvalPayload },
		{ reviewStatus: nextStatus },
		{ review_status: nextStatus },
		{ reviewState: nextStatus },
		{ review_state: nextStatus },
		// Legacy fallback for older transcript schemas that only expose a status field.
		{ status: nextStatus, requestCount, reviewNotes: notes, ...approvalPayload },
		{ status: nextStatus, request_count: requestCount, review_notes: notes, ...approvalPayload },
		{ status: nextStatus },
	];

	for (const payload of candidates) {
		try {
			await pb.collection('media_ai_transcripts').update(record.id, payload);

			// Verify the persisted status so we don't treat partial/no-op writes as success.
			const verifyRow = await pb.collection('media_ai_transcripts').getOne(record.id).catch(() => null);
			if (!verifyRow) continue;

			const persisted = normalizeTranscript(verifyRow);
			const persistedStatus = normalizeReviewStatusFromRecord(persisted);
			if (persistedStatus === nextStatus) {
				return true;
			}
		} catch {
			// Try next compatibility payload.
		}
	}

	const jobId = record.jobId || record.job || record.job_id || record.aiJob || record.ai_job || null;
	if (jobId) {
		try {
			const job = await pb.collection('media_ai_jobs').getOne(jobId);
			let existingResult: any = {};
			try {
				existingResult = typeof job?.result_json === 'string'
					? JSON.parse(job.result_json || '{}')
					: (job?.result_json || {});
			} catch {
				existingResult = {};
			}

			const nextResult = {
				...existingResult,
				reviewStatus: nextStatus,
				review_status: nextStatus,
				reviewedBy: actor,
				reviewedAt: timestamp,
				reviewNotes: notes,
			};

			const existingStatus = normalize(job?.status || 'completed');
			const jobStatus = existingStatus || 'completed';
			const jobType = job?.job_type || job?.jobType || 'metadata_suggestion';
			const asset = job?.asset || record.sourceAsset || record.source_asset || record.asset || null;

			if (!asset) {
				throw new Error('Missing asset relation for media_ai_jobs update');
			}

			const jobUpdatePayload = {
				asset,
				job_type: jobType,
				status: jobStatus,
				provider: job?.provider || 'phase7-review',
				model_name: job?.model_name || job?.modelName || 'phase7-review',
				result_json: nextResult,
				completed_at: timestamp,
			};

			await pb.collection('media_ai_jobs').update(jobId, jobUpdatePayload);

			const readBackStatus = async () => {
				const verifyJob = await pb.collection('media_ai_jobs').getOne(jobId).catch(() => null);
				if (!verifyJob) return null;

				let verifyResult: any = {};
				try {
					verifyResult = typeof verifyJob?.result_json === 'string'
						? JSON.parse(verifyJob.result_json || '{}')
						: (verifyJob?.result_json || {});
				} catch {
					verifyResult = {};
				}

				return normalize(
					verifyResult?.reviewStatus ||
					verifyResult?.review_status ||
					verifyResult?.status ||
					''
				);
			};

			let confirmed = false;
			for (let attempt = 0; attempt < 3; attempt++) {
				const persistedStatus = await readBackStatus();
				if (persistedStatus === nextStatus) {
					confirmed = true;
					break;
				}

				if (attempt < 2) {
					await pb.collection('media_ai_jobs').update(jobId, jobUpdatePayload).catch(() => null);
				}
			}

			if (!confirmed) {
				throw new Error(`Job review status verification failed for ${jobId}`);
			}

			console.log('[media][phase7][api] job fallback persisted', {
				jobId,
				nextStatus,
				jobStatus,
				asset,
			});

			return true;
		} catch (error) {
			console.warn('[media][phase7][api] job fallback failed', {
				jobId,
				error: String(error),
			});
		}
	}

	return false;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const role = String(ctx.role || '').toLowerCase();
	if (!['admin', 'leader', 'marketing', 'marketing_lead'].includes(role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	const pb = ctx.pb;

	try {
		const query = normalize(url.searchParams.get('query'));
		const queueType = normalize(url.searchParams.get('queueType'));
		const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 8) || 8, 1), 25);

		const rawRecords = await listTranscripts(pb);
		const records = await hydrateTranscripts(pb, rawRecords);

		const filtered = records.filter((record: any) => {
			if (queueType && queueType !== 'all' && normalize(record.transcriptType || record.transcript_type) !== queueType) {
				return false;
			}

			return matchesQuery(record, query);
		});

		const counts = {
			total: records.length,
			matched: filtered.length,
			pending: filtered.filter((record: any) => normalizeReviewStatusFromRecord(record) === 'pending').length,
			reviewed: filtered.filter((record: any) => normalizeReviewStatusFromRecord(record) === 'reviewed').length,
			approved: filtered.filter((record: any) => normalizeReviewStatusFromRecord(record) === 'approved').length,
			rejected: filtered.filter((record: any) => normalizeReviewStatusFromRecord(record) === 'rejected').length,
		};

		filtered.sort((a: any, b: any) => {
			const rank = (record: any) => {
				const status = normalizeReviewStatusFromRecord(record);
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

	const role = String(ctx.role || '').toLowerCase();
	if (!['admin', 'leader', 'marketing', 'marketing_lead'].includes(role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	const pb = ctx.pb;
	const requestId = `phase7-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

	try {
		const body: {
			debug?: unknown;
			action?: unknown;
			ids?: unknown[];
			query?: unknown;
			queueType?: unknown;
			reviewNotes?: unknown;
		} = await request.json().catch(() => ({}));
		const debug = parseDebugFlag(body.debug) || parseDebugFlag(request.headers.get('x-phase7-debug'));
		const action = normalize(body.action);
		const ids = Array.isArray(body.ids) ? body.ids.map((id) => String(id)).filter(Boolean) : [];
		const query = normalize(body.query);
		const queueType = normalize(body.queueType);
		const resolvedQueueType = resolveQueueType(queueType);
		const actor = ctx.userId || ctx.profile?.id || 'system';
		const reviewNotes = String(body.reviewNotes ?? '').trim();
		console.log('[media][phase7][api] post start', {
			requestId,
			action,
			ids,
			queueType,
			query,
			actor,
			role,
			debug,
		});
		if (debug) {
			console.log('[media][phase7][api] debug body snapshot', {
				requestId,
				keys: Object.keys(body || {}),
				idsCount: ids.length,
				reviewNotesLength: reviewNotes.length,
			});
		}

		const allRecords = await hydrateTranscripts(pb, await listTranscripts(pb));

		const selected = allRecords.filter((record: any) => {
			if (ids.length > 0) {
				return ids.includes(record.id);
			}

			if (queueType && queueType !== 'all' && normalize(record.transcriptType || record.transcript_type) !== queueType) {
				return false;
			}

			return matchesQuery(record, query);
		});

		if (debug) {
			const selectedSet = new Set(selected.map((record: any) => record.id));
			const missingIds = ids.filter((id: string) => !selectedSet.has(id));
			console.log('[media][phase7][api] debug selection', {
				requestId,
				allRecords: allRecords.length,
				selected: selected.length,
				idsRequested: ids.length,
				missingIds,
				selectedPreview: selected.slice(0, 8).map((record: any) => ({
					id: record.id,
					status: normalizeReviewStatusFromRecord(record),
					transcriptType: normalize(record.transcriptType || record.transcript_type),
					jobId: record.jobId || record.job || record.job_id || record.aiJob || record.ai_job || null,
				})),
			});
		}

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

		const selectedForUpdate = selected.filter((record: any) => {
			const status = normalizeReviewStatusFromRecord(record);
			if (action === 'approve') return status !== 'approved';
			if (action === 'reject') return status !== 'rejected';
			return true;
		});

		const updateResults = await Promise.all(
			selectedForUpdate.map(async (record: any) => {
				const changed = await persistReviewState(pb, record, action, actor, reviewNotes);
				return {
					id: record.id,
					statusBefore: normalizeReviewStatusFromRecord(record),
					jobId: record.jobId || record.job || record.job_id || record.aiJob || record.ai_job || null,
					changed,
				};
			})
		);
		const updates = updateResults.map((row) => row.changed);

		console.log('[media][phase7][api] post update results', {
			requestId,
			action,
			selected: selected.length,
			selectedForUpdate: selectedForUpdate.length,
			updated: updates.filter(Boolean).length,
			ids,
			selectedStatuses: selected.map((record: any) => ({
				id: record.id,
				status: normalizeReviewStatusFromRecord(record),
				jobId: record.jobId || null,
			})),
		});

		if (debug) {
			const failed = updateResults.filter((row) => !row.changed);
			console.log('[media][phase7][api] debug persistence summary', {
				requestId,
				attempted: updateResults.length,
				failed: failed.length,
				failedIds: failed.map((row) => row.id),
				failedRows: failed,
			});
		}

		const refreshed = await hydrateTranscripts(pb, await listTranscripts(pb));

		const filtered = refreshed.filter((record: any) => {
			if (queueType && queueType !== 'all' && normalize(record.transcriptType || record.transcript_type) !== queueType) {
				return false;
			}

			return matchesQuery(record, query);
		});

		const prioritizedIds = new Set(ids);
		const prioritized = filtered.filter((record: any) => prioritizedIds.has(record.id));
		const remainder = filtered.filter((record: any) => !prioritizedIds.has(record.id));
		remainder.sort((a: any, b: any) => {
			const rank = (record: any) => {
				const status = normalizeReviewStatusFromRecord(record);
				if (status === 'pending') return 0;
				if (status === 'reviewed') return 1;
				if (status === 'approved') return 2;
				if (status === 'rejected') return 3;
				return 4;
			};

			const byStatus = rank(a) - rank(b);
			if (byStatus !== 0) return byStatus;

			const aCreated = Date.parse(a?.created || '') || 0;
			const bCreated = Date.parse(b?.created || '') || 0;
			return bCreated - aCreated;
		});
		const responseJobs = [...prioritized, ...remainder];

		return json({
			action,
			updated: updates.filter(Boolean).length,
			...(debug
				? {
					debug: {
						requestId,
						idsRequested: ids,
						selectedIds: selected.map((record: any) => record.id),
						attemptedIds: selectedForUpdate.map((record: any) => record.id),
						failedIds: updateResults.filter((row) => !row.changed).map((row) => row.id),
					},
				}
				: {}),
			counts: {
				total: refreshed.length,
				matched: filtered.length,
				pending: filtered.filter((record: any) => normalizeReviewStatusFromRecord(record) === 'pending').length,
				reviewed: filtered.filter((record: any) => normalizeReviewStatusFromRecord(record) === 'reviewed').length,
				approved: filtered.filter((record: any) => normalizeReviewStatusFromRecord(record) === 'approved').length,
				rejected: filtered.filter((record: any) => normalizeReviewStatusFromRecord(record) === 'rejected').length,
			},
			jobs: responseJobs.slice(0, 8).map(buildJob),
		});
	} catch (error) {
		console.error('[media][phase7][api] post error', { requestId, error });
		return json({ message: 'Failed to update Phase 7 queue', error: String(error) }, { status: 500 });
	}
};