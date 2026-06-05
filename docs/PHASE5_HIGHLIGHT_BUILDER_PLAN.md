# Phase 5 Highlight Builder Plan

## Objective
Enable internal content ops to build reusable highlight packages from tagged media assets with export-ready manifests.

## Implemented in This Step
- Added schema collections:
  - media_collections
  - highlight_packages
  - highlight_package_items
- Added rollout script: scripts/update-media-assets-phase5.ts
- Added seed script: scripts/seed-media-assets-phase5.ts
- Wired package item enrichment into dashboard media load for per-asset visibility.

## Workflow Model
1. Curate assets into a media collection.
2. Create a highlight package with export target and approval status.
3. Add ordered package items with clip in/out timestamps and usage role.
4. Export using manifest_json to downstream editing or automation.

## Initial Status Model
- media_collections.status: draft -> curating -> ready_for_edit -> complete -> archived
- highlight_packages.status: draft -> review -> approved -> published -> archived
- highlight_packages.approval_status: pending -> approved -> rejected

## Next Build Targets
1. Highlight package manager UI (create package, add/remove/reorder items).
2. Package detail panel with timeline and validation checks.
3. Export manifest endpoint (JSON + CSV), including unresolved asset warnings.
4. Approval action endpoints (approve/reject with user + timestamp).
5. Publish hooks for social and sponsor distribution channels.

## Exit Criteria for Phase 5
- Media ops can assemble and save a package from dashboard-selected assets.
- Package item ordering and clip ranges are persisted.
- Export manifest can be generated without manual spreadsheet work.
