# Board One-Pager: Department -> Project -> Task Refactor

## Decision Request
Approve a pilot-first refactor to align the department-project-task workflow with the event-system operating model.

## Why Now
1. Current workflow has fragmented status handling and inconsistent action paths.
2. Event-style workflow already demonstrates cleaner execution and stronger operational visibility.
3. Incremental refactor reduces risk while unlocking measurable productivity gains.

## Business Outcomes
1. Faster execution: fewer clicks and handoffs
2. Better control: standardized transitions and validations
3. Better visibility: real-time summary rollups
4. Lower operating cost: shared UI/API patterns across modules

## Scope
In scope:

1. Lifecycle transitions and action-based workflow
2. Project/task summary cards and rollups
3. Approval/automation hooks for key states
4. Shared component and API convergence

Out of scope:

1. Full domain redesign
2. Big-bang migration
3. Non-critical reporting overhaul

## Delivery Plan (9 Weeks)
1. Week 1 (2026-06-22 to 2026-06-26): Discovery and state mapping
2. Weeks 2-3 (2026-06-29 to 2026-07-10): UX and interaction standardization
3. Weeks 4-5 (2026-07-13 to 2026-07-24): Transition engine alignment
4. Weeks 6-7 (2026-07-27 to 2026-08-07): Rollups, approvals, automation
5. Week 8 (2026-08-10 to 2026-08-14): Component/API convergence
6. Week 9 (2026-08-17 to 2026-08-21): Migration, hardening, pilot cutover

## Commit Milestones (Board Tracking)
Commit naming:

1. `refactor(projects): M# <phase> - <outcome>`

Milestone commits:

1. M0 (2026-06-22): Kickoff and baseline scope
```bash
git add -A
git commit -m "refactor(projects): M0 kickoff - baseline and pilot scope locked"
git tag -a refactor-projects-M0 -m "M0 kickoff - baseline and pilot scope locked"
```
2. M1 (2026-06-26): Discovery model approved
```bash
git add -A
git commit -m "refactor(projects): M1 discovery - state model and transition matrix approved"
git tag -a refactor-projects-M1 -m "M1 discovery - state model and transition matrix approved"
```
3. M2 (2026-07-03): UX foundation A complete
```bash
git add -A
git commit -m "refactor(projects): M2 ux-foundation-a - summary cards and status standards"
git tag -a refactor-projects-M2 -m "M2 ux-foundation-a - summary cards and status standards"
```
4. M3 (2026-07-10): UX foundation B complete
```bash
git add -A
git commit -m "refactor(projects): M3 ux-foundation-b - inline task actions and reduced click paths"
git tag -a refactor-projects-M3 -m "M3 ux-foundation-b - inline task actions and reduced click paths"
```
5. M4 (2026-07-24): Transition engine ready
```bash
git add -A
git commit -m "refactor(projects): M4 transition-engine - canonical status endpoints"
git tag -a refactor-projects-M4 -m "M4 transition-engine - canonical status endpoints"
```
6. M5 (2026-08-07): Rollups and approvals ready
```bash
git add -A
git commit -m "refactor(projects): M5 rollups-approvals - hooks and automation aligned"
git tag -a refactor-projects-M5 -m "M5 rollups-approvals - hooks and automation aligned"
```
7. M6 (2026-08-14): Component/API convergence ready
```bash
git add -A
git commit -m "refactor(projects): M6 convergence - shared components and API contracts"
git tag -a refactor-projects-M6 -m "M6 convergence - shared components and API contracts"
```
8. M7 (2026-08-21): Pilot cutover readiness
```bash
git add -A
git commit -m "refactor(projects): M7 pilot-cutover - migration and release readiness complete"
git tag -a refactor-projects-M7 -m "M7 pilot-cutover - migration and release readiness complete"
```

## Ownership
1. Product Owner: Scope and acceptance
2. Tech Lead: Architecture and standards
3. Full-Stack Engineer: UI/API implementation
4. Data/Platform Engineer: Rollups and migration integrity
5. QA Lead: Regression confidence and sign-off
6. Ops/Release Manager: Feature flags and rollout safety

## Success Metrics
1. 30%+ fewer clicks for top workflows
2. 25%+ faster status updates
3. <1% transition failure rate
4. Near-zero rollup discrepancy rate
5. Positive pilot user feedback

## Risks and Controls
1. Over-generalization risk -> Keep domain logic separate while reusing interaction patterns.
2. Dependency gaps risk -> Complete dependency inventory before backend changes.
3. Migration inconsistency risk -> Dry-run migration with shadow validation.
4. Adoption friction risk -> Feature-flag rollout and guided onboarding.

## Governance Gates
1. 2026-06-26: State model approval
2. 2026-07-10: UX phase acceptance
3. 2026-07-24: Transition engine readiness
4. 2026-08-14: Migration readiness
5. 2026-08-21: Pilot go/no-go

## Immediate Next Steps
1. Assign named owners to role placeholders.
2. Select pilot department and project type.
3. Capture baseline workflow metrics.
4. Open a weekly checkpoint cadence through pilot close.
