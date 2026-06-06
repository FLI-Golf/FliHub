import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(value || 0);
}

function formatHours(totalSeconds: number): string {
	if (!totalSeconds) return '0';
	return (totalSeconds / 3600).toFixed(totalSeconds % 3600 === 0 ? 0 : 1);
}

export const GET: RequestHandler = async ({ locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const [assets, transcripts] = await Promise.all([
			pb.collection('media_assets').getFullList({ sort: '-created' }).catch(() => []),
			pb.collection('media_ai_transcripts').getFullList({ sort: '-created', expand: 'sourceAsset' }).catch(() => []),
		]);

		const totalSeconds = transcripts.reduce((sum: number, record: any) => sum + Number(record.durationSeconds || 0), 0);
		const approvedTranscripts = transcripts.filter((record: any) => (record.status || '').toLowerCase() === 'approved');
		const totalRevenue = transcripts.reduce((sum: number, record: any) => sum + Number(record.estimatedRevenue || 0), 0);
		const totalDownloads = transcripts.reduce((sum: number, record: any) => sum + Number(record.downloadCount || 0), 0);

		const stats = [
			{ label: 'Assets Stored', value: String(assets.length) },
			{ label: 'Hours of Footage', value: formatHours(totalSeconds) },
			{ label: 'Photo Count', value: String(assets.filter((asset: any) => asset.asset_type === 'photo').length) },
			{ label: 'Deliverables Completed', value: String(approvedTranscripts.length) },
			{ label: 'Licensing Revenue', value: formatCurrency(totalRevenue) },
			{ label: 'Downloads', value: String(totalDownloads) },
			{ label: 'Snapshot Date', value: new Intl.DateTimeFormat('en-US').format(new Date()) },
		];

		const latestListings = transcripts.slice(0, 2).map((record: any) => {
			const amount = Number(record.estimatedRevenue || 0);
			const sourceAsset = record.expand?.sourceAsset;

			return {
				title: record.title || record.summary || sourceAsset?.title || 'Untitled transcript',
				status: record.status || 'pending',
				pricing: amount > 0 ? 'flat_fee' : 'n/a',
				amount: formatCurrency(amount),
				requests: Number(record.requestCount || record.downloadCount || 0),
			};
		});

		return json({
			stats,
			latestListings,
			counts: {
				assets: assets.length,
				transcripts: transcripts.length,
				approvedTranscripts: approvedTranscripts.length,
				totalRevenue,
				totalDownloads,
			},
		});
	} catch (error) {
		console.error('Error building Phase 6 summary:', error);
		return json({ message: 'Failed to build Phase 6 summary', error: String(error) }, { status: 500 });
	}
};