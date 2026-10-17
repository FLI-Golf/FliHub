# Walkthrough Script: Tournament Payout Review

This is the editable source for the `tournament-payout-review` walkthrough.
Edit beats below, then rebuild — narration, captions, and timing all derive
from this file. `beats.json`, captions, audio, and video are generated
artifacts under `walkthroughs/output/`; do not edit them by hand.

Scope: seed the FLI Golf Season Opener only, then review the results. No other
tournament is seeded, nothing is reset, and no payments are initiated.

Fields per beat:

- `at` — optional fixed start time in seconds (used for the opening beat).
- `pause` — optional silence (seconds) after this beat's narration before the
  next beat starts. Defaults to 0.9s; the final beat's closing hold defaults
  to 3s.
- `action` — the recorder action to perform (see record-tournament-payout-review.mjs).
- `caption` — text shown on screen AND the narration source. Brand spellings
  stay intact here; the spoken form is derived automatically (FliHub → "Fly
  Hub"). Add `- say:` only when the spoken form must differ from the caption.

### Beat 1
- at: 0.4
- action: open-payout-testing
- caption: In FliHub, the payout testing page lists each tournament with its prize pool and seed status.

### Beat 2
- action: show-not-seeded
- caption: The FLI Golf Season Opener is a five-hundred-thousand-dollar tournament, currently not seeded.

### Beat 3
- action: seed-opener
- caption: We seed the Season Opener once to produce its finishing order.

### Beat 4
- action: show-standings
- caption: Seeding creates the team standings and the finishing order for both divisions.

### Beat 5
- action: expand-opener
- caption: Expanding the tournament shows the prize pool math check and each pro's calculated payout.

### Beat 6
- action: show-pro-rows
- caption: Each row lists the pro's gross payout, the manager's percentage cut, and the resulting net amount.

### Beat 7
- action: show-pool-math
- caption: The pool splits a franchise share from the pro share, then divides the pro share equally between the two divisions.

### Beat 8
- action: show-links
- caption: Where present, results link to pro records, payments, and work orders. Missing connections are called out.

### Beat 9
- action: show-reconcile
- caption: The math check compares the settled total against the prize pool to surface any discrepancy.

### Beat 10
- action: show-final
- caption: These are calculated payouts, not yet approved obligations or actual payments.
