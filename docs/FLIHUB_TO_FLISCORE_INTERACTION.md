# FliHub to FliScore Interaction Guide

## Purpose

This document defines how FliScore (scoring app) and FliHub (finance and operations app) should interact for tournament result ingestion and payout control.

Primary goal:
- Keep money tracking in one place.
- Prevent payout drift between systems.
- Ensure every payout run is auditable and repeatable.

## Current Status (Temporary)

Payload exchange between FliScore and FliHub is currently on hold.

Temporary operational approach:
- Final tournament input is a confirmed 12-franchise order of finish entered directly in FliHub.
- Detailed scoring context (ties, playoffs, hole-level or round-level narrative) is optional and not required for payout execution in this mode.
- FliHub remains the only payout execution and accounting authority.

Integration readiness note:
- The payload model in this document remains the target design if cross-app wiring is resumed later.

## System Roles

- FliScore:
  - Captures standings, ties, playoff outcomes, and manual scoring adjustments.
  - Produces a clean result payload for FliHub.

- FliHub:
  - Canonical source of truth for payout accounting.
  - Validates payload integrity before payout generation.
  - Creates and tracks payout records (pro payments, franchise payouts, work orders).

## Source of Truth Rules

- Tournament money values are canonical in FliHub.
- Any mirrored season-level prize pool value is validation-only.
- Payout generation must stop if mirror and canonical values do not match.

Temporary transition rule:
- Keep `season_settings.prizePool` until payout generation no longer depends on it.
- Treat it as a strict parity check against FliHub tournament amount.
- Later, remove it as a writable source.

## High-Level Data Flow

1. Tournament finalized or partially submitted in FliScore.
2. FliScore builds `tournament_results` payload (2 pro rows per team).
3. FliScore sends payload and metadata to FliHub.
4. FliHub runs validation gates before writing payout artifacts.
5. If validation passes, FliHub creates payout records atomically.
6. FliHub logs run result and returns run summary.

Current temporary data flow (manual order mode):

1. Operator enters final 12-franchise order in FliHub.
2. Operator confirms the order is final.
3. FliHub validates payout prerequisites.
4. FliHub generates payout artifacts atomically.
5. FliHub logs execution and reconciliation details.

## Payload Contract (FliScore -> FliHub)

Required fields per result row:
- `tournament`
- `pro`
- `franchise`
- `placement`
- `score`
- `rounds`
- `notes`
- `franchiseRank`

Recommended extended fields for advanced flows:
- `placementDisplay` (example: `T2`)
- `isTie`
- `tieGroupId`
- `playoffUsed`
- `playoffRank`
- `playoffNotes`
- `isProvisional`
- `source` (`auto` or `manual`)

Submission metadata:
- `submissionType` (`partial` or `final`)
- `tournamentStatus` (`live`, `unofficial`, `final`)
- `idempotencyKey`

## Validation Gates in FliHub (Must Pass Before Writes)

### 1) Numeric prize parity

- Parse both values as decimals.
- Round to 2 decimal places before comparison.
- Reject null, undefined, NaN, and negative values.
- Block payout generation on mismatch.

Minimum mismatch diagnostics:
- `tournamentId`
- `seasonId`
- `seasonPrizePool`
- `fliHubTournamentAmount`
- `absoluteDelta`
- clear operator message: "payout blocked due to prize pool mismatch"

### 2) Structural payload checks

- Exactly 2 pros per team.
- No duplicate pro IDs in a tournament submission.
- `prosCount = teamsCount x 2`.
- Placement values valid for submission mode.

### 3) Tie and playoff integrity

- Tied rows must include `tieGroupId`.
- Playoff-resolved rows must include `playoffNotes`.
- Do not silently reorder tied placements without explicit playoff or approved manual override.

### 4) Partial submission handling

- Allow partial standings in `partial` mode.
- Mark records as provisional.
- Require warnings for excluded placements.
- Do not mark payout run as final settlement.

### 5) Manual override controls

Manual changes must include:
- `field`
- `oldValue`
- `newValue`
- `reason`
- `approvedBy`
- `approvedAt`

If missing any required approval metadata, reject override.

## Atomic and Idempotent Payout Generation

- Run validation before creating payouts or work orders.
- Execute payout generation inside a transaction.
- If any write fails, roll back all writes.
- Prevent duplicate payouts using deterministic idempotency keys.

Suggested idempotency key components:
- `tournamentId`
- payout run type (`partial` or `final`)
- ordered tuple hash of placement and pro rows

## Audit Logging Requirements

For every run (blocked or successful), write audit log entries with:
- actor (who initiated)
- timestamp
- tournament ID
- submission type
- idempotency key
- validation result
- mismatch details if blocked
- record counts if successful

## Error Handling Contract

On hard block (example: parity mismatch), return:
- `status = blocked`
- human-readable operator message
- machine-readable error code
- diagnostic object with amounts and delta

No payout records should be created in blocked state.

## Recommended Test Cases

- exact prize parity match
- 0.01 prize mismatch
- missing season amount
- missing FliHub amount
- negative amount value
- duplicate pro ID in one submission
- tie without tieGroupId
- playoffUsed true without playoffNotes
- final mode with incomplete placements
- rerun same request verifies idempotent behavior

## Migration Plan

Phase 1:
- Keep season mirror field.
- Enforce strict parity check and fail closed behavior.
- Add diagnostics, audit logging, and tests.

Phase 2:
- Refactor payout generation to read monetary source only from FliHub canonical fields.
- Remove `season_settings.prizePool` as writable input.
- Keep optional read-only display mirror if needed.

## Operational Notes

- Finance and operations should treat FliHub payout logs as authoritative.
- FliScore should remain authoritative for score ordering, ties, playoff context, and submission state.
- Any manual payout-impacting change requires approval metadata.
