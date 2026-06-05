import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const assetType = url.searchParams.get('asset_type') || '';
		const mediaCategory = url.searchParams.get('media_category') || '';
		const sourceType = url.searchParams.get('source_type') || '';
		const seasonId = url.searchParams.get('season') || '';
		const tournamentId = url.searchParams.get('tournament') || '';
		const specialEventId = url.searchParams.get('special_event') || '';
		const status = url.searchParams.get('status') || '';
		const usageScope = url.searchParams.get('usage_scope') || '';
		const rightsStatus = url.searchParams.get('rights_status') || '';
		const franchiseId = url.searchParams.get('franchise') || '';
		const projectId = url.searchParams.get('project') || '';
		const campaignId = url.searchParams.get('campaign') || '';

		const filters: string[] = [];
		if (assetType)   filters.push(`asset_type = "${assetType}"`);
		if (mediaCategory) filters.push(`media_category = "${mediaCategory}"`);
		if (sourceType) filters.push(`source_type = "${sourceType}"`);
		if (seasonId) filters.push(`season = "${seasonId}"`);
		if (tournamentId) filters.push(`tournament = "${tournamentId}"`);
		if (specialEventId) filters.push(`special_event = "${specialEventId}"`);
		if (status) filters.push(`status = "${status}"`);
		if (usageScope) filters.push(`usage_scope = "${usageScope}"`);
		if (rightsStatus) filters.push(`rights_status = "${rightsStatus}"`);
		if (franchiseId) filters.push(`franchise = "${franchiseId}"`);
		if (projectId)   filters.push(`project = "${projectId}"`);
		if (campaignId)  filters.push(`campaign = "${campaignId}"`);

		const assets = await pb.collection('media_assets').getFullList({
			sort: '-created',
			filter: filters.join(' && ') || ''
		});

		return json(assets);
	} catch (error) {
		console.error('Error fetching media assets:', error);
		return json({ message: 'Failed to fetch media assets', error: String(error) }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		// File uploads require FormData, not JSON
		const formData = await request.formData();

		const asset = await pb.collection('media_assets').create(formData);

		return json(asset, { status: 201 });
	} catch (error) {
		console.error('Error uploading media asset:', error);
		return json({ message: 'Failed to upload media asset', error: String(error) }, { status: 500 });
	}
};
