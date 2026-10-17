import 'dotenv/config';
const mask = (v) => (v ? `set (len ${String(v).length})` : 'MISSING');
console.log('ELEVENLABS_API_KEY:', mask(process.env.ELEVENLABS_API_KEY));
console.log('FLI_TOKEN:', mask(process.env.FLI_TOKEN));
console.log('ELEVENLABS_VOICE_ID:', mask(process.env.ELEVENLABS_VOICE_ID));
