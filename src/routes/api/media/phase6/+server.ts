import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

function toNumber(value: unknown): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

async function safeList(
	pb: any,
	collection: string,
	page: number,
	perPage: number,
	options: { sort?: string; fields?: string }
) {
	try {
		return await pb.collection(collection).getList(page, perPage, options);
	} catch {
		try {
			const { sort } = options;
			return await pb.collection(collection).getList(page, perPage, sort ? { sort } : {});
		} catch {
			return await pb.collection(collection).getList(page, perPage);
		}
	}
}

export const GET: RequestHandler = async ({ locals }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const pb = ctx.pb;

	try {
		const [latestSnapshot, listings, requests, audits] = await Promise.all([
			safeList(pb, 'media_dashboard_snapshots', 1, 1, {
				sort: '-snapshot_date',
				fields:
					'id,snapshot_date,total_assets_stored,hours_of_footage,photo_count,sponsor_deliverables_completed,licensing_revenue,downloads,most_used_assets_json,assets_by_season_json'
			})
				.then((res: any) => res.items?.[0] || null)
				.catch(() => null),
			safeList(pb, 'media_marketplace_listings', 1, 6, {
				sort: '-created',
				fields: 'id,title,listing_status,pricing_model,asking_price,currency,license_scope,created'
			})
				.then((res: any) => res.items || [])
				.catch(() => []),
			safeList(pb, 'media_purchase_requests', 1, 200, {
				sort: '-created',
				fields: 'id,listing,request_status,offered_price,created'
			})
				.then((res: any) => res.items || [])
				.catch(() => []),
			safeList(pb, 'media_download_audits', 1, 200, {
				sort: '-downloaded_at',
				fields: 'id,status,downloaded_at'
			})
				.then((res: any) => res.items || [])
				.catch(() => [])
		]);

		let computedTotalAssets = toNumber(latestSnapshot?.total_assets_stored);
		let computedHoursOfFootage = toNumber(latestSnapshot?.hours_of_footage);
		let computedPhotoCount = toNumber(latestSnapshot?.photo_count);
		let computedSponsorDeliverablesCompleted = toNumber(latestSnapshot?.sponsor_deliverables_completed);

		if (!latestSnapshot) {
			const [assets, deliverables] = await Promise.all([
				pb
					.collection('media_assets')
					.getList(1, 500, {
						fields: 'id,asset_type,media_category,duration_seconds'
					})
					.then((res) => res.items || [])
					.catch(() => []),
				pb
					.collection('sponsor_media_deliverables')
					.getList(1, 500, {
						fields: 'id,status'
					})
					.then((res) => res.items || [])
					.catch(() => [])
			]);

			computedTotalAssets = assets.length;
			computedHoursOfFootage =
				assets
					.filter((asset: any) => asset.asset_type === 'video' || asset.media_category === 'video')
					.reduce((sum: number, asset: any) => sum + toNumber(asset.duration_seconds), 0) / 3600;
			computedPhotoCount = assets.filter((asset: any) => asset.asset_type === 'photo' || asset.media_category === 'photo').length;
			computedSponsorDeliverablesCompleted = deliverables.filter((row: any) => row.status === 'delivered' || row.status === 'approved').length;
		}

		const listingRequestMap = new Map<string, any[]>();
		for (const request of requests as any[]) {
			if (!request.listing) continue;
			const existing = listingRequestMap.get(request.listing) || [];
			existing.push(request);
			listingRequestMap.set(request.listing, existing);
		}

		const enrichedListings = (listings as any[]).map((listing: any) => {
			const listingRequests = listingRequestMap.get(listing.id) || [];
			return {
				...listing,
				request_count: listingRequests.length,
				latest_request_status: listingRequests[0]?.request_status || null
			};
		});

		const fulfilledOrApprovedRevenue = (requests as any[]).reduce((sum: number, row: any) => {
			if (row.request_status !== 'fulfilled' && row.request_status !== 'approved') {
				return sum;
			}
			return sum + toNumber(row.offered_price);
		}, 0);

		const completedDownloads = (audits as any[]).filter((row: any) => row.status === 'completed').length;

		return json({
			metrics: {
				snapshot_date: latestSnapshot?.snapshot_date || null,
				total_assets_stored: computedTotalAssets,
				hours_of_footage: Number(computedHoursOfFootage.toFixed(2)),
				photo_count: computedPhotoCount,
				sponsor_deliverables_completed: computedSponsorDeliverablesCompleted,
				licensing_revenue: latestSnapshot ? toNumber(latestSnapshot.licensing_revenue) : fulfilledOrApprovedRevenue,
				downloads: latestSnapshot ? toNumber(latestSnapshot.downloads) : completedDownloads
			},
			latestListings: enrichedListings,
			recentRequests: (requests as any[]).slice(0, 5),
			hasSnapshot: Boolean(latestSnapshot)
		});
	} catch (error) {
		console.error('Error loading Phase 6 media summary:', error);
		return json({ message: 'Failed to load Phase 6 media summary', error: String(error) }, { status: 500 });
	}
};
