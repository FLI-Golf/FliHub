# Walkthrough: Review Active Projects and Open a Report

A read-only tour of the Active Projects dashboard, ending on one project's
generated report.

- **Video:** `walkthroughs/output/active-projects-report/active-projects-report.mp4`
- **Duration:** 59.2s · 1280×720 · H.264 + AAC
- **Voice:** Rachel (`21m00Tcm4TlvDq8ikWAM`), ElevenLabs `eleven_multilingual_v2`
- **Recording commit:** branch `docs/feature-walkthroughs`

## Starting state

- Authenticated as the demo admin (`DEMO_USER` / `DEMO_PASSWORD` from `.env`).
- Recording begins on `/dashboard/active-projects`, fully loaded.
- The page shows projects filtered to `status = "in_progress"`, sorted by name.

## Actions and expected results

| Step | Action | Expected result |
|---|---|---|
| 1 | Open Active Projects | Page header and summary cards render |
| 2 | Review summary cards | Committed sponsorships, franchise pipeline, active work visible |
| 3 | Bring first project cards into view | Each card shows name, department, status, counts |
| 4 | Scroll through the list | Every active project is shown in displayed order |
| 5 | Settle on the first project | Its card is readable and stable |
| 6 | Click **Report** on that project | App generates the report (`/api/projects/[id]/report/view`) |
| 7 | Show the loaded report | Printable project summary is displayed; video ends here |

## Narration (per step)

1. "In Fly Hub, an admin opens the Active Projects dashboard."
2. "The summary cards show committed sponsorships, franchise pipeline, and active work at a glance."
3. "Each card lists a project's name, department, status, and key counts."
4. "Scrolling through the list, we review every active project in order."
5. "We pause on each card so its name, status, and summary stay readable."
6. "Opening one project's report generates a printable summary."
7. "The report loads with the project's full breakdown. This is where we end."

(Pronunciation: FLI → "Fly", FliHub → "Fly Hub". The single editable source is
`script.md` — captions double as narration text and the spoken form is derived
automatically. `beats.json`, captions, audio, and video are generated artifacts
under `walkthroughs/output/`; do not edit them by hand.)

## Timing and final hold

- The opening beat is pinned to **0.4s** (the earlier duplicate at 10s is removed).
- Beat times are computed from measured clip durations: each beat starts after
  the previous sentence ends plus its pause, so sentences never overlap.
- The closing sentence ends at ~39.1s and the video holds to 42.2s (**3.1s**).
- This walkthrough is read-only; no demo-data reset applies.

## Reproduce

Edit `script.md`, then rebuild everything from it:

```bash
pnpm run dev   # app must be running
node scripts/walkthroughs/narrate.mjs active-projects-report
node scripts/walkthroughs/record-active-projects.mjs
node scripts/walkthroughs/assemble.mjs active-projects-report
```

## Observed gaps

- The page renders 15 in-progress projects in a two-column grid; the recording
  scrolls through them with a brief pause each rather than a long dwell per card.
- The report opens in a new tab in the live app; for a single continuous video
  the same report URL is loaded in the recorded tab after the click.
- The report is a generated PDF view; it reflects the first project's data only
  (we do not open every report).
