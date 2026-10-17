# Review: Original FliHub — Tournament Payout Workflow (Season Opener)

**Walkthrough:** `tournament-payout-review`
**Video:** `walkthroughs/output/tournament-payout-review/tournament-payout-review.mp4` (69.7s, 1280×720, narrated + captioned)
**Production target:** <https://flihub.netlify.app/dashboard/talent/payout-testing>
**Locally inspected source commit:** `3ff5c279f4a4a8f706cf8599a68d7479a852dead` — "fix(ci): install pnpm before Node cache setup" (branch `share-specs-for-ctg`)

## Verification limits — read first

- **The UI demonstration ran against production** (Netlify). The **source code was inspected locally** at the commit above. I could not confirm the deployed Netlify build matches the inspected commit; the deployed revision is unknown. Statements about behavior are based on local source plus observed production output, and are not proof the deployed code is identical.
- Production backend in use is the PocketBase instance the Netlify app is configured against. The local dev app uses `pocketbase-production-6ab5.up.railway.app`. I did **not** verify whether Netlify points to the same backend; production state was read through the UI and via the configured backend.

## What was done

Signed in through the production UI with the demo account, confirmed the Season
Opener showed "Not seeded," then clicked **Seed Results** once. No other
tournament was seeded, nothing was reset, no payouts were marked paid, and no
external integration was triggered.

## Seed handler behavior (inspected source)

`seedTournament` in [payout-testing/+page.server.ts](src/routes/dashboard/talent/payout-testing/+page.server.ts):

1. Deletes/re-creates `tournament_results`, `pro_payments`, `franchise_payouts`
   scoped to this `tournamentId` only.
2. Sets the tournament `status='completed'`.
3. Creates 24 `tournament_results` (12 men's + 12 women's placements) with
   **all earnings fields = 0** — standings only.
4. Writes `managerName` / `managerEmail` / `managerCutPercentage` onto 8 shared
   `talent` (Pro) records.

### Shared Pro-record impact (flagged and authorized)

The manager-field writes target **global** `talent` records, not
tournament-scoped rows — so seeding touches records shared beyond this
tournament. Verified against the connected backend: all 8 target Pros already
held exactly the seed values, so these writes were **no-ops in effect**
(Gannon Buhr, Ricky Wysocki, Calvin Heimburg, Eagle McMahon, Kristin Latt
[alias for "Kristin Tattar"], Paige Pierce, Evelina Salonen, Natalie Ryan).
This impact was reported and authorized before seeding.

## Records created/changed by the seed

- **24 `tournament_results`** for tournament `2najeglkb5rq5av` (Season Opener),
  e.g. placements #1 Gannon Buhr / Kristin Latt through #12, all with
  `earnings=0, proEarnings=0, managerEarnings=0, netProEarnings=0, franchiseEarnings=0, managerCutPercentage=0`.
- **Tournament `2najeglkb5rq5av`** → `status` changed `scheduled → completed`.
- **8 `talent` records** received manager-field writes (no-ops; values unchanged).

No `pro_payments` were created (`pro_payments` for this tournament = 0), no
approvals or work orders were created, and no bank/payment record changed.

## How the $500,000 pool is distributed (implemented rules)

From [PayoutCalculator.ts](src/lib/domain/services/PayoutCalculator.ts): the
pool splits off a franchise cut (default 20%), the remainder is the pro cut,
split evenly between the two divisions, then distributed per placement with a
top-heavy curve (1st 30%, 2nd 20%, 3rd 15%, remaining 35% decaying at 0.85).

**Critical distinction — calculated vs. stored:** seeding creates standings
with **zero stored earnings**. The dollar amounts are **calculated at read
time** when loading the tournament detail page
([tournaments/[id]/+page.server.ts](src/routes/dashboard/talent/tournaments/[id]/+page.server.ts)),
which enriches each standings row: `proEarnings` from the placement→purse map,
franchise cut from `franchiseCutPercentage`, manager cut from the Pro's
`managerCutPercentage`, and `netProEarnings = proEarnings − managerEarnings`.
`calcPayouts` exists in the payout-testing source but is **never called** there.

## Verification of what production displays

After seeding, the Season Opener card on production showed **Complete** with a
24-result team standings table. The stored result rows carry zero earnings;
dollar amounts shown on the detail page are derived on load, not stored. This
matches the "standings now, payouts calculated on read" behavior in the source.

## Traced example

Placement #1 men's (Gannon Buhr): stored result has `proEarnings=0`. On the
detail page, the load derives proEarnings from the placement map for the $500k
pool, applies the manager cut from the Pro's `managerCutPercentage`, and nets
the difference. These are **calculated payout figures**, not approved
obligations or actual payments.

## Links / missing connections

- Results link to Pro records (`pro` relation) — present.
- `tournamentResult` → `pro_payments` links exist in schema but **no payment
  records were created** by this seed — none to trace.
- No approvals or work orders were generated by seeding.
- Manager/franchise relationships are derived from roster mapping at read time,
  not stored as relations on the result rows.

## Reconciliation / discrepancies

- **Stored vs. displayed:** stored earnings are 0; displayed amounts are
  computed on read. A reader of raw `tournament_results` sees zeros.
- **Calculated vs. actual:** all amounts are calculated estimates; nothing is
  approved or paid. The math check's "settled total" relies on
  `pro_payments`/`franchise_payouts`, which are empty after a standings-only
  seed.
- No rounding discrepancy was observable because no amounts are persisted.

## Reproduce

```bash
WALKTHROUGH_BASE_URL=https://flihub.netlify.app node scripts/walkthroughs/record-tournament-payout-review.mjs
node scripts/walkthroughs/narrate.mjs tournament-payout-review
node scripts/walkthroughs/assemble.mjs tournament-payout-review
```

## Cleanup

The 24 seeded `tournament_results` for tournament `2najeglkb5rq5av` and the
tournament's `status` change are left in place for review.
