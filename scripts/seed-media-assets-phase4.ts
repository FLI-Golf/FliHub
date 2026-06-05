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

async function ensureSponsor() {
	const sponsors = await pb.collection('sponsors').getFullList({ sort: 'name', fields: 'id,name,companyName' }).catch(() => []);
	if (sponsors.length) {
		return sponsors[0];
	}

	const fallback = await pb.collection('sponsors').create({
		companyName: 'Phase 4 Seed Sponsor',
		type: 'casino',
		tier: 'tier_4',
		status: 'active',
		primaryContactName: 'Phase 4 QA',
		primaryContactEmail: 'phase4-seed@example.com',
		location: 'Test Market',
		territory: 'National',
		currentYear: new Date().getFullYear(),
		annualCommitment: 100000,
		totalPaid: 100000,
		franchiseInterest: false,
		notes: 'Auto-created fallback sponsor for Phase 4 media seed.'
	});

	return fallback;
}

async function main() {
	await auth();

	const [assets, targetSponsor, seasons, tournaments, specialEvents] = await Promise.all([
		fetchAssetsViaRest(),
		ensureSponsor(),
		pb.collection('seasons').getFullList({ sort: '-created', fields: 'id,name' }).catch(() => []),
		pb.collection('tournaments').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
		pb.collection('special_events').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => [])
	]);

	if (!assets.length) {
		console.log('Need at least one media asset to seed Phase 4.');
		return;
	}

	const targetAssets = assets.slice(0, Math.min(4, assets.length));

	for (let i = 0; i < targetAssets.length; i += 1) {
		const asset = targetAssets[i];
		await clearByAsset('sponsor_media_deliverables', asset.id);
		await clearByAsset('sponsor_media_appearances', asset.id);

		const recapPackage = await pb.collection('sponsor_recap_packages').create({
			sponsor: targetSponsor.id,
			package_name: `Recap Package - ${asset.title}`,
			season: seasons[0]?.id || null,
			tournament: tournaments[0]?.id || null,
			special_event: specialEvents[0]?.id || null,
			status: i % 2 === 0 ? 'ready' : 'in_progress',
			delivered_at: i % 2 === 0 ? new Date().toISOString() : null,
			proof_url: 'https://example.com/sponsor-recap-proof',
			notes: 'Seeded for Phase 4 QA.'
		});

		const deliverable = await pb.collection('sponsor_media_deliverables').create({
			sponsor: targetSponsor.id,
			asset: asset.id,
			recap_package: recapPackage.id,
			deliverable_type: i % 2 === 0 ? 'highlight_clip' : 'logo_exposure',
			obligation_reference: `SOW-${String(i + 1).padStart(3, '0')}`,
			status: i % 2 === 0 ? 'delivered' : 'in_progress',
			due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
			delivered_at: i % 2 === 0 ? new Date().toISOString() : null,
			visibility_score: 70 + i * 5,
			proof_note: 'Broadcast recap and sponsor logo proof included.'
		});

		await pb.collection('sponsor_media_appearances').create({
			asset: asset.id,
			sponsor: targetSponsor.id,
			deliverable: deliverable.id,
			logo_visibility: i % 2 === 0 ? 'hero' : 'clear',
			placement: i % 2 === 0 ? 'Lower-third bug' : 'Back wall banner',
			timestamp_seconds: 12 + i * 8,
			screenshot_url: 'https://example.com/sponsor-appearance-screenshot',
			verified: true,
			notes: 'Seeded appearance record for sponsor proof.'
		});

		console.log(`Seeded sponsor deliverable + appearance for: ${asset.title}`);
	}

	console.log(`Done. Seeded Phase 4 data for ${targetAssets.length} assets.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});
