# Media Asset Management Implementation Plan

## Executive Summary

This plan adapts the new FLIHub Media Asset Management (MAM) and Content Licensing strategy into a practical implementation roadmap for the current codebase.

The published strategy describes a full league media operating system: ingestion, metadata, search, sponsor deliverables, licensing, archive, marketplace, and executive reporting. The current repository already has a starting point, but it is much narrower: a generic `media_assets` collection, a basic media dashboard, upload/edit modals, campaign linkage, and simple API endpoints.

The correct move is not to replace the current media feature. The correct move is to evolve it in phases so the existing `media_assets` slice becomes the foundation for a full MAM platform.

## Current State

### Existing Foundation

The repository already includes:

- A `media_assets` collection documented in the schema guide.
- Media upload and edit flows.
- Media API endpoints for create, list, update, and delete.
- A `/dashboard/media` page for browsing uploaded assets.
- Campaign-to-media relationships.
- Adjacent licensing and sponsorship surfaces elsewhere in the dashboard.

### Current Limitation

The current media system behaves like a lightweight brand asset library, not a true MAM platform.

Today it supports:

- One uploaded file per record.
- A narrow `asset_type` classification.
- Free-text tags and notes.
- Optional links to franchise, project, and campaign.

It does not yet support:

- Event and tournament ingestion workflows.
- Structured sports metadata.
- Usage rights and license lifecycle tracking.
- Sponsor visibility tracking.
- Highlight package assembly.
- External licensing or marketplace transactions.
- Archive-grade taxonomy and search.
- Executive media valuation reporting.

## Strategic Translation

The published strategy should be translated into this repo using one rule:

Keep the existing `media_assets` feature as the base record model, then add structured metadata, rights management, deliverables, and monetization modules around it.

That keeps the rollout realistic and avoids rebuilding the media stack from zero.

## Recommended Delivery Strategy

### Phase 1: Stabilize the Core Asset Library

Goal: turn the existing media page into a trustworthy central repository for all uploaded media.

#### Scope

- Expand `media_assets` from design-oriented assets into league-wide asset records.
- Support image, video, audio, document, and archive package uploads.
- Add structured metadata fields without breaking the current UI.
- Keep upload and browse flows simple for the first release.

#### Schema Additions

Extend `media_assets` with fields like:

- `media_category`: photo, video, audio, document, graphic, social_clip, broadcast_segment, interview, highlight, sponsor_asset, other
- `source_type`: broadcast_camera, drone, mobile, photographer, livestream, social_export, production_company, podcast, sponsor_submission, other
- `season`
- `event_id`
- `tournament_id`
- `venue_id`
- `capture_date`
- `duration_seconds`
- `file_size_bytes`
- `resolution`
- `status`: uploaded, processing, tagged, approved, archived, restricted
- `storage_tier`: hot, warm, archive
- `usage_scope`: internal, sponsor, broadcast, commercial, restricted
- `rights_status`: owned, shared, licensed_out, licensed_in, talent_restricted, expired

#### Files to Update

- `src/routes/dashboard/media/+page.server.ts`
- `src/routes/dashboard/media/+page.svelte`
- `src/lib/components/media/upload-media-modal.svelte`
- `src/lib/components/media/edit-media-modal.svelte`
- `src/routes/api/media/+server.ts`
- `src/routes/api/media/[id]/+server.ts`
- `src/routes/dashboard/schema-guide/+page.svelte`

#### Deliverables

- Better filters on the media dashboard.
- File-type aware previews.
- Structured metadata capture on upload.
- Cleaner separation between brand assets and league media assets.

#### Exit Criteria

- Staff can upload and classify league media consistently.
- Media records can be filtered by campaign, franchise, event, and media category.
- The dashboard is usable as a central media inventory.

### Phase 2: Add Sports Metadata and Taxonomy

Goal: make media searchable using league-specific context instead of loose tags.

#### Scope

- Introduce normalized metadata relations instead of relying on free-text tags.
- Capture player, team, sponsor, event, and gameplay context.
- Preserve simple tag entry for speed, but make structured metadata the system of record.

#### New Collections

- `media_asset_tags`
- `media_asset_people`
- `media_asset_teams`
- `media_asset_sponsors`
- `media_asset_events`
- `media_asset_markers`

#### Metadata Domains

