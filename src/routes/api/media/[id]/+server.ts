import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function hasOwn(data: Record<string, any>, key: string) {
	return Object.prototype.hasOwnProperty.call(data, key);
}

async function replaceRelationRows(
	pb: any,
	collection: string,
	assetId: string,
	rows: Array<Record<string, any>>
) {
	const existing = await pb.collection(collection).getFullList({
		filter: `asset = "${assetId}"`,
		fields: 'id'
	}).catch(() => []);

	for (const row of existing) {
		await pb.collection(collection).delete(row.id).catch(() => undefined);
	}

	for (const row of rows) {
		await pb.collection(collection).create({ asset: assetId, ...row });
	}
}

async function loadAssetTaxonomy(pb: any, assetId: string) {
	const [tags, people, teams, sponsors, events, markers] = await Promise.all([
		pb.collection('media_asset_tags').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_asset_people').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_asset_teams').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_asset_sponsors').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_asset_events').getFullList({ filter: `asset = "${assetId}"` }).catch(() => []),
		pb.collection('media_asset_markers').getFullList({ filter: `asset = "${assetId}"` }).catch(() => [])
	]);

	return {
		tags,
		people,
		teams,
		sponsors,
		event: events[0] || null,
		markers
	};
}

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		const updatePayload: Record<string, any> = {};

		if (hasOwn(data, 'title')) updatePayload.title = data.title;
		if (hasOwn(data, 'asset_type')) updatePayload.asset_type = data.asset_type;
		if (hasOwn(data, 'media_category')) updatePayload.media_category = data.media_category || null;
		if (hasOwn(data, 'franchise')) updatePayload.franchise = data.franchise || null;
		if (hasOwn(data, 'project')) updatePayload.project = data.project || null;
		if (hasOwn(data, 'campaign')) updatePayload.campaign = data.campaign || null;
		if (hasOwn(data, 'season')) updatePayload.season = data.season || null;
		if (hasOwn(data, 'tournament')) updatePayload.tournament = data.tournament || null;
		if (hasOwn(data, 'special_event')) updatePayload.special_event = data.special_event || null;
		if (hasOwn(data, 'source_type')) updatePayload.source_type = data.source_type || null;
		if (hasOwn(data, 'capture_date')) updatePayload.capture_date = data.capture_date || null;
		if (hasOwn(data, 'duration_seconds')) updatePayload.duration_seconds = data.duration_seconds ? Number(data.duration_seconds) : null;
		if (hasOwn(data, 'file_size_bytes')) updatePayload.file_size_bytes = data.file_size_bytes ? Number(data.file_size_bytes) : null;
		if (hasOwn(data, 'resolution')) updatePayload.resolution = data.resolution || '';
		if (hasOwn(data, 'status')) updatePayload.status = data.status || null;
		if (hasOwn(data, 'storage_tier')) updatePayload.storage_tier = data.storage_tier || null;
		if (hasOwn(data, 'usage_scope')) updatePayload.usage_scope = data.usage_scope || null;
		if (hasOwn(data, 'rights_status')) updatePayload.rights_status = data.rights_status || null;
		if (hasOwn(data, 'tags')) updatePayload.tags = data.tags || '';
		if (hasOwn(data, 'notes')) updatePayload.notes = data.notes || '';

		const asset = Object.keys(updatePayload).length
			? await pb.collection('media_assets').update(params.id, updatePayload)
			: await pb.collection('media_assets').getOne(params.id);

		if (data.phase2Meta) {
			const phase2 = data.phase2Meta || {};

			const parsedTags = String(phase2.structured_tags || '')
				.split(',')
				.map((value: string) => value.trim())
				.filter(Boolean)
				.map((tag: string) => ({ tag, domain: phase2.tag_domain || 'general' }));

			const peopleRows = (phase2.people_ids || []).map((person: string) => ({
				person,
				role: 'player',
				is_primary: false
			}));

			const teamRows = (phase2.team_ids || []).map((team: string) => ({
				team,
				context: 'featured'
			}));

			const sponsorRows = (phase2.sponsor_ids || []).map((sponsor: string) => ({
				sponsor,
				visibility: 'clear'
			}));

			const eventRows = (phase2.round_type || phase2.shot_type || phase2.moment_type || phase2.hole_number)
				? [{
					season: phase2.season || asset.season || null,
					tournament: phase2.tournament || asset.tournament || null,
					special_event: phase2.special_event || asset.special_event || null,
					hole_number: phase2.hole_number ? Number(phase2.hole_number) : null,
					round_type: phase2.round_type || null,
					shot_type: phase2.shot_type || null,
					moment_type: phase2.moment_type || null
				}]
				: [];

			await replaceRelationRows(pb, 'media_asset_tags', params.id, parsedTags);
			await replaceRelationRows(pb, 'media_asset_people', params.id, peopleRows);
			await replaceRelationRows(pb, 'media_asset_teams', params.id, teamRows);
			await replaceRelationRows(pb, 'media_asset_sponsors', params.id, sponsorRows);
			await replaceRelationRows(pb, 'media_asset_events', params.id, eventRows);
		}

		const taxonomy = await loadAssetTaxonomy(pb, params.id);

		return json({ ...asset, taxonomy });
	} catch (error) {
		console.error('Error updating media asset:', error);
		return json({ message: 'Failed to update media asset', error: String(error) }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		await pb.collection('media_assets').delete(params.id);
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting media asset:', error);
		return json({ message: 'Failed to delete media asset', error: String(error) }, { status: 500 });
	}
};
