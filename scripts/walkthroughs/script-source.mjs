// Shared walkthrough script loader.
//
// The editable source for a walkthrough is walkthroughs/<name>/script.md.
// Each beat is a `### Beat N` section with bullet fields:
//
//   ### Beat 1
//   - at: 0.4            (optional; seconds on the video timeline)
//   - pause: 1.2         (optional; silence after this beat's narration)
//   - action: open-page  (recorder action name; recorder-specific)
//   - caption: Text shown on screen. Spoken text is derived automatically.
//
// A `- say:` override is supported but rarely needed — spoken text is derived
// from the caption by replacing brand spellings (FliHub → "Fly Hub").
//
// A legacy script.json ({ lines: [{ caption, say }] }) is still accepted when
// no script.md exists.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

export function deriveSpoken(caption) {
	return caption.replace(/\bFliHub\b/g, 'Fly Hub').replace(/\bFLI\b/g, 'Fly');
}

function parseMarkdown(md) {
	const beats = [];
	const blocks = md.split(/^###\s+/m).slice(1);
	for (const block of blocks) {
		const get = (key) => {
			const m = block.match(new RegExp(`^-\\s*${key}:\\s*(.+)$`, 'm'));
			return m ? m[1].trim() : null;
		};
		const caption = get('caption');
		if (!caption) continue;
		const at = get('at');
		const pause = get('pause');
		beats.push({
			at: at != null ? Number(at) : null,
			pause: pause != null ? Number(pause) : null,
			action: get('action'),
			caption,
			say: get('say') ?? deriveSpoken(caption)
		});
	}
	return beats;
}

export async function loadScriptSource(repoRoot, name) {
	const mdPath = path.join(repoRoot, 'walkthroughs', name, 'script.md');
	try {
		const md = await readFile(mdPath, 'utf8');
		return { format: 'md', beats: parseMarkdown(md) };
	} catch {
		const jsonPath = path.join(repoRoot, 'walkthroughs', name, 'script.json');
		const json = JSON.parse(await readFile(jsonPath, 'utf8'));
		return {
			format: 'json',
			beats: json.lines.map((l) => ({ at: null, pause: null, action: null, caption: l.caption, say: l.say }))
		};
	}
}
