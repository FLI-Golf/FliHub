# Project-Targeted CSV Merge Import

## Why this is needed
Current import flow (`/dashboard/import` -> `/api/import`) supports only:
- vendors
- sponsors
- pros
- territories
- reimbursements

It does not support importing rows directly into an existing project task list with merge behavior.

## Goal
Enable users to pick one existing project, upload a CSV of tasks/budget lines, and merge rows into that project without creating duplicate tasks.

## Recommended merge model
Use deterministic upsert with a per-project external key.

### Merge key priority
1. `externalRowId` (if provided in CSV)
2. else `title` normalized (lowercase + trim + collapse spaces)

### Merge actions
- If key not found in target project: create task
- If key found in target project: update task fields (patch semantics)
- Optional delete pass (advanced): if `syncMode=replace_missing`, mark target project tasks not present in file as `cancelled`

## CSV format (recommended)
Header columns:
- externalRowId (optional but strongly recommended)
- title (required)
- description (optional)
- priority (optional: low|medium|high|urgent)
- status (optional: todo|in_progress|blocked|completed|cancelled)
- startDate (optional YYYY-MM-DD)
- dueDate (optional YYYY-MM-DD)
- task_budget (optional number)
- task_actual_cost (optional number)
- estimatedHours (optional number)
- actualHours (optional number)
- tags (optional comma-delimited)
- notes (optional)
- subTasksChecklist (optional markdown checklist)

## API contract (proposed)
Add `POST /api/import/project-tasks`

Request:
```json
{
  "projectId": "xptzufs2w7lz1j7",
  "rows": [ ... ],
  "options": {
    "dryRun": false,
    "syncMode": "merge",
    "matchBy": "externalRowId_or_title"
  }
}
```

Response:
```json
{
  "projectId": "xptzufs2w7lz1j7",
  "created": 12,
  "updated": 8,
  "skipped": 3,
  "failed": 1,
  "errors": ["Row 14: dueDate invalid format"],
  "preview": {
    "wouldCreate": 12,
    "wouldUpdate": 8,
    "wouldSkip": 3
  }
}
```

## UI flow in `/dashboard/import` (proposed)
1. Add new import type card: `Project Tasks (Merge)`
2. Show target project selector (searchable)
3. Show CSV schema table + sample
4. Add mode toggles:
- `Dry Run` (default on)
- `Apply Changes`
- `Merge` vs `Replace Missing` (advanced)
5. Show result summary with created/updated/skipped/failed and downloadable error CSV

## Validation rules
- `projectId` required and must exist
- `title` required for rows without `externalRowId`
- numeric fields parsed from plain numbers only
- invalid status/priority rejected with row-specific errors
- date format must be `YYYY-MM-DD`
- never mutate tasks from other projects

## Financial data recommendations for project merges
When importing finance-heavy tasks (events, broadcast, travel, entertainment), enforce:
- `task_budget` present for all cost rows
- standardized tags:
  - `pillar:event-production-tech`
  - `pillar:league-ops`
  - `pillar:media-content`
  - `pillar:marketing-reserve`
  - `category:travel`
  - `category:entertainment`
- include `notes` with budget source reference (example: `Source: dashboard/travel-budget 2027 baseline`)

## Operational instructions (for users)
1. Go to `/dashboard/import`
2. Choose `Project Tasks (Merge)`
3. Select target project
4. Paste/upload CSV
5. Run Dry Run and review summary
6. Fix any row errors
7. Run Apply
8. Verify imported tasks in `/dashboard/projects/{projectId}`

## Rollout plan
1. Backend endpoint first (`/api/import/project-tasks`)
2. UI support in import page
3. Add audit logging (import batch id, user id, project id, counts)
4. Add rollback helper script (delete tasks by import batch id)

## Suggested first pilot
Pilot on `Venue & Course Build` (`xptzufs2w7lz1j7`) with 20-row CSV:
- 8 broadcast ops lines
- 6 travel lines
- 6 entertainment lines

Use dry-run, then apply.
