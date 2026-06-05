import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

function deriveDeliverableSlaStatus(row: any) {
	if (!row) return 'pending';
	if (row.status === 'approved' || row.status === 'delivered' || row.status === 'cancelled') {
		return row.status;
	}
	const due = row.due_date ? new Date(row.due_date).getTime() : NaN;
	if (!Number.isNaN(due) && due < Date.now()) {
		return 'overdue';
	}
	return row.status || 'pending';
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;
	try {
		
		const [
			assets,
			franchises,
			projects,
			campaigns,
			seasons,
			tournaments,
			specialEvents,
			talents,
			sponsors,
			assetTags,
			assetPeople,
			assetTeams,
			assetSponsors,
			assetEvents,
			assetMarkers,
			rightsProfiles,
			licenseLineItems,
			licenseDeals,
			usageLogs,
			sponsorDeliverables,
			sponsorAppearances,
			sponsorRecapPackages,
			highlightPackageItems,
			highlightPackages,
			mediaCollections
		] = await Promise.all([
			adminFetch('media_assets', {
				sort: '-created'
			}).catch((err: any) => {
				console.error('Failed to fetch media_assets:', err?.message, err?.status);
				return [];
			}),
			pb.collection('franchises').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			pb.collection('projects').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			pb.collection('campaigns').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			pb.collection('seasons').getFullList({ sort: '-created', fields: 'id,name,year' }).catch(() => []),
			pb.collection('tournaments').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			pb.collection('special_events').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			pb.collection('talent').getFullList({ sort: 'lastName,firstName', fields: 'id,firstName,lastName,name,fullName' }).catch(() => []),
			pb.collection('sponsors').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			adminFetch('media_asset_tags').catch(() => []),
			adminFetch('media_asset_people').catch(() => []),
			adminFetch('media_asset_teams').catch(() => []),
			adminFetch('media_asset_sponsors').catch(() => []),
			adminFetch('media_asset_events').catch(() => []),
			adminFetch('media_asset_markers').catch(() => []),
			adminFetch('media_rights_profiles').catch(() => []),
			adminFetch('media_license_line_items').catch(() => []),
			adminFetch('media_license_deals').catch(() => []),
			adminFetch('media_usage_logs').catch(() => []),
			adminFetch('sponsor_media_deliverables').catch(() => []),
			adminFetch('sponsor_media_appearances').catch(() => []),
			adminFetch('sponsor_recap_packages').catch(() => []),
			adminFetch('highlight_package_items').catch(() => []),
			adminFetch('highlight_packages').catch(() => []),
			adminFetch('media_collections').catch(() => [])
		]);

		const assetTagMap = new Map<string, any[]>();
		const assetPeopleMap = new Map<string, any[]>();
		const assetTeamsMap = new Map<string, any[]>();
		const assetSponsorsMap = new Map<string, any[]>();
		const assetEventMap = new Map<string, any>();
		const assetMarkerMap = new Map<string, any[]>();
		const assetRightsMap = new Map<string, any[]>();
		const assetLineItemsMap = new Map<string, any[]>();
		const assetUsageMap = new Map<string, any[]>();
		const assetDeliverablesMap = new Map<string, any[]>();
		const assetAppearancesMap = new Map<string, any[]>();
		const assetHighlightItemsMap = new Map<string, any[]>();

		for (const row of assetTags as any[]) {
			const list = assetTagMap.get(row.asset) || [];
			list.push(row);
			assetTagMap.set(row.asset, list);
		}

		for (const row of assetPeople as any[]) {
			const list = assetPeopleMap.get(row.asset) || [];
			list.push(row);
			assetPeopleMap.set(row.asset, list);
		}

		for (const row of assetTeams as any[]) {
			const list = assetTeamsMap.get(row.asset) || [];
			list.push(row);
			assetTeamsMap.set(row.asset, list);
		}

		for (const row of assetSponsors as any[]) {
			const list = assetSponsorsMap.get(row.asset) || [];
			list.push(row);
			assetSponsorsMap.set(row.asset, list);
		}

		for (const row of assetEvents as any[]) {
			if (!assetEventMap.has(row.asset)) {
				assetEventMap.set(row.asset, row);
			}
		}

		for (const row of assetMarkers as any[]) {
			const list = assetMarkerMap.get(row.asset) || [];
			list.push(row);
			assetMarkerMap.set(row.asset, list);
		}

		for (const row of rightsProfiles as any[]) {
			const list = assetRightsMap.get(row.asset) || [];
			list.push(row);
			assetRightsMap.set(row.asset, list);
		}

		for (const row of licenseLineItems as any[]) {
			const list = assetLineItemsMap.get(row.asset) || [];
			list.push(row);
			assetLineItemsMap.set(row.asset, list);
		}

		for (const row of usageLogs as any[]) {
			const list = assetUsageMap.get(row.asset) || [];
			list.push(row);
			assetUsageMap.set(row.asset, list);
		}

		for (const row of sponsorDeliverables as any[]) {
			if (!row.asset) continue;
			const list = assetDeliverablesMap.get(row.asset) || [];
			list.push(row);
			assetDeliverablesMap.set(row.asset, list);
		}

		for (const row of sponsorAppearances as any[]) {
			const list = assetAppearancesMap.get(row.asset) || [];
			list.push(row);
			assetAppearancesMap.set(row.asset, list);
		}

		for (const row of highlightPackageItems as any[]) {
			if (!row.asset) continue;
			const list = assetHighlightItemsMap.get(row.asset) || [];
			list.push(row);
			assetHighlightItemsMap.set(row.asset, list);
		}

		const dealsById = new Map((licenseDeals as any[]).map((item) => [item.id, item]));
		const recapById = new Map((sponsorRecapPackages as any[]).map((item) => [item.id, item]));
		const highlightPackagesById = new Map((highlightPackages as any[]).map((item) => [item.id, item]));
		const mediaCollectionsById = new Map((mediaCollections as any[]).map((item) => [item.id, item]));
		const assetsById = new Map((assets as any[]).map((item) => [item.id, item]));

		const talentsById = new Map((talents as any[]).map((item) => [item.id, item]));
		const sponsorsById = new Map((sponsors as any[]).map((item) => [item.id, item]));

		const enrichedAssets = (assets as any[]).map((asset) => {
			const peopleRows = (assetPeopleMap.get(asset.id) || []).map((row) => ({
				...row,
				personRecord: talentsById.get(row.person) || null
			}));

			const sponsorRows = (assetSponsorsMap.get(asset.id) || []).map((row) => ({
				...row,
				sponsorRecord: sponsorsById.get(row.sponsor) || null
			}));

			const lineItemRows = (assetLineItemsMap.get(asset.id) || []).map((row) => ({
				...row,
				dealRecord: dealsById.get(row.deal) || null
			}));

			const usageRows = (assetUsageMap.get(asset.id) || []).map((row) => ({
				...row,
				dealRecord: row.deal ? dealsById.get(row.deal) || null : null
			}));

			const deliverableRows = (assetDeliverablesMap.get(asset.id) || []).map((row) => ({
				...row,
				sla_status: deriveDeliverableSlaStatus(row),
				sponsorRecord: row.sponsor ? sponsorsById.get(row.sponsor) || null : null,
				recapPackageRecord: row.recap_package ? recapById.get(row.recap_package) || null : null
			}));

			const appearanceRows = (assetAppearancesMap.get(asset.id) || []).map((row) => ({
				...row,
				sponsorRecord: row.sponsor ? sponsorsById.get(row.sponsor) || null : null
			}));

			const highlightRows = (assetHighlightItemsMap.get(asset.id) || []).map((row) => ({
				...row,
				packageRecord: row.highlight_package ? highlightPackagesById.get(row.highlight_package) || null : null,
				collectionRecord: row.media_collection ? mediaCollectionsById.get(row.media_collection) || null : null
			}));

			return {
				...asset,
				taxonomy: {
					tags: assetTagMap.get(asset.id) || [],
					people: peopleRows,
					teams: assetTeamsMap.get(asset.id) || [],
					sponsors: sponsorRows,
					event: assetEventMap.get(asset.id) || null,
					markers: assetMarkerMap.get(asset.id) || []
				},
				licensing: {
					rightsProfiles: assetRightsMap.get(asset.id) || [],
					lineItems: lineItemRows,
					usageLogs: usageRows
				},
				sponsorFulfillment: {
					deliverables: deliverableRows,
					appearances: appearanceRows,
					recapPackages: deliverableRows
						.map((row: any) => row.recapPackageRecord)
						.filter(Boolean)
				},
				highlightPackaging: {
					items: highlightRows,
					packages: highlightRows
						.map((row: any) => row.packageRecord)
						.filter(Boolean)
				}
			};
		});

		const enrichedHighlightItems = (highlightPackageItems as any[]).map((row: any) => ({
			...row,
			assetRecord: row.asset ? assetsById.get(row.asset) || null : null,
			packageRecord: row.highlight_package ? highlightPackagesById.get(row.highlight_package) || null : null,
			collectionRecord: row.media_collection ? mediaCollectionsById.get(row.media_collection) || null : null
		}));
	
		// Pass PocketBase URL and auth token to the client so uploads go directly
		// to PocketBase, bypassing Netlify's 1MB function body limit.
		const pbUrl = env.POCKETBASE_URL || 'http://127.0.0.1:8090';
		const authToken = locals.pb.authStore.token || '';
	
		return {
			assets: enrichedAssets,
			highlightPackages,
			mediaCollections,
			highlightPackageItems: enrichedHighlightItems,
			franchises,
			projects,
			campaigns,
			seasons,
			tournaments,
			specialEvents,
			talents,
			sponsors,
			pbUrl,
			authToken
		};
	} catch (err: any) {
		console.error('media load error:', err?.message ?? err);
		return {};
	}
};
