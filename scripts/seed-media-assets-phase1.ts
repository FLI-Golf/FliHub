import path from 'path';
import dotenv from 'dotenv';
import PocketBase from 'pocketbase';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

type RefIds = {
	franchise?: string;
	project?: string;
	campaign?: string;
	season?: string;
	tournament?: string;
	special_event?: string;
};

type SeedAsset = {
	title: string;
	asset_type: string;
	media_category: string;
	source_type: string;
	status: string;
	storage_tier: string;
	usage_scope: string;
	rights_status: string;
	tags: string;
	notes: string;
	resolution?: string;
	duration_seconds?: number;
	fileName: string;
	mimeType: string;
	fileContent: string;
	refs: RefIds;
};

async function auth() {
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';

	if (!email || !password) {
		throw new Error('Missing PocketBase admin credentials in .env');
	}

	await pb.admins.authWithPassword(email, password);
}

async function firstId(collection: string, sort = 'name'): Promise<string | undefined> {
	try {
		const record = await pb.collection(collection).getFirstListItem('', { sort, fields: 'id' });
		return record.id;
	} catch {
		return undefined;
	}
}

async function existingByTitle(title: string) {
	try {
		return await pb.collection('media_assets').getFirstListItem(`title = "${title.replace(/"/g, '\\"')}"`);
	} catch {
		return null;
	}
}

function makeSvg(title: string, subtitle: string, accent: string) {
	return `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" fill="none">
  <rect width="1600" height="900" fill="#08111f"/>
  <rect x="64" y="64" width="1472" height="772" rx="36" fill="#0f172a" stroke="${accent}" stroke-width="4"/>
  <circle cx="1360" cy="200" r="120" fill="${accent}" fill-opacity="0.15"/>
  <circle cx="250" cy="740" r="180" fill="#22c55e" fill-opacity="0.08"/>
  <text x="120" y="220" fill="#f8fafc" font-family="Arial, sans-serif" font-size="74" font-weight="700">${title}</text>
  <text x="120" y="310" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="34">${subtitle}</text>
  <text x="120" y="720" fill="${accent}" font-family="Arial, sans-serif" font-size="24" font-weight="700">FLIHUB PHASE 1 MEDIA SEED</text>
  <text x="120" y="765" fill="#94a3b8" font-family="Arial, sans-serif" font-size="26">Representative asset for filters, previews, and metadata detail QA.</text>
</svg>`.trim();
}

function makeTextPayload(title: string, body: string) {
	return `${title}\n\n${body}\n`;
}

async function createAsset(seed: SeedAsset) {
	const existing = await existingByTitle(seed.title);
	if (existing) {
		console.log(`- Skipped existing: ${seed.title}`);
		return;
	}

	const file = new File([seed.fileContent], seed.fileName, { type: seed.mimeType });
	const formData = new FormData();
	formData.set('title', seed.title);
	formData.set('asset_type', seed.asset_type);
	formData.set('media_category', seed.media_category);
	formData.set('source_type', seed.source_type);
	formData.set('status', seed.status);
	formData.set('storage_tier', seed.storage_tier);
	formData.set('usage_scope', seed.usage_scope);
	formData.set('rights_status', seed.rights_status);
	formData.set('tags', seed.tags);
	formData.set('notes', seed.notes);
	if (seed.resolution) formData.set('resolution', seed.resolution);
	if (seed.duration_seconds != null) formData.set('duration_seconds', String(seed.duration_seconds));
	formData.set('file_size_bytes', String(file.size));
	formData.set('capture_date', new Date().toISOString());
	for (const [key, value] of Object.entries(seed.refs)) {
		if (value) formData.set(key, value);
	}
	formData.set('file', file);

	await pb.collection('media_assets').create(formData);
	console.log(`+ Created: ${seed.title}`);
}

