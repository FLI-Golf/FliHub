# FliHub Codebase Search Results: Events, Tournaments & Broadcasters

## 1. Seed Data & Test Data Locations

### Primary Seed Files
- **[scripts/seed-events.ts](scripts/seed-events.ts)** - Main event seeding script
  - Creates 8 different event types (appearance, clinic, media, promotional, content_creation, tournament_broadcast)
  - Assigns talent to events
  - Generates payments and creates tasks
  - Includes clear functionality with `--clear` flag

- **[scripts/seed-2027-tournaments.ts](scripts/seed-2027-tournaments.ts)** - Tournament seeding
  - Seeds 6 tournaments for 2027 season
  - Progressive prize pools totaling $4M
  - Creates locations, dates, and purse structures

- **[src/routes/api/events/seed/+server.ts](src/routes/api/events/seed/+server.ts)** - API endpoint for seeding
  - POST endpoint to seed test events
  - DELETE endpoint to clear seed data
  - Creates tagged records with `[seed]` marker for cleanup

- **[scripts/seed-departments.ts](scripts/seed-departments.ts)**
- **[scripts/seed-vendor-data.ts](scripts/seed-vendor-data.ts)**
- **[scripts/seed-player-data.ts](scripts/seed-player-data.ts)**
- **[scripts/seed-media-assets-*.ts](scripts/)** - Media asset seeding for various phases
- **[scripts/backup-before-seed.ts](scripts/backup-before-seed.ts)** - Backup before seeding

### Backup & Restoration
- **[backups/pre-seed-backup-2026-01-07T19-27-36.json](backups/pre-seed-backup-2026-01-07T19-27-36.json)**
- **[scripts/restore-from-seed-backup.ts](scripts/restore-from-seed-backup.ts)**

---

## 2. Schema & Structure

