// Shared walkthrough configuration. Credentials come from the environment or a
// git-ignored .env file; they are never committed or printed.

import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const WALKTHROUGH = {
	// Base URL of the running app. Start it with `pnpm run dev` first.
	baseUrl: process.env.WALKTHROUGH_BASE_URL || 'http://localhost:5173',

	// Demo login. These are read from env/ignored .env; never committed.
	loginEmail: process.env.WALKTHROUGH_LOGIN_EMAIL || process.env.DEMO_LOGIN_EMAIL || process.env.DEMO_USER || '',
	loginPassword: process.env.WALKTHROUGH_LOGIN_PASSWORD || process.env.DEMO_LOGIN_PASSWORD || process.env.DEMO_PASSWORD || '',

	// Path to a Chromium executable. Defaults to the @sparticuz/chromium binary.
	chromiumPath:
		process.env.WALKTHROUGH_CHROMIUM ||
		(await import('@sparticuz/chromium').then((m) => m.default.executablePath()).catch(() => '/tmp/chromium')),

	// ElevenLabs narration. The authentication key comes only from
	// ELEVENLABS_API_KEY (env or git-ignored .env); never committed or printed.
	elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
	// ELEVENLABS_VOICE_ID selects the voice; the default is used when blank.
	elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB', // "Adam"
	elevenLabsModel: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',

	// Recording dimensions (720p). Override with WALKTHROUGH_VIEWPORT=1920x1080.
	viewport: (() => {
		const v = (process.env.WALKTHROUGH_VIEWPORT || '1280x720').split('x').map(Number);
		return { width: v[0] || 1280, height: v[1] || 720 };
	})(),

	// Output locations (all git-ignored).
	dir: {
		output: path.join(root, 'walkthroughs/output'),
		cache: path.join(root, 'scripts/walkthroughs/.cache'),
		auth: path.join(root, 'scripts/walkthroughs/.auth')
	},

	// ffmpeg is optional; when absent, only the WebM recording is produced.
	ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg'
};