- Players appearing in the asset
- Team affiliations
- Sponsors visible in the asset
- Hole number
- Round type
- Shot type
- Crowd reaction
- Interview segment
- Award ceremony
- VIP or hospitality footage

#### Implementation Notes

Start with manual metadata entry and multi-select relations. Do not wait for AI recognition to begin building the taxonomy.

#### Deliverables

- Rich filter panels in `/dashboard/media`.
- Asset detail drawer or page showing structured metadata.
- Reusable tag vocabularies for content ops.

#### Exit Criteria

- Users can answer questions like “show all championship round crowd reactions” with filters.
- Metadata is consistent enough for sponsor reporting and highlight assembly.

### Phase 3: Rights and Licensing Management

Goal: treat every media record as an IP asset with explicit ownership and usage rules.

#### Scope

- Add license and rights tracking around `media_assets`.
- Track who can use an asset, where, for how long, and under what commercial terms.
- Separate asset storage from licensing transactions.

#### New Collections

- `media_rights_profiles`
- `media_license_deals`
- `media_license_line_items`
- `media_usage_logs`

#### Required Fields

For each rights or license record:

- asset or asset group
- rights owner
- purchaser or licensee
- usage type
- territory
- channel
- exclusivity
- start date
- expiration date
- fee or revenue
- restrictions
- contract reference

#### Existing Repo Alignment

This phase should integrate conceptually with the broader licensing strategy already present in:

- league licensing surfaces
- sponsor systems
- income and payment tracking

#### Deliverables

- Rights status badges on media records.
- License history per asset.
- Revenue attribution for licensed content.

#### Exit Criteria

- A staff user can see whether an asset is licensable before sending it externally.
- FLIHub can log outbound media licensing revenue in a structured way.

### Phase 4: Sponsor Deliverables and Visibility Tracking

Goal: connect media operations directly to sponsor value delivery.

#### Scope

- Track which assets fulfill sponsor commitments.
- Record sponsor appearances, logo visibility, content package delivery, and recap status.
- Build sponsor-facing reporting from structured media metadata.

#### New Collections

- `sponsor_media_deliverables`
- `sponsor_media_appearances`
- `sponsor_recap_packages`

#### Product Behavior

- Link assets to sponsor obligations.
- Generate event recap packets.
- Show sponsor-specific clips, screenshots, and downloadable proofs.

#### Existing Repo Alignment

This phase should build on current sponsor records instead of creating a parallel sponsor model.

#### Deliverables

- Sponsor dashboard summary cards.
- Deliverable completion tracking.
- Downloadable sponsor recap bundles.

#### Exit Criteria

- A sponsor manager can prove content delivery from within FLIHub.
- Sponsor recap creation no longer depends on manual file chasing.

### Phase 5: Highlight Builder and Internal Content Packaging

Goal: make FLIHub useful for internal content production, not just storage.

#### Scope

- Create clip selection and package assembly workflows.
- Support reels, recaps, player packages, sponsor packages, and social exports.
- Start with package definition and export manifests before attempting browser-based video editing.

#### Recommendation

Do not build a full nonlinear editor in the app first.

Instead, implement:

- clip selection lists
- in and out timestamp metadata
- package manifests
- export targets
- approval and publish status

#### New Collections

- `media_collections`
- `highlight_packages`
- `highlight_package_items`

#### Deliverables

- Staff can assemble highlight packages from tagged assets.
- Packages can be exported as manifests for editors or downstream automation.

#### Exit Criteria

- Internal content ops can assemble reusable media packages without searching manually across folders.

### Phase 6: Marketplace, Archive, and Executive Reporting

Goal: turn the archive into a monetization and reporting system.

#### Scope

- Launch internal marketplace workflows for approved buyers.
- Build archive views by season, tournament, team, player, sponsor, and venue.
- Add executive dashboard reporting for asset volume and monetization.

#### New Collections

- `media_marketplace_listings`
- `media_purchase_requests`
- `media_download_audits`
- `media_dashboard_snapshots`

#### Dashboard Metrics

- total assets stored
- hours of footage
- photo count
- most used assets
- assets by season
- sponsor deliverables completed
- licensing revenue
- downloads
- top players by media value
- top teams by media value

#### Exit Criteria

- Leadership can measure media operations as an asset class.
- Approved content buyers can request or purchase licensable packages through FLIHub.

