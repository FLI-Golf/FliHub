// Generate ElevenLabs narration for a walkthrough, with caching.
//
// Reads the beat captions from <name>.beats.json, requests one text-to-speech
// clip per beat from ElevenLabs, and caches each MP3 by a hash of
// (text + voice + model). Re-running with unchanged text/voice reuses the cache
// and does not repeat paid API calls.
//
// The API key is read from ELEVENLABS_API_KEY (env or git-ignored .env) and is
// never printed or committed. Voice is configurable via ELEVENLABS_VOICE_ID.
//
// Usage: node scripts/walkthroughs/narrate.mjs tournament-payouts

import { createHash } from 'node:crypto';
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

const beats = JSON.parse(await readFile(path.join(outDir, `${name}.beats.json`), 'utf8')).beats;
const voiceId = WALKTHROUGH.elevenLabsVoiceId;
const model = WALKTHROUGH.elevenLabsModel;

function cacheKey(text) {
	return createHash('sha256').update(`${model}|${voiceId}|${text}`).digest('hex').slice(0, 24);
}

async function synthesize(text) {
	const file = path.join(cacheDir, `${cacheKey(text)}.mp3`);
	try {
		await readFile(file);
		return file; // cache hit — no API call
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
		body: JSON.stringify({
			text,
			model_id: model,
			voice_settings: { stability: 0.5, similarity_boost: 0.75 }
		})
	});
	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		throw new Error(`ElevenLabs TTS failed (${res.status}): ${detail.slice(0, 200)}`);
	}
	const buf = Buffer.from(await res.arrayBuffer());
	await writeFile(file, buf);
	return file;
}

async function run() {
	if (!WALKTHROUGH.elevenLabsApiKey) {
		console.log('ELEVENLABS_API_KEY not set — writing captions only, skipping narration.');
		await writeFile(path.join(outDir, `${name}.narration.json`), JSON.stringify({ name, voiceId, clips: [] }, null, 2));
		return;
	}

	const clips = [];
	for (let i = 0; i < beats.length; i++) {
		const file = await synthesize(beats[i].caption);
		clips.push({ beat: i, at: beats[i].t, text: beats[i].caption, file });
	}

	await writeFile(
		path.join(outDir, `${name}.narration.json`),
		JSON.stringify({ name, voiceId, model, clips }, null, 2)
	);
	console.log(`Narration ready: ${clips.length} clips for "${name}" (voice ${voiceId}).`);
}

run().catch((e) => {
	console.error('Narration failed:', e.message);
	process.exit(1);
});
