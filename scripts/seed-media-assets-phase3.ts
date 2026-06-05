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
	const assets = await fetchAssetsViaRest();

	if (!assets.length) {
		console.log('No media assets found. Seed media assets first.');
		return;
	}

	const targets = assets.slice(0, Math.min(3, assets.length));

	for (let i = 0; i < targets.length; i += 1) {
		const asset = targets[i];
		await clearByAsset('media_rights_profiles', asset.id);
		await clearByAsset('media_usage_logs', asset.id);

		const rights = await pb.collection('media_rights_profiles').create({
			asset: asset.id,
			rights_owner: 'FLI Golf League',
			usage_type: i % 2 === 0 ? 'broadcast' : 'commercial',
			territory: 'North America',
			channel: i % 2 === 0 ? 'linear_tv' : 'social',
			exclusive: i % 2 === 0,
			start_date: new Date().toISOString(),
			expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
			restrictions: 'No third-party resale without written consent.',
			contract_reference: `MAM-RIGHTS-${asset.id.slice(0, 6)}`,
			status: 'active'
		});

		const deal = await pb.collection('media_license_deals').create({
			name: `Media License Deal ${asset.title}`,
			licensee: i % 2 === 0 ? 'Regional Sports Network' : 'Brand Partner Media',
			usage_type: i % 2 === 0 ? 'broadcast' : 'sponsor',
			territory: 'North America',
			channel: i % 2 === 0 ? 'linear_tv' : 'social',
			exclusive: false,
			start_date: new Date().toISOString(),
			expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
			fee_amount: 15000 + i * 5000,
			currency: 'USD',
			payment_status: 'invoiced',
			contract_reference: `MAM-DEAL-${asset.id.slice(0, 6)}`,
			notes: `Seeded Phase 3 deal for ${asset.title}`
		});

		await pb.collection('media_license_line_items').create({
			deal: deal.id,
			asset: asset.id,
			usage_type: deal.usage_type,
			fee_amount: deal.fee_amount,
			revenue_share_pct: 20,
			restrictions: 'League approval required for derivative edits.'
		});

		await pb.collection('media_usage_logs').create({
			asset: asset.id,
			deal: deal.id,
			used_by: deal.licensee,
			channel: deal.channel,
			territory: 'North America',
			usage_date: new Date().toISOString(),
			usage_context: 'Phase 3 seeded distribution event',
			impression_count: 50000 + i * 10000,
			revenue_attributed: 2500 + i * 750,
			notes: `Linked rights profile ${rights.id}`
		});

		console.log(`Seeded Phase 3 rights/deal/log for asset: ${asset.title}`);
	}

	console.log(`Done. Seeded Phase 3 data for ${targets.length} assets.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});