### Phase 7: AI Recognition and Natural Language Search

Goal: reduce manual tagging effort once the taxonomy is stable.

#### Scope

- Add enrichment pipelines after manual metadata and rights workflows are stable.
- Use AI for assistive tagging, not as the first source of truth.

#### AI Targets

- player recognition
- sponsor logo recognition
- scene detection
- transcript extraction
- clip summarization
- suggested metadata

#### Recommendation

This phase should not block the core roadmap. AI is an accelerator for a working system, not a substitute for structured data design.

## Architecture Recommendation

### Do Not Replace `media_assets`

Keep `media_assets` as the primary asset record.

Add supporting collections around it for:

- metadata relations
- rights profiles
- sponsor deliverables
- package assembly
- licensing transactions
- marketplace actions

This is the lowest-risk path because the repo already depends on that collection.

### Separate Concerns Clearly

Use these boundaries:

- `media_assets`: the stored asset record
- metadata collections: who, what, where, when, sponsor visibility, game context
- rights collections: ownership and allowed usage
- package collections: editorial grouping and deliverables
- commerce collections: licensing, purchase, and revenue

### Avoid Overloading Free-Text Tags

Free-text tags are still useful for speed, but they should no longer carry core business meaning.

Anything tied to:

- rights
- sponsorship value
- player appearances
- event context
- monetization

should be stored structurally.

## Suggested Rollout Order for This Branch

### Immediate Branch Goal

Because this branch is already focused on media asset management, the next implementation target should be Phase 1 only.

That means this branch should aim to deliver:

- upgraded `media_assets` schema
- richer upload/edit forms
- better media dashboard filters and views
- clearer distinction between generic asset types and league media categories

### Follow-Up Branches

After Phase 1 is stable:

1. Phase 2 metadata taxonomy
2. Phase 3 rights and licensing
3. Phase 4 sponsor deliverables
4. Phase 5 highlight packaging
5. Phase 6 archive and marketplace
6. Phase 7 AI enrichment

## Delivery Checklist

### Phase 1 Checklist

- [ ] Audit current `media_assets` PocketBase schema
- [ ] Define the expanded field set for league-wide media
- [ ] Update upload modal to capture structured metadata
- [ ] Update edit modal to support the new metadata
- [ ] Update `/api/media` filtering to handle new fields
- [ ] Upgrade `/dashboard/media` filters, labels, and previews
- [ ] Update schema guide documentation
- [ ] Seed representative media records for testing

### Phase 2 Checklist

- [ ] Define normalized taxonomy collections
- [ ] Add media detail page or side panel
- [ ] Support structured multi-select tagging
- [ ] Build saved filter combinations for content ops

### Phase 3 Checklist

- [ ] Add rights profile schema
- [ ] Add license transaction schema
- [ ] Add usage audit logging
- [ ] Connect licensing revenue to finance reporting

## Key Product Decisions

### Decision 1: One Unified Asset System

Use one media platform for league footage, photos, sponsor content, and brand assets.

Do not create separate asset systems for design files and broadcast media.

### Decision 2: Manual Metadata First

Manual structured metadata should come before AI-assisted recognition.

This ensures the data model is correct before automation is layered on top.

### Decision 3: Licensing Is a First-Class Capability

Rights and licensing should not remain hidden in notes fields.

If the strategic goal is long-term monetization, rights data must be explicit and queryable.

### Decision 4: Sponsor Reporting Must Come from Asset Metadata

Sponsor deliverables should be generated from tracked media appearances and package associations, not one-off human memory.

## Risks

### Risk 1: Overbuilding Too Early

Trying to deliver ingestion, AI tagging, marketplace, and editing in one release will stall the project.

Mitigation: ship Phase 1 first, then add structured capabilities in layers.

### Risk 2: Weak Metadata Discipline

If staff continue using only free-text tags, sponsor reporting and search quality will stay poor.

Mitigation: introduce structured fields and relation-based filters early.

### Risk 3: Rights Data Stored Informally

If licensing terms live only in notes or PDFs, monetization workflows will fail.

Mitigation: create explicit rights and transaction records in Phase 3.

## Recommended Next Step

For the current branch, implement Phase 1 and treat it as the foundation milestone for the broader MAM strategy.

If needed, the next planning document should be a Phase 1 execution checklist with exact PocketBase schema changes and per-file implementation tasks.