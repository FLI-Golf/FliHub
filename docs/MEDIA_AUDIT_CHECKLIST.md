# Media Audit Checklist

Status legend: [ ] not started, [~] in progress, [x] done

## Current Scope
- Source audit date: 2026-06-06
- Area: media dashboard, upload wizard, Phase 5/6/7 APIs
- Branch: feat/media-asset-mgmt

## Priority Queue
- [x] P1 - Expand upload file support beyond images
- [x] P1 - Replace hardcoded PocketBase URL with server-provided base URL
- [x] P1 - Implement functional Clear Test Data flow
- [ ] P2 - Align Phase 6 photo metric with actual media schema
- [ ] P2 - Make Phase 7 queue chips clickable filters
- [ ] P2 - Revisit Phase 7 process state transition (pending vs reviewed)
- [ ] P3 - Refactor Phase 5 package identity model (avoid title-grouping)
- [ ] P3 - De-duplicate package type options
- [ ] P3 - Remove or gate seeded demo constants in media page
- [ ] P3 - Validate and potentially upgrade people source for attribution

## Detailed Checklist

### 1) Upload File Type Coverage (P1)
- [x] Add file acceptance rules for non-image assets (video/audio/docs) in upload modal
- [x] Optionally make accept list conditional on selected asset type
- [x] Ensure helper text reflects allowed file types
- [x] Confirm PocketBase media_assets file field currently has no native MIME restrictions (manual validation)
- [x] Enforce allowed MIME/file size rules in `/api/media` backend route
- [ ] Validate upload succeeds for at least one non-image type
Acceptance criteria:
- Upload step allows intended file classes and no misleading UI copy remains.

### 2) Media File URL Base Source (P1)
- [x] Remove hardcoded PB URL usage in media page
- [x] Use server-provided URL consistently for preview/full file links
- [ ] Verify links work in current environment
Acceptance criteria:
- Asset thumbnails/full links resolve using runtime-configured base URL.

### 3) Clear Test Data Action (P1)
- [x] Implement backend endpoint/action for test-data cleanup OR
- [ ] Disable/hide the button when cleanup is not available
- [x] Add confirmation guard and success/error feedback
Acceptance criteria:
- Clear action behavior is explicit, safe, and not a no-op.

### 4) Phase 6 Photo Metric Alignment (P2)
- [ ] Replace photo-count logic with schema-accurate metric
- [ ] Confirm source field mapping for photo/image content
Acceptance criteria:
- KPI reflects actual stored data categories.

### 5) Phase 7 Queue Chip Interactivity (P2)
- [ ] Wire queue type chips to set queue type
- [ ] Trigger queue refresh on chip selection
- [ ] Add selected-state styling for active chip
Acceptance criteria:
- Clicking a chip updates queue type and results immediately.

### 6) Phase 7 Process State Semantics (P2)
- [ ] Decide intended initial state for generated queue jobs
- [ ] Update process action to set correct lifecycle status
- [ ] Verify counts (pending/reviewed/approved/rejected) remain consistent
Acceptance criteria:
- Queue lifecycle aligns with product intent and displayed counters.

### 7) Phase 5 Package Identity Model (P3)
- [ ] Introduce explicit package identity instead of title-based grouping
- [ ] Map package items to package id and media assets cleanly
- [ ] Preserve existing create/advance/approve/publish/export UX
Acceptance criteria:
- Packages are stable entities and no longer depend on title collisions.

### 8) Package Type List Cleanup (P3)
- [ ] Remove duplicate values from package type options
- [ ] Verify no downstream logic depends on duplicates
Acceptance criteria:
- Package type list is unique and normalized.

### 9) Seeded Constant Removal or Gating (P3)
- [ ] Remove fallback demo constants where real API data exists OR
- [ ] Gate them behind explicit dev/testing flag
- [ ] Ensure production path is data-driven
Acceptance criteria:
- UI does not silently show seeded values in normal runtime.

### 10) People Source Validation (P3)
- [ ] Confirm whether users or user_profiles is the authoritative source
- [ ] Update server load and labels if richer profile source is needed
Acceptance criteria:
- People selector shows reliable display names for attribution workflows.

## Execution Notes
- Keep this checklist as the single source of truth for media audit remediation.
- After approval, start implementation in strict priority order: P1 then P2 then P3.
