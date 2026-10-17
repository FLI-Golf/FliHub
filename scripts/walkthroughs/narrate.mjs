// Generate ElevenLabs narration for a walkthrough, with caching.
//
// The editable source is walkthroughs/<name>/script.md (see script-source.mjs).
// Captions double as narration text; the spoken form is derived by replacing
// brand spellings (FliHub → "Fly Hub"). Each clip is cached by a hash of
// (exact spoken text + voice + model + voice settings), so editing the source
// regenerates only the changed clips.
//
// Clip durations are measured with ffprobe and used to compute the beat
// schedule: each beat starts after the previous clip finishes plus its pause,
// so sentences never overlap. The schedule is written to <name>.beats.json
// (generated artifact) and clip timings to <name>.narration.json.
//
// The API key is read from ELEVENLABS_API_KEY (env or git-ignored .env) and is
// never printed or committed. Voice is selected via ELEVENLABS_VOICE_ID.
//
// Usage: node scripts/walkthroughs/narrate.mjs tournament-payouts

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { WALKTHROUGH } from './config.mjs';
import { loadScriptSource } from './script-source.mjs';

const name = process.argv[2];
if (!name) {
	console.error('Usage: node scripts/walkthroughs/narrate.mjs <walkthrough-name>');
	process.exit(1);
}

const outDir = path.join(WALKTHROUGH.dir.output, name);
const cacheDir = path.join(WALKTHROUGH.dir.cache, 'narration');
await mkdir(outDir, { recursive: true });
await mkdir(cacheDir, { recursive: true });

const script = await loadScriptSource(root(), name);
const voiceId = WALKTHROUGH.elevenLabsVoiceId;
const model = WALKTHROUGH.elevenLabsModel;
// Slightly lower stability keeps the read conversational at a moderate pace.
const voiceSettings = { stability: 0.45, similarity_boost: 0.75 };
const DEFAULT_PAUSE = 0.9;

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
	const sourceBeats = script.beats;

	if (!WALKTHROUGH.elevenLabsApiKey) {
		console.log('ELEVENLABS_API_KEY not set — writing captions only, skipping narration.');
		const schedule = computeSchedule(sourceBeats, sourceBeats.map(() => 3.5));
		await writeFile(path.join(outDir, `${name}.beats.json`),
			JSON.stringify({ name, viewport: WALKTHROUGH.viewport, beats: schedule }, null, 2));
		await writeFile(path.join(outDir, `${name}.narration.json`), JSON.stringify({ name, voiceId, clips: [] }, null, 2));
		return;
	}

	const clips = [];
	let cacheHits = 0;
	for (let i = 0; i < sourceBeats.length; i++) {
		const beat = sourceBeats[i];
		const { file, cached } = await synthesize(beat.say);
		if (cached) cacheHits++;
		clips.push({ beat: i, text: beat.caption, file, duration: measureDuration(file) });
	}

	// Schedule beats from measured clip durations so sentences never overlap.
	const schedule = computeSchedule(sourceBeats, clips.map((c) => c.duration));
	const timedClips = clips.map((c, i) => ({ ...c, t: schedule[i].t }));

	await writeFile(path.join(outDir, `${name}.beats.json`),
		JSON.stringify({ name, viewport: WALKTHROUGH.viewport, beats: schedule }, null, 2));
	await writeFile(
		path.join(outDir, `${name}.narration.json`),
		JSON.stringify({ name, voiceId, model, voiceSettings, clips: timedClips }, null, 2)
	);
	console.log(`Narration ready: ${clips.length} clips for "${name}" (voice ${voiceId}, ${cacheHits} cached).`);
	timedClips.forEach((c) => console.log(`  clip ${c.beat + 1}: @${c.t.toFixed(2)}s ${c.duration.toFixed(2)}s — ${c.text.slice(0, 48)}…`));
}

// Each beat starts when the previous clip ends plus its pause. A beat with an
// explicit `at` is pinned to that time.
function computeSchedule(sourceBeats, durations) {
	let next = 0;
	return sourceBeats.map((b, i) => {
		const t = b.at != null ? b.at : next;
		next = t + durations[i] + (b.pause ?? DEFAULT_PAUSE);
		return { t: Number(t.toFixed(2)), caption: b.caption };
	});
}

run().catch((e) => {
	console.error('Narration failed:', e.message);
	process.exit(1);
});
