// Generate ElevenLabs narration for a walkthrough, with caching.
//
// Reads the narration script (caption + spoken text) from the walkthrough's
// script.json, requests one text-to-speech clip per line from ElevenLabs, and
// caches each MP3 by a hash of (spoken text + voice + model + voice settings).
// Re-running with unchanged inputs reuses the cache and does not repeat paid
// API calls. Actual clip durations are measured with ffprobe and written to
// <name>.narration.json so the recording and assembly steps can pace precisely.
//
// The API key is read from ELEVENLABS_API_KEY (env or git-ignored .env) and is
// never printed or committed. Voice is configurable via ELEVENLABS_VOICE_ID.
//
// Usage: node scripts/walkthroughs/narrate.mjs tournament-payouts

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { WALKTHROUGH } from './config.mjs';

const name = process.argv[2];
if (!name) {
	console.error('Usage: node scripts/walkthroughs/narrate.mjs <walkthrough-name>');
	process.exit(1);
}

const outDir = path.join(WALKTHROUGH.dir.output, name);
const cacheDir = path.join(WALKTHROUGH.dir.cache, 'narration');
await mkdir(outDir, { recursive: true });
await mkdir(cacheDir, { recursive: true });

const script = JSON.parse(await readFile(path.join(root(), 'walkthroughs', name, 'script.json'), 'utf8'));
const voiceId = WALKTHROUGH.elevenLabsVoiceId;
const model = WALKTHROUGH.elevenLabsModel;
// Slightly lower stability keeps the read conversational at a moderate pace.
const voiceSettings = { stability: 0.45, similarity_boost: 0.75 };

function root() {
	return path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
}

function cacheKey(text) {
	return createHash('sha256')
		.update(JSON.stringify({ model, voiceId, voiceSettings, text }))
		.digest('hex')
		.slice(0, 24);
}

function measureDuration(file) {
	const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
	return Number(out.toString().trim());
}

async function synthesize(text) {
	const file = path.join(cacheDir, `${cacheKey(text)}.mp3`);
	try {
		await readFile(file);
		return { file, cached: true };
	} catch {
		// miss: call the API below
	}
	const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
		method: 'POST',
		headers: {
			'xi-api-key': WALKTHROUGH.elevenLabsApiKey,
			'Content-Type': 'application/json',
			Accept: 'audio/mpeg'
		},
		body: JSON.stringify({ text, model_id: model, voice_settings: voiceSettings })
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		throw new Error(`ElevenLabs TTS failed (${res.status}): ${detail.slice(0, 200)}`);
	}
	const buf = Buffer.from(await res.arrayBuffer());
	await writeFile(file, buf);
	return { file, cached: false };
}

async function run() {
	if (!WALKTHROUGH.elevenLabsApiKey) {
		console.log('ELEVENLABS_API_KEY not set — writing captions only, skipping narration.');
		await writeFile(path.join(outDir, `${name}.narration.json`), JSON.stringify({ name, voiceId, clips: [] }, null, 2));
		return;
	}

	const clips = [];
	let cacheHits = 0;
	for (let i = 0; i < script.lines.length; i++) {
		const line = script.lines[i];
		const { file, cached } = await synthesize(line.say);
		if (cached) cacheHits++;
		clips.push({ beat: i, text: line.caption, file, duration: measureDuration(file) });
	}

	await writeFile(
		path.join(outDir, `${name}.narration.json`),
		JSON.stringify({ name, voiceId, model, voiceSettings, clips }, null, 2)
	);
	console.log(`Narration ready: ${clips.length} clips for "${name}" (voice ${voiceId}, ${cacheHits} cached).`);
	clips.forEach((c) => console.log(`  clip ${c.beat + 1}: ${c.duration.toFixed(2)}s — ${c.text.slice(0, 48)}…`));
}

run().catch((e) => {
	console.error('Narration failed:', e.message);
	process.exit(1);
});
