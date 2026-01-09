# Complete Sponsor Collections Schema

## Collections Overview

Two main collections for the sponsor system with full field definitions:

1. **sponsors** - Casino and corporate sponsorships (22 fields)
2. **sponsor_franchise_bridge** - Conversion pipeline tracking (18 fields)

## 1. sponsors Collection

**Collection ID:** `pbc_3665759510`

### Fields (22 total)

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `id` | text | Yes | Auto-generated 15-char ID |
| `companyName` | text | Yes | Sponsor company name (1-255 chars) |
| `type` | select | Yes | casino, resort, hospitality, entertainment, corporate, other |
| `tier` | select | Yes | tier_1, tier_2, tier_3, tier_4 |
| `status` | select | Yes | prospect, negotiating, active, renewed, expired, converted_to_franchise, inactive |
| `primaryContactName` | text | No | Main contact person (max 255 chars) |
| `primaryContactEmail` | email | No | Contact email address |
| `primaryContactPhone` | text | No | Contact phone (max 50 chars) |
| `location` | text | No | Sponsor location (max 255 chars) |
| `territory` | text | No | Geographic territory (max 255 chars) |
| `contractStartDate` | date | No | Contract start date |
| `contractEndDate` | date | No | Contract end date |
| `currentYear` | number | No | Current year (2025-2027) |
| `annualCommitment` | number | No | Annual sponsorship amount (min 0) |
| `totalPaid` | number | No | Total amount paid to date (min 0) |
| `franchiseInterest` | bool | No | Interested in franchise ownership |
| `franchiseConversionDate` | date | No | Date converted to franchise |
| `franchiseDealId` | relation | No | Link to franchise_deals collection |
| `assignedTo` | relation | No | Link to user_profiles (sales rep) |
| `notes` | editor | No | Rich text notes |
| `created` | autodate | No | Auto-set on creation |
| `updated` | autodate | No | Auto-updated on modification |

### Access Rules
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != ""`
- Delete: `@request.auth.id != ""`

## 2. sponsor_franchise_bridge Collection

**Collection ID:** `pbc_3558535174`

### Fields (18 total)

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `id` | text | Yes | Auto-generated 15-char ID |
| `sponsorId` | relation | Yes | Link to sponsors collection |
| `status` | select | Yes | sponsor_active, interest_expressed, evaluation, negotiation, franchise_deal_pending, converted, declined |
| `interestExpressedDate` | date | No | When interest was expressed |
| `evaluationStartDate` | date | No | When evaluation began |
| `sponsorshipValueToDate` | number | No | Total sponsorship investment (min 0) |
| `franchiseFeeDiscount` | number | No | Calculated discount amount (min 0) |
| `netFranchiseFee` | number | No | Final franchise fee after discount (min 0) |
| `franchiseLeadId` | relation | No | Link to franchise_leads collection |
| `franchiseOpportunityId` | relation | No | Link to franchise_opportunities collection |
| `franchiseDealId` | relation | No | Link to franchise_deals collection |
| `proposedTerritory` | text | No | Territory for franchise (max 255 chars) |
| `targetConversionDate` | date | No | Expected conversion date |
| `actualConversionDate` | date | No | Actual conversion date |
| `assignedSalesRep` | relation | No | Link to user_profiles (sales rep) |
| `notes` | editor | No | Rich text conversion notes |
| `created` | autodate | No | Auto-set on creation |
| `updated` | autodate | No | Auto-updated on modification |

### Access Rules
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id != ""`
- Delete: `@request.auth.id != ""`

## 3. franchise_leads Collection (Updated)

### New Sponsor Fields Added

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| `isExistingSponsor` | bool | No | Flag indicating if lead is existing sponsor |
| `sponsorId` | relation | No | Link to sponsors collection |
| `sponsorBridgeId` | relation | No | Link to sponsor_franchise_bridge collection |

## Tier Pricing Reference

### Annual Commitments by Tier

