import path from 'path';
import dotenv from 'dotenv';
import PocketBase from 'pocketbase';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

const ROUND_TYPES = ['round_1', 'round_2', 'final_round'];
const SHOT_TYPES = ['drive', 'approach', 'putt', 'chip'];
const MOMENT_TYPES = ['crowd_reaction', 'interview_segment', 'award_ceremony', 'sponsor_activation'];
const TAGS = [
	['championship', 'crowd reaction', 'feature clip'],
	['player profile', 'broadcast angle', 'tight lie'],
	['sponsor wall', 'fan energy', 'on course'],
	['post round', 'interview', 'analysis'],
	['final putt', 'walkoff', 'celebration']
];

async function auth() {
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';

	if (!email || !password) {
		throw new Error('Missing PocketBase admin credentials in .env');
	}

	await pb.admins.authWithPassword(email, password);
}

async function safeList(collection: string, options: Record<string, any> = {}) {
	try {
		const page = await pb.collection(collection).getList(1, 200, options);
		return page.items || [];
	} catch {
		return [];
	}
}

async function clearByAsset(collection: string, assetId: string) {
	const rows = await pb.collection(collection).getFullList({
		filter: `asset = "${assetId}"`,
		fields: 'id'
	}).catch(() => []);

	for (const row of rows) {
		await pb.collection(collection).delete(row.id).catch(() => undefined);
	}
}

function nonEmpty<T>(value: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}

async function main() {
	await auth();

	const [assets, talent, sponsors, franchises, seasons, tournaments, specialEvents] = await Promise.all([
		safeList('media_assets', { sort: '-created', fields: 'id,title,media_category,season,tournament,special_event,franchise' }),
		safeList('talent', { sort: 'lastName,firstName', fields: 'id' }),
		safeList('sponsors', { sort: 'name', fields: 'id' }),
		safeList('franchises', { sort: 'name', fields: 'id' }),
		safeList('seasons', { sort: '-created', fields: 'id' }),
		safeList('tournaments', { sort: 'name', fields: 'id' }),
		safeList('special_events', { sort: 'name', fields: 'id' })
	]);

	if (!assets.length) {
		console.log('No media assets found. Run the Phase 1 media seed first.');
		return;
	}

	const targetAssets = assets.slice(0, Math.min(5, assets.length));

	for (let i = 0; i < targetAssets.length; i += 1) {
		const asset = targetAssets[i];
		const tags = TAGS[i % TAGS.length];
		const personIds = [talent[i % (talent.length || 1)]?.id, talent[(i + 1) % (talent.length || 1)]?.id].filter(nonEmpty);
		const sponsorIds = [sponsors[i % (sponsors.length || 1)]?.id].filter(nonEmpty);
		const teamIds = [asset.franchise || franchises[i % (franchises.length || 1)]?.id].filter(nonEmpty);

		await clearByAsset('media_asset_tags', asset.id);
		await clearByAsset('media_asset_people', asset.id);
		await clearByAsset('media_asset_teams', asset.id);
		await clearByAsset('media_asset_sponsors', asset.id);
		await clearByAsset('media_asset_events', asset.id);
		await clearByAsset('media_asset_markers', asset.id);

		for (const tag of tags) {
			await pb.collection('media_asset_tags').create({
				asset: asset.id,
				tag,
				domain: 'competition'
			});
		}

		for (const personId of personIds) {
			await pb.collection('media_asset_people').create({
				asset: asset.id,
				person: personId,
				role: 'player',
				is_primary: false
			});
		}

		for (const teamId of teamIds) {
			await pb.collection('media_asset_teams').create({
				asset: asset.id,
				team: teamId,
				context: 'featured'
			});
		}

		for (const sponsorId of sponsorIds) {
			await pb.collection('media_asset_sponsors').create({
				asset: asset.id,
				sponsor: sponsorId,
				visibility: 'clear'
			});
		}

		await pb.collection('media_asset_events').create({
			asset: asset.id,
			season: asset.season || seasons[0]?.id || null,
			tournament: asset.tournament || tournaments[0]?.id || null,
			special_event: asset.special_event || specialEvents[0]?.id || null,
			hole_number: ((i % 18) + 1),
			round_type: ROUND_TYPES[i % ROUND_TYPES.length],
			shot_type: SHOT_TYPES[i % SHOT_TYPES.length],
			moment_type: MOMENT_TYPES[i % MOMENT_TYPES.length]
		});

		if (asset.media_category === 'video' || asset.media_category === 'highlight' || asset.media_category === 'broadcast_segment') {
			await pb.collection('media_asset_markers').create({
				asset: asset.id,
				marker_type: 'segment',
				start_seconds: 5,
				end_seconds: 22,
				label: 'Feature moment',
				description: 'Seeded highlight segment for Phase 2 testing.'
			});
		}

		console.log(`Seeded Phase 2 metadata for asset: ${asset.title}`);
	}

	console.log(`Done. Seeded ${targetAssets.length} assets with Phase 2 taxonomy links.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});
