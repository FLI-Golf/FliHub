# Walkthrough Script: Review Active Projects and Open a Report

This is the editable source for the `active-projects-report` walkthrough.
Edit beats below, then rebuild — narration, captions, and timing all derive
from this file. `beats.json`, captions, audio, and video are generated
artifacts under `walkthroughs/output/`; do not edit them by hand.

Fields per beat:

- `at` — optional fixed start time in seconds (used for the opening beat).
- `pause` — optional silence (seconds) after this beat's narration before the
  next beat starts. Defaults to 0.9s; the final beat's closing hold defaults
  to 3s.
- `action` — the recorder action to perform (see record-active-projects.mjs).
- `caption` — text shown on screen AND the narration source. Brand spellings
  stay intact here; the spoken form is derived automatically (FliHub → "Fly
  Hub").

### Beat 1
- at: 0.4
- action: open-dashboard
- caption: In FliHub, an admin opens the Active Projects dashboard.

### Beat 2
- action: show-summary
- caption: The summary cards show committed sponsorships, franchise pipeline, and active work at a glance.

### Beat 3
- action: show-first-cards
- caption: Each card lists a project's name, department, status, and key counts.

### Beat 4
- action: scroll-all
- caption: Scrolling through the list, we review every active project in order.

### Beat 5
- action: settle-first
- caption: We pause on each card so its name, status, and summary stay readable.

### Beat 6
- action: open-report
- caption: Opening one project's report generates a printable summary.

### Beat 7
- action: show-report
- caption: The report loads with the project's full breakdown.
