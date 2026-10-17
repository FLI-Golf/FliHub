# FliHub Original: Active Goals walkthrough for CTG

## Review context

| Item | Context |
|---|---|
| Review date | 2026-10-17 |
| Branch | `share-specs-for-ctg` |
| Reviewed commit | `3ff5c279f4a4a8f706cf8599a68d7479a852dead` |
| Environment | Local development app, <http://localhost:5173> |
| Primary route | <http://localhost:5173/dashboard/active-goals> |
| Related screens | `/dashboard/marketing-goals` and `/dashboard/marketing-goals/[id]` |
| Account | One demo account, normal UI login using privately loaded environment configuration; login POST HTTP 200 |
| Video | [active-goals.mp4](../../walkthroughs/output/active-goals/active-goals.mp4), 138.96 seconds, 1280 x 720, H.264 video / AAC narration, 3,981,713 bytes |
| Reproduction | [Instructions](../../walkthroughs/active-goals/walkthrough.md), [caption/narration source](../../walkthroughs/active-goals/script.md), [recorder](../../scripts/walkthroughs/record-active-goals.mjs) |

This is a demonstration/reference review, not approval of Original's current
workflow as the Shared specification. FliHub-2 Shared was not inspected; no
cross-repository coverage or parity is claimed. Application source at the commit
above was unchanged; walkthrough sources and these notes are uncommitted additions.

The user explicitly confirmed that all visible Active Goals data is synthetic.
That confirmation is provenance supplied by the user, not an independent database
audit. No record names, individual identities or monetary totals are reproduced
in these notes. The recording contains the confirmed demonstration data.

## What Active Goals is

Active Goals is a **daily-meeting view of marketing objectives**. It reads
`marketing_goals`, joins child `goal_tasks`, and summarizes task workload and
linked expense/approval information. It is not the Active Projects screen and
does not treat an individual task as a goal.

The main demonstrated workflow is:

1. From the Marketing Goals page, choose **Active Goals** in the sidebar.
2. Review the page explanation and overall task/approval/spend summaries.
3. Review a goal card's objective, metric, progress and workload.
4. Expand its task list, then choose **View** for the goal's detail page.
5. Read the goal and an expanded task. Open **Add Task** only to inspect its
   blank fields, then **Cancel** without saving.
6. Choose **Back to Goals** for the broader list, then return to Active Goals.

## Findings: demonstrated versus inspected

| Feature | Locally demonstrated | Source-inspected behavior / remaining limit |
|---|---|---|
| Navigation | Sidebar Active Goals, goal View, Back to Goals and return navigation worked. | The active page also has All Marketing Goals navigation. The recording uses Back to Goals to reach that broader list, rather than clicking every equivalent link. |
| Active selection | Three active goal cards displayed. | Loader normalizes spaces, case, underscores and hyphens and includes only status `in progress`. On Hold/Not Started layouts in the component do not mean those goals are included by this loader. |
| Overview | Active Goals, Open Tasks, Needs Approval and Approved Spend displayed; help expanded. | These are computed across qualifying goals. Submitted/approved/paid spend footer panels also exist in source; the video is not an exhaustive scroll of every panel. |
| Goal fields | Name, description, status, priority, target metric, current/target progress, task workload and cost/due summaries shown; detail exposes category/deadline. | Cards use fallback names/descriptions/dates for legacy fields. Configured/demo values are observations, not approved limits or KPIs. |
| Filters | No search/status input on the active screen; navigation to the broader Marketing Goals list demonstrated. | Status selection happens in the loader, not a user-adjustable active-view filter. No search/filter control found on the inspected broader list either; its goal sheet has a status-edit field, not a list filter. |
| Child tasks | Expanded a card task list and one existing task detail. The selected goal had five tasks. | Active cards show at most eight sorted tasks and direct users to detail for the full list. Tasks are separate `goal_tasks` records joined by `goalId`. |
| Related records | No linked approval/expense/work-order summary displayed on the sampled task. Unrecorded inspection of all five tasks in this goal found none displayed. | Detail loader conditionally fetches linked `approvals`, `expenses`, `work_orders`; component renders Linked Records when available. No linked-record navigation or populated link lifecycle was demonstrated, and this does not prove links are absent across other goals or in the database. |
| Goal updates | Current Value/Status and Update Goal control observed without changing them. | `updateProgress` writes `currentValue` and optional status. No save, completion, state transition, persistence or boundary validation tested. |
| Task form | Add Task opened blank, then cancelled. Title, description, priority, due date, estimated cost, progress contribution and notes displayed. | Title is HTML-required and checked by the POST handler. The API also accepts assignedTo; this inspected form has no assignee selector. No fields entered or submission attempted. |
| Task actions | Task movement and Delete controls visible, never invoked. Active card expense controls visible. | Detail PATCH updates allowed fields; completion can create a submitted expense and pending approval. Log Expense can complete a task; Set Cost First leads to a cost modal and subsequent expense logging. These are writes, not safe inspection actions. |
| Reporting | Report PDF control visible, not clicked. | UI POSTs to a PDF endpoint. Handler builds a goal snapshot, execution/spend summary and up to twelve tasks. PDF generation/download was deliberately not demonstrated. |
| Goal creation/archive/delete | New Goal navigation visible on the broader list but not opened or used. No goal archive/delete action demonstrated. | New Goal page/action were inspected: name, description, category, priority, status, deadline, metric, current and target values; server requires a nonblank name. No dedicated goal archive/delete control found in these inspected goal screens. Task Delete is not goal deletion. |