async function main() {
	await auth();

	const refs: RefIds = {
		franchise: await firstId('franchises'),
		project: await firstId('projects'),
		campaign: await firstId('campaigns'),
		season: await firstId('seasons', '-created'),
		tournament: await firstId('tournaments'),
		special_event: await firstId('special_events')
	};

	const assets: SeedAsset[] = [
		{
			title: 'Phase 1 Seed - Sponsor Recap Graphic',
			asset_type: 'social',
			media_category: 'sponsor_asset',
			source_type: 'production_company',
			status: 'approved',
			storage_tier: 'hot',
			usage_scope: 'sponsor',
			rights_status: 'owned',
			resolution: '1600x900',
			fileName: 'phase1-sponsor-recap.svg',
			mimeType: 'image/svg+xml',
			fileContent: makeSvg('Sponsor Recap', 'Approved recap creative with sponsor-facing metadata.', '#38bdf8'),
			tags: 'phase1, sponsor, recap, approved',
			notes: 'Seeded sponsor-facing graphic to exercise sponsor asset filtering and detail display.',
			refs
		},
		{
			title: 'Phase 1 Seed - Championship Highlight Reel',
			asset_type: 'banner',
			media_category: 'highlight',
			source_type: 'broadcast_camera',
			status: 'tagged',
			storage_tier: 'hot',
			usage_scope: 'broadcast',
			rights_status: 'owned',
			duration_seconds: 94,
			resolution: '1920x1080',
			fileName: 'phase1-highlight-reel.mp4',
			mimeType: 'video/mp4',
			fileContent: makeTextPayload('Championship Highlight Reel', 'Placeholder MP4 payload for preview, metadata, and download-path testing.'),
			tags: 'phase1, highlight, championship, broadcast',
			notes: 'Seeded highlight reel placeholder for non-image preview handling and metadata QA.',
			refs
		},
		{
			title: 'Phase 1 Seed - Post Round Interview Audio',
			asset_type: 'other',
			media_category: 'audio',
			source_type: 'podcast',
			status: 'uploaded',
			storage_tier: 'warm',
			usage_scope: 'internal',
			rights_status: 'shared',
			duration_seconds: 312,
			fileName: 'phase1-post-round-interview.mp3',
			mimeType: 'audio/mpeg',
			fileContent: makeTextPayload('Post Round Interview Audio', 'Placeholder MP3 payload for audio workflow verification.'),
			tags: 'phase1, interview, audio, post-round',
			notes: 'Seeded audio asset to exercise audio icon previews and read-only metadata visibility.',
			refs
		},
		{
			title: 'Phase 1 Seed - Broadcast Run of Show',
			asset_type: 'flyer',
			media_category: 'document',
			source_type: 'production_company',
			status: 'approved',
			storage_tier: 'warm',
			usage_scope: 'internal',
			rights_status: 'owned',
			fileName: 'phase1-run-of-show.pdf',
			mimeType: 'application/pdf',
			fileContent: makeTextPayload('Broadcast Run of Show', 'Placeholder PDF payload for document previews, metadata, and detail-sheet testing.'),
			tags: 'phase1, broadcast, document, run-of-show',
			notes: 'Seeded internal document asset for document-category filtering.',
			refs
		},
		{
			title: 'Phase 1 Seed - Archive Transfer Package',
			asset_type: 'other',
			media_category: 'archive_package',
			source_type: 'social_export',
			status: 'archived',
			storage_tier: 'archive',
			usage_scope: 'restricted',
			rights_status: 'expired',
			fileName: 'phase1-archive-transfer.zip',
			mimeType: 'application/zip',
			fileContent: makeTextPayload('Archive Transfer Package', 'Placeholder ZIP payload for archive-tier and restricted-rights verification.'),
			tags: 'phase1, archive, restricted, transfer',
			notes: 'Seeded archive package for storage-tier and rights-status validation.',
			refs
		}
	];

	for (const asset of assets) {
		await createAsset(asset);
	}

	const total = await pb.collection('media_assets').getList(1, 1, { skipTotal: false });
	console.log(`Done. media_assets total count: ${total.totalItems}`);
}

main().catch((error) => {
	if (error && typeof error === 'object') {
		console.error(JSON.stringify(error, null, 2));
	}
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});