### Special Events Collection (`special_events`)
**Location:** [src/lib/migrations/create-pro-payment-collections.ts](src/lib/migrations/create-pro-payment-collections.ts#L150)

**Core Fields:**
```
- name (text, required) - Event name
- eventType (select, required) - appearance | clinic | media | promotional | content_creation | tournament_broadcast | other
- eventDate (date, required) - Date of event
- location (text) - City/State/Venue
- description (editor) - Rich text description
- status (select) - scheduled | completed | cancelled
- notes (editor) - Internal notes
- tournament (relation) - Link to tournaments (for tournament_broadcast type)
- season (relation) - Link to season (for tournament_broadcast type)
- defaultRate (number) - Default payment rate per talent
- budget (number) - Total event budget
- approvalThreshold (number) - Payment amount requiring approval
- requiresApproval (bool) - Force all payments to approval
- bonusAmount (number) - Bonus for season series attendance
- bonusThreshold (number) - # of events needed for bonus eligibility
```

**Indexes:**
- `idx_special_events_type` on eventType
- `idx_special_events_status` on status
- `idx_special_events_date` on eventDate

**Domain Model:** [src/lib/domain/models/SpecialEvent.ts](src/lib/domain/models/SpecialEvent.ts)

---

### Tournament Collection (`tournaments`)
**Location:** Defined in PocketBase collections

**Domain Model:** [src/lib/domain/models/Tournament.ts](src/lib/domain/models/Tournament.ts)

**Core Fields:**
```
- name (text, required) - Tournament name
- season (number, required) - Season year/ID
- tournamentNumber (number) - Ordinal position in season
- startDate (date, required) - Start date
- endDate (date, required) - End date
- location (text) - Tournament location
- venue (text) - Specific venue name
- prizePool (number) - Total prize pool
- status (select) - scheduled | in_progress | completed | cancelled
- description (text) - Tournament description
- notes (text) - Internal notes
```

**Repository:** [src/lib/infra/pocketbase/repositories/TournamentRepo.ts](src/lib/infra/pocketbase/repositories/TournamentRepo.ts)

---

### Broadcaster/Talent Collection (`talent`)
**Formerly called:** `pros` collection (renamed to `talent` via [src/lib/migrations/talent-management-restructure.ts](src/lib/migrations/talent-management-restructure.ts))

**Domain Model:** [src/lib/domain/models/Pro.ts](src/lib/domain/models/Pro.ts)

**Core Fields for Broadcasters:**
```
- name (text, required)
- talentType (select) - ['player'] | ['broadcaster'] | ['commentator'] | ['analyst'] | other
- status (select) - active | inactive | retired
- avatar (file) - Profile photo
- bio (editor) - Biography
- nickname (text) - On-air nickname
- website (url) - Personal website
- tiktok, twitch, youtube (text) - Social media handles
- managerCutPercentage (number) - Manager commission %
- managerName, managerEmail (text) - Manager info
```

**Broadcaster Profiles:** [src/lib/migrations/talent-management-restructure.ts](src/lib/migrations/talent-management-restructure.ts) also creates:
- `broadcaster_profiles` collection with extended broadcaster-specific fields

**Schema Definition:** [src/lib/domain/schemas/pro.schema.ts](src/lib/domain/schemas/pro.schema.ts)

---

## 3. Relationships & Connections

### Event → Tournament Relationship
**Fields in special_events:**
```
tournament: relation (optional, maxSelect: 1)
  → Links tournament_broadcast events to specific tournaments
  → Used for "Linked Tournament" field in broadcast event forms
```

**Linkage Logic:**
- Tournament broadcast events can optionally link to a tournament
- See [src/routes/dashboard/events/new/+page.svelte](src/routes/dashboard/events/new/+page.svelte#L113-L120)

### Event → Talent Relationship
**Collection:** `event_talent` (junction table)

**Fields:**
```
- event (relation, required) → special_events
- talent (relation, required) → talent
- role (text) - 'player' | 'broadcaster' | 'commentator' | 'analyst' | 'other'
- rateOverride (number) - Custom rate for this talent/event
- confirmedRate (number) - Final confirmed rate
- status (select) - confirmed | completed | declined | pending
- bonusEligible (bool) - Eligible for season bonus
- bonusEarned (bool) - Bonus has been paid
- bookingEntityType (select) - individual | group
- talentGroup (relation) - Link to talent_groups if group booking
```

**Repository:** [src/lib/infra/pocketbase/repositories/SpecialEventRepo.ts](src/lib/infra/pocketbase/repositories/SpecialEventRepo.ts)

### Event → Payment Relationship
**Collection:** `event_payments`

**Fields:**
```
- event (relation, required) → special_events
- eventTalent (relation) → event_talent (junction record)
- talent (relation) → talent
- talentGroup (relation) → talent_groups (if group payment)
- paymentType (select) - broadcast_fee | appearance_fee | bonus | other
- amount (number) - Payment amount
- status (select) - pending | approval_required | approved | paid | cancelled
- approvalRoute (select) - direct | approval_pipeline
- recipient (select) - talent | manager
- managerAmount, managerCutPercentage (number) - Manager commission
- isBonus (bool) - Is this a bonus payment
- description (text) - Payment description
```

### Event → Task Relationship
**Collection:** `event_tasks`

**Fields:**
```
- event (relation, required) → special_events
- title (text, required)
- description (text)
- status (select) - todo | in_progress | completed | cancelled
- priority (select) - low | medium | high | urgent
- dueDate (date)
- estimatedCost, actualCost (number)
- hasCost (bool) - Whether task has associated cost
- requiresApproval (bool) - Cost requires approval
- assignedTo (text) - User ID
- checklist (json) - Subtask checklist
```

### Tournament → Result Relationship
**Collection:** `tournament_results`

**Fields:**
```
- tournament (relation, required) → tournaments
- pro (relation, required) → talent (pros)
- placement (number) - Finishing position
- earnings (number) - Prize money
- score (text) - Final score
- rounds (number) - # of rounds played
```

---

## 4. Season Tracking

**Collection:** `seasons` (referenced but not fully documented)

**Usage in Events:**
- `special_events.season` → Links event to a season
- `seed-2027-tournaments.ts` uses Season ID: `t9yegq2db2sml8j` (2027 Season)
- Used for tracking season-based bonus eligibility for tournament broadcast events

---

## 5. Sample Talent IDs from Seeding

**Players:**
```
- gannon: 'caxypp9fv95sf0n'
- ricky: 'jzhlpxvrtg5cqkd'
- eagle: 'u64edbgz387b9wb'
- paige: 'y0sqz8izif7ydax'
- kristin: '4a7zof0wdg376pv'
- catrina: 'ziblxn00eqcxz0u'
```

**Broadcasters:**
```
- paul_u: '7g75nzujxwz3s7r'
- kona: 'bxsq87nz5aqxunv'
- brad: 'pzaau2h1r5yeuij'
- brodie: 'b0r4zi2j1aso8c8'
- kevin: '70c06glx02o54zd'
```

---

## 6. Event Seeding Logic

### Event Types & Workflow

**Appearance:**
- Multi-talent events (usually 2+ players)
- Below approval threshold → direct payment
- Example: "Children's Hospital Appearance" with Gannon & Eagle

**Clinic:**
- Single talent instruction event
- Above approval threshold → approval pipeline
- Example: "Youth Disc Golf Clinic" with Ricky

**Media:**
- Photography/video shoots
- Forced approval even if below threshold (`requiresApproval: true`)
- Supports rate overrides
- Example: "Disc Golf World Magazine Shoot"

**Promotional:**
- Booth appearances, expos
- Multi-talent, can include manager cuts
- Example: "FLI Golf Expo Booth — Las Vegas"

**Content Creation:**
- Broadcasting/streaming content
- Often draft status until production complete
- Example: "FLI Golf YouTube Series"

**Tournament Broadcast:**
- Live tournament coverage
- Links to specific tournament
- Season-based bonus tracking
- Multiple broadcasters per round
- Bonus triggers at N events attended (e.g., 3 events = $500 bonus)
- Example: "FLI Open Broadcast — Round 1"

### Payment Generation Flow

1. Create event with `special_events.create()`
2. Assign talent with `event_talent.create()` (talent linked via role)
3. Create tasks with `event_tasks.create()`
4. Generate payments with `event_payments.create()`:
   - Checks approval threshold
   - Calculates manager cuts
   - For broadcast events: tracks bonus eligibility across season
   - Creates separate payments for talent and manager

---

## 7. API Endpoints

**Event Management:**
- `POST /api/events` - Create event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /dashboard/events` - List events

**Talent Assignment:**
- `POST /api/events/:id/talent` - Assign talent
- `PATCH /api/events/:id/talent/:eventTalentId` - Update assignment
- `DELETE /api/events/:id/talent/:eventTalentId` - Remove talent

**Payment Generation:**
- `POST /api/events/:id/payments/generate` - Generate payments
- `POST /api/events/:id/payments/:paymentId/mark-paid` - Mark payment paid

**Seeding (Admin Only):**
- `POST /api/events/seed` - Run seed script
- `DELETE /api/events/seed` - Clear seed data

---

## 8. Key Files Summary

| File | Purpose |
|------|---------|
| [src/lib/domain/models/SpecialEvent.ts](src/lib/domain/models/SpecialEvent.ts) | Event domain entity |
| [src/lib/domain/models/Tournament.ts](src/lib/domain/models/Tournament.ts) | Tournament domain entity |
| [src/lib/domain/models/TournamentResult.ts](src/lib/domain/models/TournamentResult.ts) | Tournament result entity |
| [scripts/seed-events.ts](scripts/seed-events.ts) | Event seeding script |
| [scripts/seed-2027-tournaments.ts](scripts/seed-2027-tournaments.ts) | Tournament seeding |
| [src/routes/api/events/seed/+server.ts](src/routes/api/events/seed/+server.ts) | Seed API endpoints |
| [src/lib/infra/pocketbase/repositories/SpecialEventRepo.ts](src/lib/infra/pocketbase/repositories/SpecialEventRepo.ts) | Event repository |
| [src/lib/infra/pocketbase/repositories/TournamentRepo.ts](src/lib/infra/pocketbase/repositories/TournamentRepo.ts) | Tournament repository |
| [src/routes/dashboard/events/new/+page.svelte](src/routes/dashboard/events/new/+page.svelte) | Event creation form |
| [src/routes/api/events/:id/payments/generate/+server.ts](src/routes/api/events/%5Bid%5D/payments/generate/%2Bserver.ts) | Payment generation logic |

