// Select a natural female voice for product walkthroughs from the ElevenLabs
// voice catalog. Prints only voice names/IDs/labels — never the API key.

import 'dotenv/config';

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
	console.log('ELEVENLABS_API_KEY is not set.');
	process.exit(1);
}

const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key } });
if (!res.ok) {
	console.log('Voice catalog request failed:', res.status);
	process.exit(1);
}

const data = await res.json();
const voices = Array.isArray(data) ? data : data.voices ?? [];

const PREFERRED = ['clear', 'warm', 'conversational', 'calm', 'friendly', 'natural', 'professional', 'smooth', 'soft'];
const score = (v) => {
	const text = `${v.labels?.description ?? ''} ${v.labels?.use_case ?? ''} ${v.description ?? ''}`.toLowerCase();
	return PREFERRED.reduce((s, word) => s + (text.includes(word) ? 1 : 0), 0);
};

const females = voices
	.filter((v) => (v.labels?.gender ?? '').toLowerCase() === 'female')
	.map((v) => ({ name: v.name, id: v.voice_id, labels: v.labels ?? {}, score: score(v) }))
	.sort((a, b) => b.score - a.score);

console.log(`Found ${females.length} female voices:`);
for (const v of females) {
	const desc = [v.labels.age, v.labels.accent, v.labels.description, v.labels.use_case].filter(Boolean).join(' · ');
	console.log(`${String(v.score)} | ${v.name} | ${v.id} | ${desc}`);
}
