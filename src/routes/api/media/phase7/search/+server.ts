import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function normalize(text: unknown): string {
	return String(text || '')
		.toLowerCase()
		.replace(/[^a-z0-9\s]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function tokenize(text: string): string[] {
	return normalize(text)
		.split(' ')
		.filter((token) => token.length > 1);
}

function scoreByTokens(tokens: string[], corpus: string): number {
	if (!tokens.length || !corpus) return 0;
	let score = 0;
	for (const token of tokens) {
		if (corpus.includes(token)) score += 1;
	}
	return score;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const query = (url.searchParams.get('q') || '').trim();
	if (!query) {
		return json({ message: 'Query is required' }, { status: 400 });
	}

	try {
		const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 20), 1), 50);
		const tokens = tokenize(query);

		const [assets, summaries, transcripts, detections] = await Promise.all([
			pb
				.collection('media_assets')
				.getList(1, 200, {
					sort: '-created',
					fields: 'id,title,tags,notes,media_category,asset_type,created'
				})
				.then((res) => res.items || []),
			pb
				.collection('media_ai_summaries')
				.getList(1, 200, {
					sort: '-created',
					fields: 'id,asset,summary_text,suggested_title,suggested_tags_json,priority_score,approved,job,created'
				})
				.then((res) => res.items || [])
				.catch(() => []),
			pb
				.collection('media_ai_transcripts')
				.getList(1, 200, {
					sort: '-created',
					fields: 'id,asset,transcript_text'
				})
				.then((res) => res.items || [])
				.catch(() => []),
			pb
				.collection('media_ai_detections')
				.getList(1, 200, {
					sort: '-created',
					fields: 'id,asset,label,detection_type,confidence'
				})
				.then((res) => res.items || [])
				.catch(() => [])
		]);

		const summaryByAsset = new Map<string, any[]>();
		for (const row of summaries as any[]) {
			const existing = summaryByAsset.get(row.asset) || [];
			existing.push(row);
			summaryByAsset.set(row.asset, existing);
		}

		const transcriptByAsset = new Map<string, any[]>();
		for (const row of transcripts as any[]) {
			const existing = transcriptByAsset.get(row.asset) || [];
			existing.push(row);
			transcriptByAsset.set(row.asset, existing);
		}

		const detectionsByAsset = new Map<string, any[]>();
		for (const row of detections as any[]) {
			const existing = detectionsByAsset.get(row.asset) || [];
			existing.push(row);
			detectionsByAsset.set(row.asset, existing);
		}

		const scored = (assets as any[])
			.map((asset: any) => {
				const assetSummaries = summaryByAsset.get(asset.id) || [];
				const assetTranscripts = transcriptByAsset.get(asset.id) || [];
				const assetDetections = detectionsByAsset.get(asset.id) || [];
				const topSummary = assetSummaries[0] || null;

				const summaryText = assetSummaries
					.map((row: any) => [row.summary_text, row.suggested_title, JSON.stringify(row.suggested_tags_json || [])].join(' '))
					.join(' ');
				const transcriptText = assetTranscripts.map((row: any) => row.transcript_text || '').join(' ');
				const detectionText = assetDetections.map((row: any) => `${row.label || ''} ${row.detection_type || ''}`).join(' ');

				const corpus = normalize([
					asset.title,
					asset.tags,
					asset.notes,
					asset.media_category,
					asset.asset_type,
					summaryText,
					transcriptText,
					detectionText
				].join(' '));

				const score = scoreByTokens(tokens, corpus);
				return {
					asset,
					score,
					summaryCount: assetSummaries.length,
					transcriptCount: assetTranscripts.length,
					detectionCount: assetDetections.length,
					topSummary,
					topDetections: assetDetections.slice(0, 5)
				};
			})
			.filter((row: any) => row.score > 0)
			.sort((a: any, b: any) => b.score - a.score)
			.slice(0, limit)
			.map((row: any) => ({
				id: row.asset.id,
				title: row.asset.title,
				media_category: row.asset.media_category,
				asset_type: row.asset.asset_type,
				score: row.score,
				summaryCount: row.summaryCount,
				transcriptCount: row.transcriptCount,
				detectionCount: row.detectionCount,
				created: row.asset.created,
				summaryId: row.topSummary?.id || null,
				summaryText: row.topSummary?.summary_text || '',
				suggestedTitle: row.topSummary?.suggested_title || '',
				suggestedTags: row.topSummary?.suggested_tags_json || [],
				summaryApproved: Boolean(row.topSummary?.approved),
				detections: row.topDetections
			}));

		return json({
			query,
			totalMatches: scored.length,
			items: scored
		});
	} catch (error) {
		console.error('Error searching Phase 7 media index:', error);
		return json({ message: 'Failed to search media index', error: String(error) }, { status: 500 });
	}
};
