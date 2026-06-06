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

async function getSuperuserToken() {
	const baseUrl = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';

	if (!email || !password) {
		throw new Error('Missing PocketBase admin credentials in .env');
	}

	const auth = await requestJson(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identity: email, password })
	});

	return { baseUrl, token: auth.token as string };
}

function normalizeToken(value: unknown): string {
	return String(value || '')
		.toLowerCase()
		.replace(/[^a-z0-9\s]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function tokenize(value: unknown): string[] {
	return normalizeToken(value)
		.split(' ')
		.filter((token) => token.length > 2)
		.slice(0, 8);
}

async function auth() {
	const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
	const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';
	if (!email || !password) {
		throw new Error('Missing PocketBase admin credentials in .env');
	}
	await pb.admins.authWithPassword(email, password);
}

async function createDetection(job: any, asset: any, type: string, label: string, confidence: number) {
	await pb.collection('media_ai_detections').create({
		asset: asset.id,
		job: job.id,
		detection_type: type,
		label,
		confidence,
		time_in_seconds: 0,
		time_out_seconds: asset.duration_seconds || null,
		metadata_json: { source: 'process-media-ai-jobs' }
	});
}

async function fetchAssetViaRest(baseUrl: string, token: string, assetId: string) {
	return requestJson(`${baseUrl}/api/collections/media_assets/records/${assetId}`, {
		headers: { Authorization: token }
	});
}

async function processJob(job: any, baseUrl: string, token: string) {
	const startedAt = new Date().toISOString();
	await pb.collection('media_ai_jobs').update(job.id, {
		status: 'running',
		started_at: startedAt,
		error_message: ''
	});

	const asset = await fetchAssetViaRest(baseUrl, token, job.asset);

	const tags = tokenize(asset.tags);
	const titleTokens = tokenize(asset.title);
	const baseKeywords = Array.from(new Set([...titleTokens, ...tags])).slice(0, 6);

	if (job.job_type === 'player_recognition') {
		const label = titleTokens.length >= 2 ? `${titleTokens[0]} ${titleTokens[1]}` : 'demo player';
		await createDetection(job, asset, 'player', label.replace(/\b\w/g, (c) => c.toUpperCase()), 0.83);
	}

	if (job.job_type === 'logo_recognition') {
		const label = tags[0] ? `${tags[0]} sponsor`.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Demo Sponsor';
		await createDetection(job, asset, 'sponsor_logo', label, 0.81);
	}

	if (job.job_type === 'scene_detection') {
		const scene = asset.media_category || asset.asset_type || 'general';
		await createDetection(job, asset, 'scene', `${scene} scene`, 0.79);
	}

	if (job.job_type === 'transcript_extraction') {
		const transcriptText = [
			`Automated transcript for ${asset.title || 'untitled media asset'}.`,
			`Detected category: ${asset.media_category || asset.asset_type || 'unknown'}.`,
			baseKeywords.length ? `Keywords: ${baseKeywords.join(', ')}.` : ''
		].filter(Boolean).join(' ');

		await pb.collection('media_ai_transcripts').create({
			asset: asset.id,
			job: job.id,
			language: 'en',
			transcript_text: transcriptText,
			segments_json: [{ start: 0, end: 6, text: transcriptText }],
			word_count: transcriptText.split(/\s+/).filter(Boolean).length,
			confidence_avg: 0.78
		});
	}

	if (job.job_type === 'clip_summarization' || job.job_type === 'metadata_suggestion') {
		const summaryText = [
			`${asset.title || 'This asset'} appears to capture a notable ${asset.media_category || asset.asset_type || 'media'} moment.`,
			baseKeywords.length ? `Suggested metadata includes: ${baseKeywords.join(', ')}.` : 'Suggested metadata should be reviewed by media ops.'
		].join(' ');

		await pb.collection('media_ai_summaries').create({
			asset: asset.id,
			job: job.id,
			summary_text: summaryText,
			suggested_tags_json: baseKeywords,
			suggested_title: `${asset.title || 'Asset'} - Suggested Highlight`,
			priority_score: 65,
			approved: false
		});
	}

	const completedAt = new Date().toISOString();
	await pb.collection('media_ai_jobs').update(job.id, {
		status: 'completed',
		completed_at: completedAt,
		result_json: {
			processed_at: completedAt,
			job_type: job.job_type,
			asset_id: asset.id,
			automation: 'process-media-ai-jobs'
		}
	});
}

async function main() {
	await auth();
	const { baseUrl, token } = await getSuperuserToken();

	const limit = Math.min(Math.max(Number(process.env.MEDIA_AI_JOB_LIMIT || 20), 1), 100);
	const listed = await requestJson(`${baseUrl}/api/collections/media_ai_jobs/records?page=1&perPage=${limit}`, {
		headers: { Authorization: token }
	});
	const queuedItems = ((listed.items || []) as any[]).filter((row: any) => row.status === 'queued');

	if (!queuedItems.length) {
		console.log('No queued media_ai_jobs found.');
		return;
	}

	let completed = 0;
	let failed = 0;

	for (const job of queuedItems) {
		try {
			await processJob(job, baseUrl, token);
			completed += 1;
			console.log(`Completed job ${job.id} (${job.job_type}).`);
		} catch (error) {
			failed += 1;
			await pb.collection('media_ai_jobs').update(job.id, {
				status: 'failed',
				error_message: error instanceof Error ? error.message : String(error),
				completed_at: new Date().toISOString()
			}).catch(() => undefined);
			console.error(`Failed job ${job.id}:`, error instanceof Error ? error.message : String(error));
		}
	}

	console.log(`Done. Processed ${queuedItems.length} queued jobs. Completed: ${completed}. Failed: ${failed}.`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.stack || error.message : String(error));
	process.exit(1);
});
