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

	const records = await requestJson(`${baseUrl}/api/collections/media_assets/records?page=1&perPage=50`, {
		headers: { Authorization: authRes.token }
	});

	return records.items || [];
}

async function main() {
	await auth();

	const assets = await fetchAssetsViaRest();
	if (!assets.length) {
		console.log('Need at least one media asset to seed Phase 7.');
		return;
	}

	const asset = assets[0];
	const startedAt = new Date().toISOString();
	const completedAt = new Date(Date.now() + 5 * 1000).toISOString();

	const summaryText = `AI summary seed for ${asset.title || 'Untitled Asset'}: key player moments and sponsor logo visibility detected.`;

	const job = await pb.collection('media_ai_jobs').create({
		asset: asset.id,
		job_type: 'clip_summarization',
		status: 'completed',
		provider: 'seed-engine',
		model_name: 'phase7-seed-v1',
		started_at: startedAt,
		completed_at: completedAt,
		result_json: {
			summary: summaryText,
			keywords: ['highlight', 'sponsor', 'player'],
			confidence: 0.92
		}
	});

	await pb.collection('media_ai_detections').create({
		asset: asset.id,
		job: job.id,
		detection_type: 'player',
		label: 'Demo Player',
		confidence: 0.94,
		time_in_seconds: 12,
		time_out_seconds: 18,
		metadata_json: { team: 'Demo Team', jersey_number: 8 }
	});

	await pb.collection('media_ai_detections').create({
		asset: asset.id,
		job: job.id,
		detection_type: 'sponsor_logo',
		label: 'Demo Sponsor Logo',
		confidence: 0.9,
		time_in_seconds: 21,
		time_out_seconds: 27,
		metadata_json: { placement: 'center board' }
	});

	const transcriptText = [
		'Announcer: Great drive down the fairway by Demo Player.',
		'Commentator: Sponsor branding is clearly visible near the green.',
		'Announcer: This highlight could be featured in the weekly recap.'
	].join(' ');

	await pb.collection('media_ai_transcripts').create({
		asset: asset.id,
		job: job.id,
		language: 'en',
		transcript_text: transcriptText,
		segments_json: [
			{ start: 0, end: 4, text: 'Great drive down the fairway by Demo Player.' },
			{ start: 5, end: 10, text: 'Sponsor branding is clearly visible near the green.' }
		],
		word_count: transcriptText.split(/\s+/).filter(Boolean).length,
		confidence_avg: 0.89
	});

	await pb.collection('media_ai_summaries').create({
		asset: asset.id,
		job: job.id,
		summary_text: summaryText,
		suggested_tags_json: ['highlight', 'player-feature', 'sponsor-visibility'],
		suggested_title: `${asset.title || 'Asset'} - AI Suggested Recap`,
		priority_score: 82,
		approved: false
	});

	console.log(`Done. Seeded Phase 7 AI data for asset ${asset.id}.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});
