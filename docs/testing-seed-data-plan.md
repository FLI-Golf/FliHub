# FliHub Testing & Seed Data Plan

**Purpose:** Enable rapid testing and iteration with realistic data that can be easily reset

---

## Overview

### The Problem
- Blueprint data (Phases 1-3) is for planning, not real operations
- Need to test expense workflows, approvals, budget tracking
- Need realistic data to test UI/UX
- Need to reset frequently during development
- Real implementation will start fresh

### The Solution
- **Seed Data Generator:** Creates realistic test data
- **Testing Scenarios:** Pre-built scenarios for common workflows
- **Data Management UI:** Easy reset, seed, backup from the app
- **Demo Mode:** Toggle between blueprint and test data
- **Clean Slate:** Easy way to prepare for production

---

## Seed Data Types

### 1. Expenses (Primary Testing Focus)
- **Draft expenses:** Created but not submitted
- **Submitted expenses:** Awaiting approval
- **Approved expenses:** Ready for payment
- **Paid expenses:** Completed
- **Rejected expenses:** Denied with reasons

### 2. Vendors
- **Active vendors:** Regular suppliers
- **Inactive vendors:** Past vendors
- **Pending vendors:** Awaiting approval

### 3. Users & Profiles
- **Admins:** Full access
- **Leaders:** Department heads
- **Managers:** Project managers
- **Vendors:** External suppliers
- **Staff:** Regular employees

### 4. Budget Scenarios
- **Under budget:** Projects tracking well
- **Over budget:** Projects exceeding budget
- **At capacity:** Projects at budget limit
- **No budget:** Projects without budget set

### 5. Approval Workflows
- **Single approver:** Simple approval
- **Multi-level:** Department → Executive
- **Rejected → Resubmitted:** Workflow testing
- **Pending approvals:** Queue testing

---

## Testing Scenarios

### Scenario 1: New Expense Creation
```
User: Project Manager
Action: Create expense
Data:
  - Vendor: Smartboost (Marketing vendor)
  - Amount: $5,000
  - Project: P1-3 Marketing
  - Status: Draft
  - Attachments: Receipt.pdf
```

### Scenario 2: Expense Approval Flow
```
Step 1: Manager submits expense
Step 2: Department head reviews
Step 3: Finance approves
Step 4: Payment processed
Step 5: Budget updated
```

### Scenario 3: Budget Alerts
```
Situation: Project approaching budget limit
Data:
  - Project budget: $100,000
  - Spent: $85,000
  - New expense: $20,000
  - Alert: Would exceed budget
```

### Scenario 4: Multi-Phase Tracking
```
Situation: P1-3 item spanning phases
Data:
  - P1-3 Marketing total: $1,400,000
  - Phase 1 spent: $60,000
  - Phase 2 spent: $320,000
  - Phase 3 remaining: $1,020,000
```

### Scenario 5: Vendor Management
```
Actions:
  - Add new vendor
  - Submit expense to vendor
  - Vendor submits invoice
  - Payment to vendor
  - Vendor performance tracking
```

---

## Seed Data Generator Features

### 1. Realistic Data
- Real vendor names (Smartboost, Neology PR, Pure Mobile)
- Realistic expense amounts
- Proper date ranges (Phase 1, 2, 3)
- Valid project/department assignments
- Realistic descriptions and notes

### 2. Configurable Volume
```javascript
{
  expenses: 50,        // Number of expenses to create
  vendors: 10,         // Number of vendors
  users: 15,           // Number of users
  dateRange: 'phase1', // or 'phase2', 'phase3', 'all'
  statusMix: {         // Distribution of statuses
    draft: 20,
    submitted: 30,
    approved: 30,
    paid: 15,
    rejected: 5
  }
}
```

### 3. Relationship Integrity
- Expenses linked to valid projects
- Projects linked to valid departments
- Users assigned to correct departments
- Vendors linked to expenses
- Approvals linked to users

