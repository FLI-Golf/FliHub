# Event Payment Approval Workflow - Complete Implementation

## Overview
You now have a complete payment approval pipeline that automatically processes event payments from creation through payout.

## Workflow Stages

### 1. **Payment Creation** (Automatic during Event Setup)
- When confirmed talent is assigned to an event, payments are generated
- Payments get status based on amount vs. approval threshold:
  - `amount < threshold` → `status: 'pending'` (direct payout)
  - `amount ≥ threshold` → `status: 'approval_required'` (needs approval)
  - `event.requiresApproval = true` → all payments get `approval_required`

### 2. **Approval Pipeline** ✨ NEW
**Two ways to approve payments:**

#### A. Automatic (Seeding)
```bash
npx tsx scripts/seed-events.ts
```
Creates 8 events with 46 total payments, **automatically approves all 46 on pipeline** ✓

#### B. Manual (Admin UI)
1. Go to Dashboard → Events → [Event Name]
2. Scroll to "Payments" section
3. For each `approval_required` payment:
   - Click orange **"Approve"** button
   - Payment transitions: `approval_required` → `approved`

#### C. Programmatic (API)
```bash
# Approve single payment
POST /api/events/{eventId}/payments/{paymentId}/approve

# Approve all pending for an event
POST /api/events/{eventId}/payments/approve-all
```

### 3. **Payment Settlement** (Mark as Paid)
Once approved (`status: 'approved'`):
1. Admin clicks green **"Mark Paid"** button in event payments
2. Payment transitions: `approved` → `paid`
3. Work order automatically created for accounting

## Implementation Details

### New API Endpoints

#### `POST /api/events/[id]/payments/[paymentId]/approve`
Approves a single `approval_required` payment
```typescript
// Request: POST /api/events/{eventId}/payments/{paymentId}/approve
// Response: { status: 'approved', approvedAt, approvedBy, ... }
```

#### `POST /api/events/[id]/payments/approve-all`
Bulk approves all `approval_required` payments for an event
```typescript
// Request: POST /api/events/{eventId}/payments/approve-all
// Response: { 
//   approvedCount: 46, 
//   totalCount: 46, 
//   message: "46 of 46 payments approved"
// }
```

### Updated Files

1. **`/src/routes/api/events/[id]/payments/[paymentId]/approve/+server.ts`** ✨ NEW
   - Single payment approval endpoint
   - Validates status transition
   - Sets `approvedBy`, `approvedAt` fields

2. **`/src/routes/api/events/[id]/payments/approve-all/+server.ts`** ✨ NEW
   - Bulk approval for seeding/admin workflows
   - Iterates and approves matching payments
   - Returns count summary

3. **`/src/routes/api/events/seed/+server.ts`**
   - Added `approveAllPendingPayments()` function
   - POST now returns: `{ events, approvedPayments }`
   - PATCH (reset) also approves all payments

4. **`/scripts/seed-events.ts`**
   - Added approval function
   - CLI reports approved payment count
   - Automatic approval on seed completion

5. **`/src/routes/dashboard/events/[id]/+page.svelte`**
   - Added orange **"Approve"** button (when `status === 'approval_required'`)
   - Changed green **"Mark Paid"** button to only show when `status === 'approved'`
   - Added `approvPayment()` function

## Payment Status Flow

```
┌─────────────────────────────────────────────────────────┐
│                   PAYMENT CREATED                        │
│  (Auto-generated from confirmed event talent)            │
└─────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
   [pending]                         [approval_required]
   (Direct pay,                      (Needs admin approval)
    below threshold)                          ↓
        ↓                              Click "Approve"
        ↓                                   ↓
   [approved]  ←─────────────────────────────┘
        ↓
   Click "Mark Paid"
        ↓
     [paid]
        ↓
   Work order created
   (for accounting/settlement)
```

## Seeding Example Output

```
✓ Approved 46 payments for payout

── Seed complete ──────────────────────────────────────────────
Events created: 8 (1 appearance, 1 clinic, 1 media, 1 promo, 1 content, 3 broadcast)
Payments approved: 46
```

## Testing the Workflow

### Step 1: Seed Test Data
```bash
npx tsx scripts/seed-events.ts
```
✓ Creates 8 events
✓ Creates 46 payments
✓ Approves all 46 payments automatically

### Step 2: Verify Approvals
- Go to Dashboard → Events
- Click on any event (e.g., "FLI Golf Season Opener — Community Appearance")
- Scroll to "Payments" section
- You should see payments with status `approved` and a green "Mark Paid" button

### Step 3: Mark as Paid
- Click "Mark Paid" on an approved payment
- Payment transitions to `paid`
- Work order is auto-created for accounting

### Step 4: Clear and Reset
```bash
# Clear all seed data
npx tsx scripts/seed-events.ts --clear

# Reset (clear + reseed)
npx tsx scripts/seed-events.ts --reset
```

## Key Features

✅ **Automatic Approval** - Payments approved during seeding
✅ **Manual Approval** - Admin UI button for individual payments  
✅ **Bulk Approval** - API endpoint to approve all pending for event
✅ **Status Tracking** - Clear payment status throughout pipeline
✅ **Work Order Integration** - Auto-create WO when marked paid
✅ **Manager Splits** - Support for talent with manager commission
✅ **Budget Integration** - Fund check before payout
✅ **Approval History** - Track approvedBy and approvedAt dates

## Architecture Notes

- **Approval Route**: Payments use `approvalRoute: 'approval_pipeline'` to indicate they go through the full workflow
- **Threshold-Based**: Approval requirement tied to configurable event `approvalThreshold`
- **Non-Destructive**: Payments never deleted after created, only `cancelled`
- **Audit Trail**: `approvedBy`, `approvedAt`, `paidBy`, `paidAt` tracked for accounting

## Next Steps (Optional)

1. **Dashboard Widget** - Add payment approval count to main dashboard
2. **Batch Payment Processing** - Process multiple events' payments at once
3. **Payment Reconciliation** - Verify settled vs. accounting records
4. **Historical Reporting** - Track approval/payment timelines
5. **Notifications** - Alert when payments ready for settlement

---

**Status**: ✅ Complete and tested
**Last Updated**: Today
**Ready for**: Live event payment processing
