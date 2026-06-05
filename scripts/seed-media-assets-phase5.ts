import path from 'path';
import dotenv from 'dotenv';
import PocketBase from 'pocketbase';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function requestJson(url: string, options: RequestInit = {}) {
	const response = await fetch(url, options);
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(`${response.status} ${JSON.stringify(payload)}`);
	}
	return payload;
}

async function auth() {
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';
	if (!email || !password) {
		throw new Error('Missing PocketBase admin credentials in .env');
	}
	await pb.admins.authWithPassword(email, password);
}

async function fetchAssetsViaRest() {
	const url = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';
	const baseUrl = url.replace(/\/$/, '');

	const authRes = await requestJson(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identity: email, password })
	});

	const records = await requestJson(`${baseUrl}/api/collections/media_assets/records?page=1&perPage=200`, {
		headers: { Authorization: authRes.token }
	});

	return records.items || [];
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

async function main() {
	await auth();

	const [assets, seasons, tournaments, specialEvents] = await Promise.all([
		fetchAssetsViaRest(),
		pb.collection('seasons').getFullList({ sort: '-created', fields: 'id,name' }).catch(() => []),
		pb.collection('tournaments').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
		pb.collection('special_events').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => [])
	]);

	if (!assets.length) {
		console.log('Need at least one media asset to seed Phase 5.');
		return;
	}

	const targetAssets = assets.slice(0, Math.min(6, assets.length));

	const mediaCollection = await pb.collection('media_collections').create({
		name: `Weekly Highlight Queue ${new Date().toISOString().slice(0, 10)}`,
		collection_type: 'event_recap',
		season: seasons[0]?.id || null,
		tournament: tournaments[0]?.id || null,
		special_event: specialEvents[0]?.id || null,
		status: 'curating',
		owner: 'media_ops',
		notes: 'Seeded Phase 5 collection for highlight packaging.'
	});

	const highlightPackage = await pb.collection('highlight_packages').create({
		name: `Phase 5 Highlight Package ${new Date().toISOString().slice(0, 10)}`,
		package_type: 'event_recap',
		status: 'review',
		export_target: 'social',
		approval_status: 'pending',
		manifest_json: {
			version: 1,
			source: 'seed-media-assets-phase5',
			exportPreset: 'social-1080x1920'
		},
		notes: 'Seed package for Phase 5 QA.'
	});

	for (let i = 0; i < targetAssets.length; i += 1) {
		const asset = targetAssets[i];
		await clearByAsset('highlight_package_items', asset.id);

		await pb.collection('highlight_package_items').create({
			highlight_package: highlightPackage.id,
			media_collection: mediaCollection.id,
			asset: asset.id,
			clip_in_seconds: i * 4,
			clip_out_seconds: i * 4 + 18,
			sort_order: i,
			usage_role: i === 0 ? 'opening' : i === targetAssets.length - 1 ? 'closing' : 'feature',
			notes: 'Seeded Phase 5 package item.'
		});

		console.log(`Seeded highlight package item for: ${asset.title}`);
	}

	console.log(`Done. Seeded Phase 5 package data for ${targetAssets.length} assets.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});