### 4. Workflow States
- Expenses at different approval stages
- Some expenses with comments/notes
- Some expenses with attachments (simulated)
- Some expenses rejected with reasons

---

## Data Management UI

### Location: `/dashboard/admin/data-management`

### Features

#### 1. Current Data Overview
```
┌─────────────────────────────────────────┐
│         Current Database State          │
├─────────────────────────────────────────┤
│  Departments:     11                    │
│  Projects:        21                    │
│  Tasks:           33                    │
│  Expenses:        0                     │
│  Vendors:         0                     │
│  Users:           1                     │
│                                         │
│  Mode: BLUEPRINT                        │
└─────────────────────────────────────────┘
```

#### 2. Seed Data Actions
```
┌─────────────────────────────────────────┐
│         Generate Test Data              │
├─────────────────────────────────────────┤
│  [Scenario Dropdown]                    │
│  ├─ Quick Test (10 expenses)            │
│  ├─ Full Test (50 expenses)             │
│  ├─ Approval Workflow Test              │
│  ├─ Budget Alert Test                   │
│  └─ Custom...                           │
│                                         │
│  [Generate Seed Data] button            │
└─────────────────────────────────────────┘
```

#### 3. Reset Options
```
┌─────────────────────────────────────────┐
│         Reset Database                  │
├─────────────────────────────────────────┤
│  ⚠️  Warning: This will delete data     │
│                                         │
│  Reset Options:                         │
│  [ ] Delete all expenses                │
│  [ ] Delete all vendors                 │
│  [ ] Delete test users                  │
│  [ ] Keep blueprint (Phases 1-3)        │
│                                         │
│  [Reset Selected] button                │
└─────────────────────────────────────────┘
```

#### 4. Backup & Restore
```
┌─────────────────────────────────────────┐
│         Backup & Restore                │
├─────────────────────────────────────────┤
│  Create Backup:                         │
│  [Create Backup] → backup-2026-01-07.json│
│                                         │
│  Restore from Backup:                   │
│  [Choose File] [Restore]                │
│                                         │
│  Recent Backups:                        │
│  - backup-pre-phase1-2026-01-07.json    │
│  - backup-2026-01-06.json               │
└─────────────────────────────────────────┘
```

#### 5. Demo Mode Toggle
```
┌─────────────────────────────────────────┐
│         Mode Selection                  │
├─────────────────────────────────────────┤
│  Current Mode: BLUEPRINT                │
│                                         │
│  [ ] Blueprint Mode (Planning)          │
│      - Phases 1-3 structure             │
│      - No real expenses                 │
│                                         │
│  [ ] Testing Mode (Development)         │
│      - Blueprint + seed data            │
│      - Can reset anytime                │
│                                         │
│  [ ] Production Mode (Live)             │
│      - Real data only                   │
│      - No resets allowed                │
│                                         │
│  [Switch Mode] button                   │
└─────────────────────────────────────────┘
```

---

## API Endpoints

### Seed Data
```
POST /api/admin/seed-data
Body: {
  scenario: 'quick-test' | 'full-test' | 'custom',
  config: { expenses: 50, vendors: 10, ... }
}
Response: { created: { expenses: 50, vendors: 10 } }
```

### Reset Data
```
POST /api/admin/reset-data
Body: {
  deleteExpenses: true,
  deleteVendors: true,
  deleteTestUsers: true,
  keepBlueprint: true
}
Response: { deleted: { expenses: 50, vendors: 10 } }
```

### Backup
```
POST /api/admin/backup
Response: { file: 'backup-2026-01-07.json', size: '125KB' }
```

### Restore
```
POST /api/admin/restore
Body: { file: FormData }
Response: { restored: { departments: 11, projects: 21, ... } }
```

### Get Status
```
GET /api/admin/data-status
Response: {
  mode: 'blueprint' | 'testing' | 'production',
  counts: { departments: 11, projects: 21, ... },
  hasTestData: false
}
```

---

## Seed Data Scenarios

