# Walkthrough: Active Goals

A read-only narrated tour for CTG: navigate to Active Goals, review its summaries
and goal cards, expand supporting tasks, open an existing goal, inspect one task,
open/cancel the blank Add Task form, and return through Marketing Goals.
Goals are marketing objectives, not projects or individual tasks.

## Prerequisites and safety

- Follow the [shared walkthrough setup](../README.md): Chromium/Playwright,
  capture ffmpeg, system ffmpeg/ffprobe, and the existing narration configuration.
- Run the local development app with `pnpm run dev` on port 5173.
- Supply `DEMO_USER` and `DEMO_PASSWORD` through the existing ignored environment
  configuration. The shared walkthrough login overrides also work. Missing
  credentials are reported by variable name, never value.
- Confirm all visible goals, task descriptions, contacts, linked records and
  amounts are synthetic before using `--demo-data-confirmed`. Stop if real
  information appears. The recorded run used the user's explicit confirmation;
  data provenance was not independently audited.
- UI authentication occurs before capture. Storage state is transferred only
  in memory into a new ephemeral context, never saved as an auth file/profile.
  Configured login strings and email text are masked in the rendered document.
- All non-read browser requests are blocked except the initial UI login POST.
  No goal/task writes, report POSTs, expense logging, seeding or reset occurs.
  Visible action buttons do not establish authorization or successful execution.
- Only generic text from [script.md](./script.md) is sent to the existing speech
  integration, never application records, login information or authentication
  state. This recorder requires a complete narration manifest; it refuses the
  shared narrator's silent fallback when speech configuration is missing.

## Reproduce

From the repository root, with the development app already running:

```bash
node scripts/walkthroughs/narrate.mjs active-goals
node scripts/walkthroughs/record-active-goals.mjs --demo-data-confirmed
node scripts/walkthroughs/assemble.mjs active-goals
```

Optional unrecorded navigation/selector inspection:

```bash
node scripts/walkthroughs/record-active-goals.mjs --inspect
```

This prints sanitized counts/booleans only. It neither creates a recording nor
exports authentication state. Both modes accept only loopback on port 5173.
The recorded path requires at least one existing active goal and one child task;
it fails instead of seeding records or narrating a missing detail as demonstrated.

## Sources and output

- [Caption/narration source](./script.md).
- [Playwright recorder](../../scripts/walkthroughs/record-active-goals.mjs).
- [Review notes](../../docs/reviews/original-active-goals-review.md).
- Narrated/captioned MP4:
  `walkthroughs/output/active-goals/active-goals.mp4`.
- Raw silent capture: `walkthroughs/output/active-goals/active-goals.webm`.
- Generated captions, beats, narration and sanitized observations:
  `active-goals.srt`, `active-goals.beats.json`, `active-goals.narration.json`,
  `active-goals.observations.json` in the same ignored directory.

The 2026-10-17 recording reviewed branch `share-specs-for-ctg`, commit
`3ff5c279f4a4a8f706cf8599a68d7479a852dead`, using `http://localhost:5173`.
Media: 138.96 seconds, 1280 x 720, H.264/AAC, ten non-overlapping narration
clips with pauses and burned-in captions. Sample frames and a non-silent audio
signal were checked. Login returned HTTP 200; all ten steps completed with
zero non-login mutation attempts and zero browser page errors.

## Demonstrated scope and limits

- The run displayed three active goal cards, overview summaries and a populated
  task list. The first goal had five tasks; one task detail is shown in the video.
- An unrecorded inspection expanded all five tasks of that goal; none displayed
  linked approval, expense or work-order summaries. The video does not imply that
  those records exist. Their conditional rendering is source-inspected only.
- Report PDF, Log Expense/Set Cost First, Update Goal, task transition and Delete
  controls were not invoked. Add Task was opened blank, then cancelled.
- The active view has no search/status selector. All Marketing Goals and Back to
  Goals are navigation, not filters. No unrelated records or financial pages
  were opened.
- No create/update/completion/archive/delete, report generation, payment,
  integration or other-role permission behavior is demonstrated. FliHub-2 Shared
  was not inspected; no parity or requirement coverage is claimed.