## Relationships and calculations

- `marketing_goals` stores the objective. Current UI uses `goalName`,
  `description`, `category`, `targetMetric`, `currentValue`, `targetValue`,
  `deadline`, `status` and `priority`. Progress code also references `progressMode`
  and `progressBaseline`.
- `goal_tasks.goalId` links a child task to the goal. Task fields include title,
  description, status, priority, due date, estimated/actual cost, assignment,
  notes and optional progress contribution. `approvalId`, `expenseId` and
  `workOrderId` are used to resolve related records.
- Checked-in task collection definitions use **text IDs**, not PocketBase
  relation fields, for these links. No live collection definitions or database
  contents were exported. The checked-in definitions are references, not proof
  of the running schema.
- Active progress is rounded `currentValue / targetValue * 100`, capped at 100;
  nonpositive target gives zero. Open-task counts exclude `completed`, `done`
  and `cancelled`; completed counts accept `completed` or `done`.
- Task lists prioritize in-progress, then blocked/needs-approval, then todo and
  downstream states, using due date/title as tie breakers. Goals prefer literal
  `In Progress` before normalized variants, then earliest deadline.
- Spend uses each task's linked expense amount and expense status
  (`submitted`, `approved`, `paid`), not merely its estimated cost. Pending-queue
  count uses pending expense approvals; Needs Approval counts task status.
  These are different measures. Expense links are counted per task without
  deduplication, so a shared expense link could inflate aggregates; not tested.
- Completion PATCH recognizes `completed`/`done`, requires a positive existing
  actual-or-estimated cost, creates/reuses an expense and pending
  `entityType: expense` approval, then updates the task. There are multiple writes
  rather than a demonstrated transaction. The shared approval handler also has
  a separate `goal_task` branch; that is not proof the completion route uses it.
- Task completion/contribution changes trigger progress recalculation. Intended
  task-driven progress adds completed contributions to a baseline, otherwise
  leaves manual value alone. The first-switch calculation uses a zero fallback
  for an absent baseline before saving the prior current value as baseline;
  failures are swallowed. Do not treat this as verified progress correctness.
  Task deletion does not call this recalculation helper.

## Source starting points

| Surface | Relevant paths |
|---|---|
| Active overview, joins and aggregation | [Loader](../../src/routes/dashboard/active-goals/+page.server.ts), [UI](../../src/routes/dashboard/active-goals/+page.svelte) |
| Broader goal list and progress sheet | [Loader/actions](../../src/routes/dashboard/marketing-goals/+page.server.ts), [UI](../../src/routes/dashboard/marketing-goals/+page.svelte) |
| Existing goal, tasks and linked summaries | [Detail loader/actions](../../src/routes/dashboard/marketing-goals/[id]/+page.server.ts), [detail UI](../../src/routes/dashboard/marketing-goals/[id]/+page.svelte) |
| New goal, inspected only | [Form](../../src/routes/dashboard/marketing-goals/new/+page.svelte), [action](../../src/routes/dashboard/marketing-goals/new/+page.server.ts) |
| Task API | [GET/POST](../../src/routes/api/marketing-goals/[id]/tasks/+server.ts), [PATCH/DELETE and progress recalculation](../../src/routes/api/marketing-goals/[id]/tasks/[taskId]/+server.ts) |
| PDF generation, inspected only | [Report POST](../../src/routes/api/marketing-goals/[id]/report/+server.ts) |
| Approval handoff reference | [Shared approval handler](../../src/routes/api/approvals/approve/+server.ts) |
| Identity/navigation | [RequestContext](../../src/lib/infra/RequestContext.ts), [sidebar](../../src/lib/components/flihub-sidebar.svelte), [role menu configuration](../../src/lib/config/role-menu-controls.ts) |
| Model/schema references | [Marketing goal Zod schema](../../src/lib/domain/schemas/marketing-goal.schema.ts), [PocketBase collection definitions](../../src/lib/migrations/collections.ts) |

## Permissions and model gaps: inspected, not live-tested

