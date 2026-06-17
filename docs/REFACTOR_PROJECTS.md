# Executive Brief: Refactor Department -> Project -> Task

## Why This Matters
We should refactor the department-project-task workflow to follow the event system model because it is clearer, faster, and more reliable in day-to-day operations.

Expected business outcomes:

1. Faster workflow execution (fewer clicks, fewer handoffs)
2. Better visibility (real-time summary cards and status rollups)
3. Fewer operational errors (standardized transitions and validations)
4. Lower maintenance cost (shared components and API patterns)

## Strategic Recommendation
Proceed with a pilot-first refactor over 9 weeks, then scale.

Do not perform a full rewrite. Use phased delivery with feature flags and additive APIs.

## Scope (In/Out)
In scope:

1. Workflow interaction model (status transitions, quick actions)
2. Summary and rollup visibility
3. Approval and automation hooks for key transitions
4. Shared UI/API patterns across modules

Out of scope for this initiative:

1. Full domain redesign
2. Big-bang migration across all departments at once
3. Non-essential reporting redesign unrelated to transition flow

## Timeline and Owners
Start date: 2026-06-22
Target pilot completion: 2026-08-21

Owner roles:

1. Product Owner (PO): Scope and acceptance
2. Tech Lead (TL): Architecture and standards
3. Full-Stack Engineer (FSE): UI/API implementation
4. Data/Platform Engineer (DPE): Rollups, migrations, integrity
5. QA Lead (QA): Regression and release confidence
6. Ops/Release Manager (OPS): Feature flags and cutover safety

Phase schedule:

1. Week 1 (06-22 to 06-26): Discovery and state mapping
Owner: PO (primary), TL, QA

2. Weeks 2-3 (06-29 to 07-10): UX and interaction standardization
Owner: FSE (primary), TL, QA

3. Weeks 4-5 (07-13 to 07-24): Transition engine alignment
Owner: TL (primary), FSE, QA

4. Weeks 6-7 (07-27 to 08-07): Rollups, approvals, automation
Owner: DPE (primary), FSE, TL, QA

5. Week 8 (08-10 to 08-14): Component/API convergence
Owner: TL (primary), FSE, DPE

6. Week 9 (08-17 to 08-21): Migration, hardening, pilot cutover
Owner: DPE (primary), QA, OPS, TL

## Commit Cadence and Naming (Milestone-Aligned)
Use commit checkpoints at the end of each phase and major gate.

Commit format:

1. `refactor(projects): M# <phase-name> - <short outcome>`

Tag format:

1. `refactor-projects-M#`

Planned commit points:

1. M0 (2026-06-22): `refactor(projects): M0 kickoff - baseline and pilot scope locked`
```bash
git add -A
git commit -m "refactor(projects): M0 kickoff - baseline and pilot scope locked"
git tag -a refactor-projects-M0 -m "M0 kickoff - baseline and pilot scope locked"
```
2. M1 (2026-06-26): `refactor(projects): M1 discovery - state model and transition matrix approved`
```bash
git add -A
git commit -m "refactor(projects): M1 discovery - state model and transition matrix approved"
git tag -a refactor-projects-M1 -m "M1 discovery - state model and transition matrix approved"
```
3. M2 (2026-07-03): `refactor(projects): M2 ux-foundation-a - summary cards and status standards`
```bash
git add -A
git commit -m "refactor(projects): M2 ux-foundation-a - summary cards and status standards"
git tag -a refactor-projects-M2 -m "M2 ux-foundation-a - summary cards and status standards"
```
4. M3 (2026-07-10): `refactor(projects): M3 ux-foundation-b - inline task actions and reduced click paths`
```bash
git add -A
git commit -m "refactor(projects): M3 ux-foundation-b - inline task actions and reduced click paths"
git tag -a refactor-projects-M3 -m "M3 ux-foundation-b - inline task actions and reduced click paths"
```
5. M4 (2026-07-24): `refactor(projects): M4 transition-engine - canonical status endpoints`
```bash
git add -A
git commit -m "refactor(projects): M4 transition-engine - canonical status endpoints"
git tag -a refactor-projects-M4 -m "M4 transition-engine - canonical status endpoints"
```
6. M5 (2026-08-07): `refactor(projects): M5 rollups-approvals - hooks and automation aligned`
```bash
git add -A
git commit -m "refactor(projects): M5 rollups-approvals - hooks and automation aligned"
git tag -a refactor-projects-M5 -m "M5 rollups-approvals - hooks and automation aligned"
```
7. M6 (2026-08-14): `refactor(projects): M6 convergence - shared components and API contracts`
```bash
git add -A
git commit -m "refactor(projects): M6 convergence - shared components and API contracts"
git tag -a refactor-projects-M6 -m "M6 convergence - shared components and API contracts"
```
8. M7 (2026-08-21): `refactor(projects): M7 pilot-cutover - migration and release readiness complete`
```bash
git add -A
git commit -m "refactor(projects): M7 pilot-cutover - migration and release readiness complete"
git tag -a refactor-projects-M7 -m "M7 pilot-cutover - migration and release readiness complete"
```

Recommended commit discipline:

1. Squash per milestone workstream before merging to keep milestone history clean.
2. Include a short `Metrics:` line in each milestone commit body (click reduction, failure rate, rollup parity).
3. Add `Risk:` and `Rollback:` lines in milestone commit bodies for M4 and later.

## Success Criteria
Target outcomes for pilot:

1. 30%+ fewer clicks for top workflows
2. 25%+ faster status updates
3. <1% transition failure rate
4. Near-zero rollup discrepancies
5. Positive user feedback from pilot group

## Top Risks and Controls
1. Risk: Over-generalizing event behavior into project domain
Control: Reuse patterns, keep domain rules separate

2. Risk: Hidden dependencies in approvals/reporting
Control: Complete dependency inventory before build phases

3. Risk: Migration mismatch
Control: Dry-run migration plus shadow validation before cutover

4. Risk: Adoption friction
Control: Feature-flag rollout, pilot training, in-UI guidance

## Decision Gates
1. 2026-06-26: Approve state model and proceed
2. 2026-07-10: Approve UX phase quality
3. 2026-07-24: Approve transition engine readiness
4. 2026-08-14: Approve migration readiness
5. 2026-08-21: Pilot go/no-go for scale-out

## Immediate Actions (This Week)
1. Assign names to PO/TL/FSE/DPE/QA/OPS
2. Select pilot department and project type
3. Capture baseline workflow metrics
4. Create tracking board aligned to the 9-week plan

## Executive Ask
Approve pilot-first execution beginning 2026-06-22 with weekly checkpoint reviews and a go/no-go decision on 2026-08-21.
