# FliHub Walkthrough Videos

Repeatable Playwright walkthrough recordings with optional ElevenLabs narration,
burned-in captions, and MP4 assembly. Output, credentials, and browser state are
git-ignored.

## Prerequisites

1. `pnpm install` (Playwright is a dev dependency).
2. A running dev server: `pnpm run dev` (separate terminal).
3. A Chromium build. The scripts default to the `@sparticuz/chromium` binary;
   override with `WALKTHROUGH_CHROMIUM=/path/to/chrome` if needed.
4. `pnpm exec playwright install ffmpeg` (Playwright's capture ffmpeg) plus a
   system `ffmpeg` for MP4 assembly (`sudo apt-get install -y ffmpeg`).

## Credentials

All secrets live in the git-ignored `.env` (never committed or printed):

```
DEMO_USER=...            # app login used in recordings
DEMO_PASSWORD=...
ELEVENLABS_API_KEY=sk_...   # narration auth (optional; must be an sk_ key)
ELEVENLABS_VOICE_ID=...     # voice selection only; blank uses the default voice
```

`FLI_TOKEN` is reserved for GitHub operations and is never sent to ElevenLabs.

Check presence without printing values:

```bash
node scripts/walkthroughs/probe-env.mjs
```

## Record + narrate + assemble

```bash
pnpm run dev                                           # terminal 1
node scripts/walkthroughs/record-payouts.mjs           # terminal 2: records WebM + caption beats
node scripts/walkthroughs/narrate.mjs tournament-payouts   # ElevenLabs audio (cached; skips if key missing)
node scripts/walkthroughs/assemble.mjs tournament-payouts  # muxes narration + burns captions -> MP4
```

Narration audio is cached by text+voice+model hash under
`scripts/walkthroughs/.cache/` so re-running assembly does not repeat paid API
calls. Delete the cache to force regeneration.

## Output

`walkthroughs/output/<name>/` — `<name>.webm`, `<name>.mp4`, `<name>.srt`,
`<name>.beats.json`, `<name>.narration.json`. All git-ignored.

## Adding a walkthrough

The editable source for each walkthrough is `walkthroughs/<name>/script.md`.
Each beat is a `### Beat N` section with bullet fields:

- `at` — optional fixed start time in seconds (used for the opening beat).
- `pause` — optional silence after this beat's narration (default 0.9s; the
  final beat's closing hold defaults to 3s).
- `action` — a recorder action name (see the walkthrough's `record-*.mjs`).
- `caption` — on-screen text AND the narration source. Spoken text is derived
  automatically (FliHub → "Fly Hub"); add `- say:` only to override.

Then narrate (generates `beats.json` + cached audio), record, and assemble:

```bash
node scripts/walkthroughs/narrate.mjs <name>
node scripts/walkthroughs/record-<name>.mjs
node scripts/walkthroughs/assemble.mjs <name>
```

`beats.json` is generated from the source — edit `script.md`, never the
generated JSON. The recorder drives the app UI only (no code/terminal footage).

## Existing walkthroughs

| Name | Subject |
|---|---|
| tournament-payouts | Payout testing, manager cut |
| active-projects-report | Review active projects, open a report |
| add-test-project | Add a project via the form |
| expense-approval-payment | Expense → approval → work order → simulated payment |
| talent-tournaments | Tournament area overview (read-only) |
| tournament-payout-review | Season Opener seed + payout review (production) |
