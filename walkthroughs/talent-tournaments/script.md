# Walkthrough Script: Talent Tournaments Overview

This is the editable source for the `talent-tournaments` walkthrough. Edit
beats below, then rebuild — narration, captions, and timing all derive from
this file. `beats.json`, captions, audio, and video are generated artifacts
under `walkthroughs/output/`; do not edit them by hand.

This is a read-only overview. The only form shown is opened and cancelled
without saving. No records are created, modified, or deleted.

Fields per beat:

- `at` — optional fixed start time in seconds (used for the opening beat).
- `pause` — optional silence (seconds) after this beat's narration before the
  next beat starts. Defaults to 0.9s; the final beat's closing hold defaults
  to 3s.
- `action` — the recorder action to perform (see record-talent-tournaments.mjs).
- `caption` — text shown on screen AND the narration source. Brand spellings
  stay intact here; the spoken form is derived automatically (FliHub → "Fly
  Hub").

### Beat 1
- at: 0.4
- action: open-tournaments
- caption: In FliHub, the Tournaments area lives under Talent in the sidebar.

### Beat 2
- action: show-overview
- caption: The overview shows a season banner, the season prize budget, and the tournament list.

### Beat 3
- action: show-filters
- caption: Season, status, and sort filters let you narrow the list, and each tournament shows a status badge.

### Beat 4
- action: show-list
- caption: Each card lists the tournament name, season, dates, location, prize pool, and the men's and women's purse split.

### Beat 5
- action: open-detail
- caption: Opening a tournament shows its details, payout structure, and placement payouts.

### Beat 6
- action: show-relationships
- caption: The page links to related records such as results, pro payments, manager cuts, and work orders where they exist.

### Beat 7
- action: open-create-form
- caption: The Create Tournament form collects name, season, dates, location, venue, prize pool, status, and notes.

### Beat 8
- action: cancel-form
- caption: We cancel without saving, so no tournament is created or changed.

### Beat 9
- action: show-final
- caption: For FliHub-2, CTG should assess how these tournament, payout, and results workflows adapt to the shared model.
