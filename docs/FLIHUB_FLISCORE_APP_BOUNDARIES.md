# FliHub and FliScore High-Level Ownership

## Purpose

This document defines which app owns which responsibilities at a high level.

Use this as the decision rule when adding features:
- If a feature concerns scoring truth, it belongs in FliScore.
- If a feature concerns money truth, approvals, and payout accounting, it belongs in FliHub.

## One-Sentence Split

- FliScore decides who finished where and why.
- FliHub decides what gets paid, when, and under what controls.

## Ownership by Domain

### FliScore Owns

- Tournament scoring workflow
- Tee sheets, groups, and live score capture
- Order of finish, tie states, and playoff resolution details
- Manual score corrections with scoring context
- Submission state (`partial`, `unofficial`, `final`) for competitive data
- Outbound result payload creation for FliHub

### FliHub Owns

- Canonical money fields for tournament payout accounting
- Prize parity checks and payout eligibility gates
- Approval workflows and policy enforcement
- Pro payments, franchise payouts, and work order generation
- Idempotent payout execution and audit logs
- Financial reporting, reconciliation, and payout status lifecycle

### Shared/Coordinated Areas

- Team and pro identity mapping (`pro`, `franchise`, `tournament` IDs)
- Submission contracts and schema versioning
- Error contracts for blocked runs
- Operational alerts for mismatch and failed payout runs

## System Boundaries (What Must Not Cross)

### Keep Out of FliScore

- Final payout accounting decisions
- Approval decisions for payout release
- Work order creation
- Independent prize pool authority

### Keep Out of FliHub

- Match/group scoring UI behavior
- Tie-break and playoff competitive adjudication logic
- Score-entry workflow design

## Interaction Model

1. FliScore prepares standings payload from scoring truth.
2. FliScore sends payload and submission metadata to FliHub.
3. FliHub validates identities, structure, and money parity.
4. FliHub blocks or executes payout generation.
5. FliHub returns run status and diagnostics.
6. FliScore displays sync outcome for operator action.

## Source-of-Truth Policy

- Competitive truth source: FliScore
  - placements, ties, playoff details, submission status
- Financial truth source: FliHub
  - payout amounts, approval state, paid/pending/blocked status

Temporary mirror policy:
- If a season prize pool exists in both systems, the non-canonical copy is validation-only.
- On mismatch, payout execution must fail closed.

## Responsibility Matrix

| Capability | FliScore | FliHub |
|---|---|---|
| Live score capture | Owner | Consumer |
| Final standings | Owner | Consumer |
| Tie/playoff narrative | Owner | Consumer |
| Result payload assembly | Owner | Validate/consume |
| Prize parity validation | Input provider | Owner |
| Payout calculation and creation | No | Owner |
| Approval workflow | No | Owner |
| Work orders | No | Owner |
| Payment audit log | No | Owner |
| Operator payout diagnostics | Display | Owner/source |

## Integration Contracts to Maintain

- Deterministic idempotency key per tournament + run type
- Validation before writes
- Atomic write behavior (all-or-nothing payout generation)
- Explicit blocked-state diagnostics
- Manual override provenance (`reason`, `approvedBy`, `approvedAt`)

## Decision Heuristics for New Features

Use these quick tests:

1. If wrong behavior would change leaderboard truth, implement in FliScore.
2. If wrong behavior would move money incorrectly, implement in FliHub.
3. If the feature touches both, keep logic in one app and expose results over contract boundaries.
4. Avoid dual-write rules for payout-critical values.

## Operating Principle

Optimize each app for its core truth:
- FliScore is optimized for competitive accuracy.
- FliHub is optimized for financial control and auditability.

That split reduces risk, simplifies debugging, and keeps payout governance reliable as volume grows.
