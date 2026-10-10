// Assemble a walkthrough into a narrated, captioned MP4.
//
// Takes the recorded WebM plus the narration clips (from narrate.mjs), overlays
// synchronized captions, muxes the narration audio, and writes an MP4. If no
// narration is present, it produces a captioned silent MP4.
//
// Requires ffmpeg (system or FFMPEG_PATH). Audio/video output stays git-ignored.
//
// Usage: node scripts/walkthroughs/assemble.mjs tournament-payouts

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { WALKTHROUGH } from './config.mjs';

const name = process.argv[2];
if (!name) {
	console.error('Usage: node scripts/walkthroughs/assemble.mjs <walkthrough-name>');
	process.exit(1);
}

const outDir = path.join(WALKTHROUGH.dir.output, name);
const webm = path.join(outDir, `${name}.webm`);
const mp4 = path.join(outDir, `${name}.mp4`);
const beats = JSON.parse(await readFile(path.join(outDir, `${name}.beats.json`), 'utf8')).beats;

let narration = { clips: [] };
try {
	narration = JSON.parse(await readFile(path.join(outDir, `${name}.narration.json`), 'utf8'));
} catch {
	// no narration file — silent video
}

const toSrtTime = (t) => {
	const ms = Math.round(t * 1000);
	const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
	const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
	const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
	const mm = String(ms % 1000).padStart(3, '0');
	return `${h}:${m}:${s},${mm}`;
};

// Build SRT: each caption shows from its beat time until the next beat.
// The final caption stays visible until the end of the video.
const videoDuration = beats[beats.length - 1].t + 10; // upper bound; real end read after encode
const srt = beats.map((b, i) => {
	const end = beats[i + 1] ? beats[i + 1].t : videoDuration;
	return `${i + 1}\n${toSrtTime(b.t)} --> ${toSrtTime(end)}\n${b.caption}\n`;
}).join('\n');
const srtPath = path.join(outDir, `${name}.srt`);
await writeFile(srtPath, srt);

function runFfmpeg(args) {
	return new Promise((resolve, reject) => {
		const p = spawn(WALKTHROUGH.ffmpegPath, ['-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
		let err = '';
		p.stderr.on('data', (d) => { err += d.toString(); });
		p.on('error', reject);
		p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${err.slice(-400)}`))));
	});
}

async function run() {
	const hasAudio = narration.clips.length > 0;
	const subFilter = `subtitles=${srtPath.replace(/\\/g, '/').replace(/:/g, '\\:')}`;

	if (hasAudio) {
		// Place each narration clip at its beat time from the beats file.
		const inputs = narration.clips.map((c) => c.file);
		const delays = narration.clips.map((c) => Math.round((beats[c.beat]?.t ?? 0) * 1000));
		const filterParts = inputs.map((_, i) => `[${i + 1}:a]adelay=${delays[i]}|${delays[i]}[a${i}]`).join(';');
		const mixInputs = narration.clips.map((_, i) => `[a${i}]`).join('');
		const filter = `${filterParts};${mixInputs}amix=inputs=${inputs.length}:normalize=0[aout]`;

		await runFfmpeg([
			'-i', webm,
			...inputs.flatMap((f) => ['-i', f]),
			'-filter_complex', filter,
			'-map', '0:v', '-map', '[aout]',
			'-vf', subFilter,
			'-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
			// No -shortest: the paced recording is longer than the audio mix, and
			// truncating to the shorter stream would cut the final sentence.
			mp4
		]);
	} else {
		await runFfmpeg([
			'-i', webm,
			'-vf', subFilter,
			'-c:v', 'libx264', '-pix_fmt', 'yuv420p',
			mp4
		]);
	}

	console.log(`Assembled: ${mp4} (${hasAudio ? 'narrated' : 'silent'} + captions).`);
}

run().catch((e) => {
	console.error('Assembly failed:', e.message);
	process.exit(1);
});
