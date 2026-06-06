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

async function auth() {
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';
	if (!email || !password) {
		throw new Error('Missing PocketBase admin credentials in .env');
	}
	await pb.admins.authWithPassword(email, password);
}

async function main() {
	await auth();

	const [assets, packages, mediaCollections, seasons] = await Promise.all([
		fetchAssetsViaRest(),
		pb.collection('highlight_packages').getFullList({ sort: '-created', fields: 'id,name' }).catch(() => []),
		pb.collection('media_collections').getFullList({ sort: '-created', fields: 'id,name' }).catch(() => []),
		pb.collection('seasons').getFullList({ sort: '-created', fields: 'id,name' }).catch(() => [])
	]);

	if (!assets.length) {
		console.log('Need at least one media asset to seed Phase 6.');
		return;
	}

	const now = new Date();
	const nowIso = now.toISOString();
	const nextWeekIso = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
	const targetAsset = assets[0];
	const targetPackage = packages[0] || null;
	const targetCollection = mediaCollections[0] || null;

	const listing = await pb.collection('media_marketplace_listings').create({
		title: `Phase 6 Listing ${nowIso.slice(0, 10)}`,
		highlight_package: targetPackage?.id || null,
		media_collection: targetCollection?.id || null,
		primary_asset: targetAsset.id,
		listing_status: 'active',
		pricing_model: 'flat_fee',
		asking_price: 3500,
		currency: 'USD',
		license_scope: 'single_use',
		approved_buyer_types: ['sponsor', 'broadcaster'],
		available_from: nowIso,
		expires_at: nextWeekIso,
		rights_summary: 'Single-use campaign license for approved buyers.',
		notes: 'Seeded from seed-media-assets-phase6.ts'
	});

	const purchaseRequest = await pb.collection('media_purchase_requests').create({
		listing: listing.id,
		buyer_name: 'Demo Buyer',
		buyer_email: 'buyer@example.com',
		buyer_organization: 'Demo Sports Network',
		request_status: 'submitted',
		intended_use: 'broadcast',
		offered_price: 3200,
		requested_terms: 'Request includes 30-day usage window and one revision.',
		notes: 'Seeded purchase request for marketplace QA.'
	});

	await pb.collection('media_download_audits').create({
		listing: listing.id,
		purchase_request: purchaseRequest.id,
		highlight_package: targetPackage?.id || null,
		asset: targetAsset.id,
		downloaded_by: 'media.ops@fli.example',
		downloader_organization: 'FLI Internal',
		download_source: 'marketplace',
		usage_context: 'evaluation',
		file_variant: '1080p-h264',
		bytes_served: 104857600,
		ip_hash: 'seed-ip-hash',
		downloaded_at: nowIso,
		status: 'completed'
	});

	const totalVideoHours = assets
		.filter((asset: any) => asset.asset_type === 'video')
		.reduce((sum: number, asset: any) => sum + (asset.duration_seconds || 0), 0) / 3600;

	const snapshotPayload = {
		snapshot_date: nowIso,
		total_assets_stored: assets.length,
		hours_of_footage: Number(totalVideoHours.toFixed(2)),
		photo_count: assets.filter((asset: any) => asset.asset_type === 'photo').length,
		most_used_assets_json: [{ id: targetAsset.id, title: targetAsset.title || 'Untitled', downloads: 1 }],
		assets_by_season_json: [{ season: seasons[0]?.name || 'Unknown', count: assets.length }],
		sponsor_deliverables_completed: 0,
		licensing_revenue: 3200,
		downloads: 1,
		top_players_by_media_value_json: [],
		top_teams_by_media_value_json: [],
		notes: 'Phase 6 baseline dashboard snapshot.'
	};

	const existingSnapshot = await pb.collection('media_dashboard_snapshots').getFirstListItem(
		`snapshot_date = "${nowIso}"`,
		{ fields: 'id,snapshot_date' }
	).catch(() => null);

	if (existingSnapshot?.id) {
		await pb.collection('media_dashboard_snapshots').update(existingSnapshot.id, snapshotPayload);
	} else {
		await pb.collection('media_dashboard_snapshots').create(snapshotPayload);
	}

	console.log(`Done. Seeded Phase 6 data for listing ${listing.id}.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});
