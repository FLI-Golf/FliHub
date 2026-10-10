// Probe candidate premade female voices with a one-word TTS call each, because
// this API key lacks voice-catalog read permission. Prints only names/IDs.

import 'dotenv/config';

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
	console.log('ELEVENLABS_API_KEY is not set.');
	process.exit(1);
}

// Well-known premade female voices (public ElevenLabs documentation).
const CANDIDATES = [
	{ name: 'Rachel',    id: '21m00Tcm4TlvDq8ikWAM', note: 'calm, clear, narration' },
	{ name: 'Domi',      id: 'AZnzlk1XvdvUeBnXmlld', note: 'strong, confident' },
	{ name: 'Bella',     id: 'EXAVITQu4vr4xnSDxMaL', note: 'soft, warm' },
	{ name: 'Elli',      id: 'MF3mGyEYCl7xyWbV9V6O', note: 'emotional' },
	{ name: 'Laura',     id: 'FGy2WhTYpPfhIDcEWZKp', note: 'upbeat' },
	{ name: 'Charlotte', id: 'XB0fDUnXU5powFXDhCwa', note: 'calm, warm' },
	{ name: 'Alice',     id: 'Xb7hH8MSUJpSbSDYk0k2', note: 'clear, professional' },
	{ name: 'Matilda',   id: 'XrExE9yKIg1WjnnlVkGX', note: 'warm, conversational' },
	{ name: 'Jessica',   id: 'cgSgspJ2msm6clMCkdW9', note: 'conversational' },
	{ name: 'Lily',      id: 'pFZP5JQG7iQjIQuC4Bku', note: 'warm, clear' }
];

for (const c of CANDIDATES) {
	const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${c.id}`, {
		method: 'POST',
		headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
		body: JSON.stringify({ text: 'Hi.', model_id: 'eleven_multilingual_v2' })
	});
	console.log(`${c.name.padEnd(10)} ${c.id} -> ${res.ok ? 'OK' : res.status}`);
	await res.arrayBuffer().catch(() => {}); // drain
}
