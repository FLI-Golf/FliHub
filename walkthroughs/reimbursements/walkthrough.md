# Walkthrough: Read-only Reimbursement Review

Read-only claimant/admin tour for CTG's consolidation into FliHub-2 Shared.
Source findings and verification limits are in the
[review report](../../docs/reviews/original-reimbursements-review.md).

## Prerequisites and safety

- Run `pnpm run dev` in another terminal; use `http://localhost:5173` inside
  the Codespace, not the deployed Netlify application.
- Follow [the shared prerequisites](../README.md), including Chromium,
  Playwright's ffmpeg, and system ffmpeg/ffprobe.
- Provide `DEMO_USER` and `DEMO_PASSWORD` through the existing ignored
  environment configuration. Shared walkthrough login overrides are supported.
- Confirm every visible account, financial, contact, receipt and statement
  entry is synthetic before passing `--demo-data-confirmed`. A demo login alone
  does not establish data provenance. Stop if real information appears.
- Narration uses the existing ElevenLabs configuration/cache; only the generic
  text in [script.md](./script.md) is sent for speech, never app data or secrets.
  Without its configured key, the shared tools produce captions but no speech.
- Authentication occurs through the UI before recording. State transfers only
  in memory to an ephemeral recording context; no persistent auth profile,
  cookies, tokens, or storage-state file is saved. The configured login strings
  are masked in the rendered document.
- Non-read browser requests are blocked after sign-in; an attempted write fails
  the recording. No seed/reset/cleanup mutations exist in this walkthrough.

## Reproduce

From the repository root, with the dev server already running:

```bash
node scripts/walkthroughs/narrate.mjs reimbursements
node scripts/walkthroughs/record-reimbursements.mjs --demo-data-confirmed
node scripts/walkthroughs/assemble.mjs reimbursements
```

The recorder deliberately accepts only localhost/loopback on port 5173. Override
`WALKTHROUGH_BASE_URL` to another loopback spelling only if needed. Shared viewport
and Chromium overrides follow the main guide.

## Source and outputs

- Recorder: [record-reimbursements.mjs](../../scripts/walkthroughs/record-reimbursements.mjs)
- Caption/narration source: [script.md](./script.md)
- Narrated video: `walkthroughs/output/reimbursements/reimbursements.mp4`
- Raw silent capture: `walkthroughs/output/reimbursements/reimbursements.webm`
- Captions/timing/audio manifest: `reimbursements.srt`,
  `reimbursements.beats.json`, `reimbursements.narration.json` in that folder.
- Sanitized observations: `reimbursements.observations.json` in that folder.
- Earlier session recording is preserved as
  `walkthroughs/output/reimbursements/original-reimbursements-local.webm`.
  It is silent and is not the newly narrated deliverable.

## Steps and verification limits

The 2026-10-17 run against `3ff5c279f4a4a8f706cf8599a68d7479a852dead`
completed all ten beats with login HTTP 200, zero non-login mutation attempts
and zero browser page errors. The assembled MP4 is 115.48 seconds, 1280 x 720,
H.264/AAC with ten narration clips and burned-in captions. Audio analysis
confirmed a non-silent signal; sample frames were visually checked. These are
recording checks, not tests of live writes or accounting correctness.

Expand the vault and item finder; inspect a claimant detail; open and close the
blank form; follow Admin View if available; inspect an admin detail and the
approved-status filter. Controls are observed, never invoked for record changes.
When admin access or claim rows are unavailable, stop rather than narrate a
successful action that was not demonstrated. An empty approved filter is valid
and does not demonstrate a payment form. When approved rows exist, the recorder
shows only their presence, not payment execution.

This does not verify receipt contents, upload persistence, amount-boundary
validation, review/payment execution, external accounting, or other-role denials.
No project/department policy, cap, or tax/compliance claim is approved by recording
the current implementation. No FliHub-2 parity is asserted.
