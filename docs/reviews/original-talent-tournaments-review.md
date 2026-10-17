# Review: Original FliHub — Talent Tournaments Overview

**Walkthrough:** `talent-tournaments`
**Video:** `walkthroughs/output/talent-tournaments/talent-tournaments.mp4` (67.2s, 1280×720, narrated + captioned)
**Reviewed commit:** `3ff5c279f4a4a8f706cf8599a68d7479a852dead` — "fix(ci): install pnpm before Node cache setup" (2026-10-17), branch `share-specs-for-ctg`

## Scope

A focused, read-only overview of the Tournament area at
`/dashboard/talent/tournaments`, recorded for CTG's discovery review. Driven
entirely through the running app UI with the demo account. No records were
created, modified, or deleted; the Create Tournament form was opened and
cancelled without saving.

## What was demonstrated

1. **Navigation** — Tournaments lives under Talent in the sidebar.
2. **Overview** — season banner, season prize budget summary, and the
   tournament list (6 demo tournaments).
3. **Search/filters/status** — season, status, and sort filters narrow the
   list; each tournament shows a status badge.
4. **Tournament detail** — opened an existing tournament (FLI Golf Season
   Opener) showing its payout structure and placement payouts.
5. **Relationships** — the detail view links to related records (results, pro
   payments, manager cuts, work orders) where present.
6. **Create/edit form** — the Create Tournament form was shown with its fields
   (name, season, dates, location, venue, prize pool, status, notes), then
   cancelled without saving.

All actions were explained only where actually shown; nothing was claimed to
work that wasn't demonstrated.

## Relevant code paths

- Page: [src/routes/dashboard/talent/tournaments/+page.svelte](src/routes/dashboard/talent/tournaments/+page.svelte) and [+page.server.ts](src/routes/dashboard/talent/tournaments/+page.server.ts)
- Detail: [src/routes/dashboard/talent/tournaments/[id]/](src/routes/dashboard/talent/tournaments/[id]/)
- Payout math: [src/lib/domain/services/PayoutCalculator.ts](src/lib/domain/services/PayoutCalculator.ts)

## Questions for CTG (FliHub-2 — Shared)

- How should tournament, payout, and results workflows map onto the shared model?
- Which of these relationships (pro payments, manager cuts, work orders) carry
  over, and which are FliHub-Original-specific?
- What changes are needed to the create/edit form for the shared data model?

*No FliHub-2 coverage is claimed — FliHub-2 was not inspected for this review.*

## Verification

- All 9 narration beats present and matched to captions.
- Speech present at every beat (measured −24 to −26 dB).
- Final sentence ends at 63.5s; video holds to 67.2s (3.7s closing hold).
- Confirmed no new tournament record was created (count stayed 6).

## Limitations

- Read-only: the Create Tournament submit/save path was not exercised (form
  cancelled by design), so save behavior is not demonstrated.
- Related-record links were shown only where data exists; empty sections were
  not forced.
- The recording used the existing demo tournament data as-is.

## Data

No demonstration records were created. Nothing to clean up.

## Reproduce

```bash
pnpm run dev
node scripts/walkthroughs/narrate.mjs talent-tournaments
node scripts/walkthroughs/record-talent-tournaments.mjs
node scripts/walkthroughs/assemble.mjs talent-tournaments
```