- Active and all-goal loaders require admin, leader, marketing or marketing_lead.
  Sidebar visibility is separate from endpoint authorization. Only one demo
  account was used; its exact profile role and other-role denials were not tested.
- Detail load, goal creation/progress actions and task APIs use RequestContext
  authentication but do not repeat the active loader's role restriction in the
  inspected handlers. Task PATCH/DELETE use taskId without checking its stored
  goalId against the route's goal ID. No organization/owner-scoping check was
  found in those paths. This review did not probe these cases.
- RequestContext uses an admin-authenticated PB client and falls back to leader
  if its profile is missing. Checked-in task collection rules allow authenticated
  users, but those rules do not prove effective authorization for an admin client.
  Actual deployed rules were not inspected.
- Current create/progress actions do not use the inspected Zod goal schema.
  Form statuses include Completed/On Hold; the schema instead includes
  Achieved/Missed and has a different category vocabulary. Base collection
  definitions use older `name`/`descriptionOfGoal`/`dueDate` fields. Migration and
  canonical field/status decisions need explicit verification before reuse.
- Some source reads suppress errors into empty arrays/null; an empty list or
  missing Linked Records panel is not evidence of a healthy, complete backend.
  Detail task statistics/rendering also differ in support for legacy `done`
  versus `completed` and cancelled counts. No data was changed to test this.

## Verification and remaining gaps

- Executed the new recorder in unrecorded inspection mode, then completed all
  ten recorded actions against the local app. [Sanitized observations](../../walkthroughs/output/active-goals/active-goals.observations.json)
  report login HTTP 200, **zero non-login mutation attempts** and **zero browser
  page errors**. Only navigation, expansion and blank form open/cancel occurred.
- Authentication was unrecorded. Storage state stayed in process memory; no
  persistent browser profile, auth JSON, cookies or tokens were exported.
  Configured credential text and email text were masked in the document.
- Generated ten narration clips using the shared speech integration and assembled
  captions/audio with the existing tools. `ffprobe` confirmed H.264/AAC and the
  media properties above. `ffmpeg` volume detection found a non-silent signal:
  mean -27.4 dB, peak -3.0 dB. Sample frames checked readability and credential
  masking; temporary inspection images were removed. Audio signal validation is
  not a claim of subjective listening quality.
- `node --check scripts/walkthroughs/record-active-goals.mjs` passed. Recording
  automation is UI smoke evidence, not a unit-test suite. No goal-specific unit
  test files were found by filename search. No application test suite, build,
  migrations, seeds or mutation tests were run for this walkthrough.
- Goal creation, updates, completion, archival/deletion, task movement/deletion,
  expense/approval/work-order writes, PDF generation, persistence, rollback,
  concurrency, progress math boundaries and other-role authorization remain
  unverified live. No payment or external integration was exercised.

## Questions for comparison with FliHub-2 Shared

1. Should a goal be a marketing-specific objective or a reusable objective type?
   Keep its identity distinct from projects, campaigns and child tasks.
2. What does **active** mean: only In Progress, or also At Risk/On Track/On Hold?
   Which search, sort and filters should be supported?
3. What are the canonical fields/statuses and progress rules? Should progress be
   manual, contribution-driven or both, and how should baseline changes,
   cancellation, reopening and task deletion affect it?
4. Must every task completion create an expense? Define no-cost task completion
   separately from expense submission, approvals and work-order creation.
5. Which system owns approval/work-order IDs and status transitions? Define
   idempotency, linking, transaction/recovery behavior and deduplicated reporting.
6. Which roles and organizations may read/update goals, manage tasks or inspect
   financial summaries? Verify API enforcement independently of menu visibility.
7. Is a PDF snapshot required, and what records, redactions and authorization must
   it cover? A visible Report button is not acceptance evidence.

These questions are proposals, not requirement assignments. Compare with Shared's
actual implementation/API before asserting overlap or missing coverage.

## Suggested demonstration sub-issue description

Read-only demonstration of FliHub Original Active Goals for CTG: sidebar
navigation, overview summaries, marketing-goal cards and progress, supporting task
lists, an existing goal/task detail, blank Add Task form cancelled without saving,
and navigation to all marketing goals. Includes narrated/captioned video,
reproducible walkthrough source and review notes separating UI evidence from
source-only actions and remaining Shared-comparison questions. No records changed.

## Changed files and safety

Added this report, [walkthrough instructions](../../walkthroughs/active-goals/walkthrough.md),
[narration source](../../walkthroughs/active-goals/script.md) and
[recorder](../../scripts/walkthroughs/record-active-goals.mjs); updated the
[walkthrough index](../../walkthroughs/README.md). Generated outputs/audio remain
ignored. Pre-existing reimbursement work was preserved. No application code,
dependencies, schema, requirement register, permissions, settings or records were
changed. No commit, push or PR was made.
