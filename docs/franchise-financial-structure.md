# Franchise Financial Structure

## Overview

The franchise system has been updated to support staged payments and detailed financial tracking for $10M+ franchise deals.

## Key Changes

### 1. Franchise Deal Schema Updates

**New Fields:**
- `totalFranchiseValue` - Base franchise worth (default: $10M)
- `sponsorshipDiscount` - Discount from prior sponsorship
- `negotiatedValue` - Custom negotiated value (if different from base)
- `netFranchiseValue` - Final value after discounts
- `initialPayment` - Down payment amount
- `totalPaidToDate` - Running total of all payments
- `outstandingBalance` - Remaining amount owed
- `paymentMilestones` - JSON array of staged payment milestones
- `sponsorBridgeId` - Link to sponsor conversion (if applicable)

**Legacy Fields (Deprecated):**
- `dealValue` → replaced by `totalFranchiseValue`
- `paymentReceived` → replaced by `totalPaidToDate`
- `paymentDueDate` → now in `paymentMilestones`

### 2. Payment Milestones

Each milestone tracks:
```typescript
{
  milestoneNumber: number;        // 1, 2, 3, etc.
  description: string;            // e.g., "Initial Payment (20%)"
  amountDue: number;              // Amount expected
  dueDate: Date;                  // When payment is due
  amountPaid: number;             // Amount actually paid
  paidDate: Date;                 // When payment was received
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  notes: string;                  // Additional notes
}
```

**Default Structure:**
- 5 milestones of 20% each
- Customizable per deal

### 3. Sponsor-to-Franchise Conversion

**Updated Fields:**
- `franchiseDiscount` - Discount amount (replaces `franchiseFeeDiscount`)
- `totalFranchiseValue` - Base value before discount
- `netFranchiseValue` - Value after discount (replaces `netFranchiseFee`)

**Discount Calculation:**
- 10% discount per $1M in sponsorship value
- Maximum 30% discount
- Example: $3M sponsorship = 30% discount = $3M off $10M = $7M net value

### 4. Deal Status Updates

**New Statuses:**
- `payment_in_progress` - Staged payments underway
- `payment_completed` - All payments received
- `defaulted` - Payment default

**Removed:**
- `payment_received` → split into `payment_in_progress` and `payment_completed`

## UI Components

### New Components

1. **PaymentMilestonesCard** (`src/lib/components/franchise/PaymentMilestonesCard.svelte`)
   - Displays all payment milestones
   - Shows progress bars for partial payments
   - Tracks due dates and payment dates
   - Visual status indicators

2. **FranchiseFinancialSummary** (`src/lib/components/franchise/FranchiseFinancialSummary.svelte`)
   - Shows complete financial breakdown
   - Displays discounts and adjustments
   - Payment progress visualization
   - Sponsor conversion indicator

### Usage Example

```svelte
<script>
  import PaymentMilestonesCard from '$lib/components/franchise/PaymentMilestonesCard.svelte';
  import FranchiseFinancialSummary from '$lib/components/franchise/FranchiseFinancialSummary.svelte';
</script>

<FranchiseFinancialSummary
  totalFranchiseValue={deal.totalFranchiseValue}
  sponsorshipDiscount={deal.sponsorshipDiscount}
  netFranchiseValue={deal.netFranchiseValue}
  initialPayment={deal.initialPayment}
  totalPaidToDate={deal.totalPaidToDate}
  outstandingBalance={deal.outstandingBalance}
  sponsorBridgeId={deal.sponsorBridgeId}
/>

<PaymentMilestonesCard
  milestones={deal.paymentMilestones}
  totalValue={deal.netFranchiseValue}
  totalPaid={deal.totalPaidToDate}
  outstandingBalance={deal.outstandingBalance}
/>
```

## Migration

### Scripts

1. **migrate-franchise-financials.ts**
   - Adds new fields to `franchise_deals` collection
   - Migrates existing deals to new structure
   - Creates default 5-milestone payment plans

2. **migrate-sponsor-bridge-financials.ts**
   - Adds new fields to `sponsor_franchise_bridge` collection
   - Calculates discounts for existing bridges
   - Updates net franchise values

### Running Migrations

```bash
# Migrate franchise deals
npx tsx scripts/migrate-franchise-financials.ts

# Migrate sponsor bridges
npx tsx scripts/migrate-sponsor-bridge-financials.ts
```

## Helper Functions

### Franchise Deal Schema

```typescript
import { 
  calculateOutstandingBalance,
  calculatePaymentProgress,
  createDefaultMilestones
} from '$lib/domain/schemas/franchise-deal.schema';

// Calculate remaining balance
const balance = calculateOutstandingBalance(netValue, totalPaid);

// Calculate payment progress percentage
const progress = calculatePaymentProgress(netValue, totalPaid);

// Create default 5-stage milestones
const milestones = createDefaultMilestones(totalValue);
```

### Sponsor Bridge Schema

```typescript
import {
  calculateFranchiseDiscount,
  calculateNetFranchiseValue
} from '$lib/domain/schemas/sponsor-franchise-bridge.schema';

// Calculate discount based on sponsorship
const discount = calculateFranchiseDiscount(sponsorshipValue, baseValue);

// Calculate net value after discount
const netValue = calculateNetFranchiseValue(sponsorshipValue, baseValue);
```

## Best Practices

1. **Always use net franchise value** for payment calculations
2. **Track all payments** through milestones for audit trail
3. **Update outstanding balance** whenever payments are recorded
4. **Link sponsor conversions** via `sponsorBridgeId` for discount tracking
5. **Customize milestones** based on negotiated payment terms

## Future Enhancements

- Automated payment reminders based on milestone due dates
- Payment history tracking with transaction IDs
- Integration with accounting systems
- Automated commission calculations based on payment milestones
- Late payment penalties and interest calculations