### Quick Test (10 expenses)
```javascript
{
  expenses: 10,
  vendors: 3,
  users: 5,
  statusMix: {
    draft: 3,
    submitted: 4,
    approved: 2,
    paid: 1
  },
  dateRange: 'phase1'
}
```

### Full Test (50 expenses)
```javascript
{
  expenses: 50,
  vendors: 10,
  users: 15,
  statusMix: {
    draft: 10,
    submitted: 15,
    approved: 15,
    paid: 8,
    rejected: 2
  },
  dateRange: 'all'
}
```

### Approval Workflow Test
```javascript
{
  expenses: 20,
  vendors: 5,
  users: 10,
  workflow: 'multi-level',
  includeRejections: true,
  includeResubmissions: true
}
```

### Budget Alert Test
```javascript
{
  expenses: 15,
  targetProject: 'P1-3 Marketing',
  createOverBudget: true,
  createNearLimit: true
}
```

---

## Implementation Plan

### Phase 1: Seed Data Generator Script
- Create `scripts/seed-test-data.ts`
- Support multiple scenarios
- Generate realistic data
- Maintain relationships

### Phase 2: Reset Script
- Create `scripts/reset-test-data.ts`
- Selective deletion
- Keep blueprint option
- Safety confirmations

### Phase 3: API Endpoints
- Add admin routes
- Implement seed/reset logic
- Add backup/restore
- Add status endpoint

### Phase 4: UI Component
- Create admin page
- Data overview dashboard
- Seed data controls
- Reset controls
- Backup/restore UI

### Phase 5: Demo Mode
- Add mode tracking
- Mode-specific UI
- Production safeguards
- Mode switching

---

## Safety Features

### 1. Production Protection
```javascript
if (mode === 'production') {
  throw new Error('Cannot reset data in production mode');
}
```

### 2. Confirmation Required
```javascript
// UI requires typing "CONFIRM" to reset
// API requires confirmation token
```

### 3. Automatic Backups
```javascript
// Auto-backup before any reset
// Keep last 5 backups
```

### 4. Audit Log
```javascript
// Log all seed/reset operations
// Track who did what when
```

---

## Testing Workflow

### Developer Testing
1. Start in Blueprint mode
2. Generate "Quick Test" seed data
3. Test expense creation/approval
4. Test budget tracking
5. Reset data
6. Repeat with different scenarios

### Demo/Presentation
1. Switch to Testing mode
2. Generate "Full Test" seed data
3. Show realistic workflows
4. Demonstrate features
5. Reset for next demo

### Pre-Production
1. Backup blueprint
2. Switch to Production mode
3. Clear all test data
4. Verify clean state
5. Ready for real data

---

## File Structure

```
/workspaces/FliHub/
├── scripts/
│   ├── seed-test-data.ts          # Generate seed data
│   ├── reset-test-data.ts         # Reset test data
│   └── scenarios/
│       ├── quick-test.ts          # Quick test scenario
│       ├── full-test.ts           # Full test scenario
│       ├── approval-workflow.ts   # Approval testing
│       └── budget-alerts.ts       # Budget testing
├── src/
│   ├── routes/
│   │   └── api/
│   │       └── admin/
│   │           ├── seed-data/+server.ts
│   │           ├── reset-data/+server.ts
│   │           ├── backup/+server.ts
│   │           └── restore/+server.ts
│   └── lib/
│       └── components/
│           └── admin/
│               └── data-management.svelte
└── docs/
    └── testing-seed-data-plan.md  # This document
```

---

## Next Steps

1. Create seed data generator script
2. Create reset script
3. Build API endpoints
4. Create UI component
5. Add demo mode toggle
6. Test all scenarios
7. Document for team

---

## Benefits

✅ **Rapid Testing:** Generate data in seconds  
✅ **Realistic Scenarios:** Test real workflows  
✅ **Easy Reset:** Start fresh anytime  
✅ **Safe Development:** Can't break production  
✅ **Demo Ready:** Always have demo data  
✅ **Team Friendly:** Anyone can test  
✅ **Production Ready:** Clean slate for launch