| Tier | 2025 | 2026 | 2027 | Total |
|------|------|------|------|-------|
| tier_1 | $7,000,000 | $5,000,000 | $3,000,000 | $15,000,000 |
| tier_2 | $5,000,000 | $7,000,000 | $9,000,000 | $21,000,000 |
| tier_3 | $1,000,000 | $1,000,000 | $2,000,000 | $4,000,000 |
| tier_4 | $1,000,000 | $1,500,000 | $2,000,000 | $4,500,000 |

## Status Values

### Sponsor Status
- `prospect` - Potential sponsor, initial discussions
- `negotiating` - In contract negotiations
- `active` - Active sponsorship contract
- `renewed` - Contract renewed
- `expired` - Contract expired
- `converted_to_franchise` - Converted to franchise owner
- `inactive` - No longer active

### Bridge Status
- `sponsor_active` - Currently active sponsor
- `interest_expressed` - Expressed interest in franchise
- `evaluation` - Under evaluation for franchise
- `negotiation` - Negotiating franchise terms
- `franchise_deal_pending` - Franchise deal in progress
- `converted` - Successfully converted to franchise
- `declined` - Declined franchise opportunity

## Type Values

- `casino` - Casino operations
- `resort` - Resort properties
- `hospitality` - Hospitality businesses
- `entertainment` - Entertainment venues
- `corporate` - Corporate sponsors
- `other` - Other sponsor types

## Discount Calculation

**Formula:**
```
discount_percentage = min((sponsorship_value / 1,000,000) * 10, 30)
franchise_fee_discount = (10,000,000 * discount_percentage) / 100
net_franchise_fee = 10,000,000 - franchise_fee_discount
```

**Examples:**
- $1M sponsorship = 10% discount = $1M off = $9M net fee
- $3M sponsorship = 30% discount = $3M off = $7M net fee
- $7M+ sponsorship = 30% max discount = $3M off = $7M net fee

## Import/Export

### JSON Export
Complete collection definitions available in:
`sponsor-collections-complete.json`

### Import to PocketBase
1. Go to PocketBase Admin UI
2. Navigate to Collections
3. Import from JSON file
4. Or use the update script: `npx tsx scripts/update-sponsor-collections.ts`

## Scripts

### Available Scripts

```bash
# Create collections (initial setup)
npx tsx scripts/create-sponsor-collections.ts

# Update collections with all fields
npx tsx scripts/update-sponsor-collections.ts

# Create sample casino sponsors
npx tsx scripts/create-sample-sponsors.ts

# Check sponsor data
npx tsx scripts/check-sponsors.ts
```

## Sample Data

### Casino Sponsors
1. MGM Grand Casino (Tier 1, Active, Franchise Interest)
2. Caesars Palace (Tier 2, Active)
3. Wynn Resorts (Tier 1, Negotiating, Franchise Interest)
4. Atlantis Casino Resort (Tier 3, Active)
5. Mohegan Sun (Tier 4, Prospect)

## Integration Points

### With Franchise Sales System
- Sponsors can express franchise interest
- Bridge tracks conversion process
- Leads created with sponsor linkage
- Opportunities created with discounted deal value
- Deals closed at net franchise fee

### Data Flow
```
sponsors (franchiseInterest = true)
    ↓
sponsor_franchise_bridge (status progression)
    ↓
franchise_leads (isExistingSponsor = true)
    ↓
franchise_opportunities (dealValue = netFranchiseFee)
    ↓
franchise_deals (dealValue = netFranchiseFee)
```

## Dashboard Access

**URL:** `/dashboard/sponsors`

**Visible to:**
- Admin role (full access)
- Sales role (full access)

**Features:**
- Tier pricing reference table
- Active sponsors list
- Franchise conversion pipeline
- Metrics and analytics

## Notes

- All monetary values are in USD
- Dates are stored in ISO 8601 format
- Relations use cascade delete = false (preserve data)
- Editor fields support rich text formatting
- Autodate fields are system-managed
- All collections require authentication for access
