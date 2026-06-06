import path from 'path';
import dotenv from 'dotenv';
import PocketBase from 'pocketbase';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');
const DEMO_CREATED_BY = 'phase7-demo';

function storageJobType(value: string): string {
	return value === 'transcript_extractions' ? 'transcript_extraction' : value;
}

async function requestJson(url: string, options: RequestInit = {}) {
	const response = await fetch(url, options);
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(`${response.status} ${JSON.stringify(payload)}`);
	}
	return payload;
}

const DEMO_SCENARIOS = [
	{
		transcriptType: 'metadata_suggestion',
		status: 'pending',
		confidence: 0.93,
		titleSuffix: 'metadata suggestion',
		tags: 'highlight,sponsor,player',
		summaryLabel: 'Suggested metadata',
		transcriptLabel: 'Transcript match'
	},
	{
		transcriptType: 'clip_summarization',
		status: 'pending',
		confidence: 0.88,
		titleSuffix: 'clip summary',
		tags: 'recap,highlight',
		summaryLabel: 'Clip summary',
		transcriptLabel: 'Summary transcript'
	},
	{
		transcriptType: 'transcript_extractions',
		status: 'reviewed',
		confidence: 0.82,
		titleSuffix: 'transcript extraction',
		tags: 'transcript,quote',
		summaryLabel: 'Transcript extraction',
		transcriptLabel: 'Extracted quote'
	},
	{
		transcriptType: 'scene_detection',
		status: 'pending',
		confidence: 0.79,
		titleSuffix: 'scene detection',
		tags: 'scene,course,b-roll',
		summaryLabel: 'Scene detection',
		transcriptLabel: 'Scene note'
	},
	{
		transcriptType: 'logo_recognition',
		status: 'approved',
		confidence: 0.9,
		titleSuffix: 'logo recognition',
		tags: 'logo,sponsor,branding',
		summaryLabel: 'Logo recognition',
		transcriptLabel: 'Branding mention'
	},
	{
		transcriptType: 'player_recognition',
		status: 'pending',
		confidence: 0.86,
		titleSuffix: 'player recognition',
		tags: 'player,feature,roster',
		summaryLabel: 'Player recognition',
		transcriptLabel: 'Player callout'
	}
] as const;

function hasArg(flag: string): boolean {
	return process.argv.includes(flag);
}

async function auth() {
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';

	if (!email || !password) {
		throw new Error('Missing PocketBase admin credentials in .env');
	}

	await pb.admins.authWithPassword(email, password);
}

async function loadAssets(limit: number) {
	const baseUrl = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';

	const authRes = await requestJson(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identity: email, password })
	});

	const records = await requestJson(`${baseUrl}/api/collections/media_assets/records?page=1&perPage=${limit}`, {
		headers: { Authorization: authRes.token }
	});

	return records.items || [];
}

async function loadExistingDemoRows() {
	return pb.collection('media_ai_transcripts').getFullList({
		filter: `createdBy = "${DEMO_CREATED_BY}"`,
		fields: 'id,title,transcriptType,status,sourceAsset,createdBy'
	});
}

async function loadExistingDemoJobs() {
	return pb.collection('media_ai_jobs').getFullList({
		filter: `provider = "${DEMO_CREATED_BY}"`,
		fields: 'id'
	});
}

async function resetDemoRows(rows: Array<{ id: string }>) {
	for (const row of rows) {
		await pb.collection('media_ai_transcripts').delete(row.id);
	}
}

async function resetDemoJobs(rows: Array<{ id: string }>) {
	for (const row of rows) {
		await pb.collection('media_ai_jobs').delete(row.id).catch(() => undefined);
	}
}

function buildPayload(asset: any, scenario: (typeof DEMO_SCENARIOS)[number], index: number) {
	const title = asset.title || `Demo Asset ${index + 1}`;
	const category = asset.media_category || asset.asset_type || 'media';
	const assetTags = String(asset.tags || '').trim();
	const tags = [scenario.tags, assetTags].filter(Boolean).join(',');
	const transcriptBody = `${scenario.transcriptLabel}: ${title} includes searchable ${category} moments for the Phase 7 demo queue.`;
	const approvedFields = scenario.status === 'approved'
		? {
			approvedBy: DEMO_CREATED_BY,
			approvedAt: new Date().toISOString(),
		}
		: {};

	return {
		title: `${title} - ${scenario.titleSuffix}`,
		asset: asset.id,
		sourceAsset: asset.id,
		transcriptType: scenario.transcriptType,
		status: scenario.status,
		transcriptText: transcriptBody,
		transcript_text: transcriptBody,
		summary: `${scenario.summaryLabel} for ${title}. This demo row is intended to validate queue filters, approvals, and search behavior in the dashboard panel.`,
		tags,
		language: 'en',
		durationSeconds: Number(asset.duration_seconds || 0) || null,
		speakerCount: 1,
		confidence: scenario.confidence,
		estimatedRevenue: 250 + index * 50,
		downloadCount: index,
		requestCount: index + 1,
		reviewNotes: `Demo seed for ${scenario.transcriptType}.`,
		createdBy: DEMO_CREATED_BY,
		...approvedFields
	};
}

async function main() {
	const dryRun = hasArg('--dry-run');
	await auth();

	const assets = await loadAssets(Math.max(DEMO_SCENARIOS.length, 6));
	if (!assets.length) {
		console.log('Need at least one media asset before seeding the Phase 7 demo queue.');
		return;
	}

	const existingDemoRows = await loadExistingDemoRows().catch(() => []);
	const existingDemoJobs = await loadExistingDemoJobs().catch(() => []);
		const planned = DEMO_SCENARIOS.map((scenario, index) => {
		const asset = assets[index % assets.length];
		return buildPayload(asset, scenario, index);
	});

	if (dryRun) {
		console.log(
			JSON.stringify(
				{
					dryRun: true,
					assetsAvailable: assets.length,
					existingDemoRows: existingDemoRows.length,
					existingDemoJobs: existingDemoJobs.length,
					rowsToCreate: planned.map((row) => ({
						title: row.title,
						transcriptType: row.transcriptType,
						status: row.status,
						sourceAsset: row.sourceAsset
					}))
				},
				null,
				2
			)
		);
		return;
	}

	if (existingDemoRows.length > 0) {
		await resetDemoRows(existingDemoRows);
	}

	if (existingDemoJobs.length > 0) {
		await resetDemoJobs(existingDemoJobs);
	}

	const created = [];
	for (const row of planned) {
		const job = await pb.collection('media_ai_jobs').create({
			asset: row.asset,
			job_type: storageJobType(row.transcriptType),
			status: 'completed',
			provider: DEMO_CREATED_BY,
			model_name: 'phase7-demo'
		});

		let record;
		try {
			record = await pb.collection('media_ai_transcripts').create({
				...row,
				job: job.id
			});
		} catch (error: any) {
			console.error(
				JSON.stringify(
					{
						failedRow: {
							title: row.title,
							transcriptType: row.transcriptType,
							status: row.status,
							sourceAsset: row.sourceAsset,
						},
						error: error?.response || error?.data || error?.message || String(error),
					},
					null,
					2
				)
			);
			throw error;
		}
		created.push({
			id: record.id,
			title: record.title,
			transcriptType: record.transcriptType,
			status: record.status
		});
	}

	console.log(
		JSON.stringify(
			{
				ok: true,
				deletedDemoRows: existingDemoRows.length,
				deletedDemoJobs: existingDemoJobs.length,
				created: created.length,
				queueTypes: [...new Set(planned.map((row) => row.transcriptType))],
				rows: created
			},
			null,
			2
		)
	);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});