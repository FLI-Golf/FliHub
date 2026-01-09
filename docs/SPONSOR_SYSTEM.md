# Sponsor System - Casino to Franchise Pipeline

## Overview
Tiered sponsorship system designed for casinos and resorts with a bridge to convert sponsors into franchise owners. Sponsors receive discounts on franchise fees based on their sponsorship investment.

## Sponsorship Tiers

### Tier Pricing Structure (Yearly Revenue)

| Tier | 2025 | 2026 | 2027 | 3-Year Total | Description |
|------|------|------|------|--------------|-------------|
| **Tier 1** | $7,000,000 | $5,000,000 | $3,000,000 | $15,000,000 | Premium - Maximum visibility |
| **Tier 2** | $5,000,000 | $7,000,000 | $9,000,000 | $21,000,000 | Elite - Growing investment |
| **Tier 3** | $1,000,000 | $1,000,000 | $2,000,000 | $4,000,000 | Standard - Consistent commitment |
| **Tier 4** | $1,000,000 | $1,500,000 | $2,000,000 | $4,500,000 | Growth - Increasing investment |

### Tier Benefits

**Tier 1 - Premium**
- Highest visibility across all FLI Golf properties
- Exclusive naming rights opportunities
- Priority franchise conversion rights
- Maximum discount on franchise fees

**Tier 2 - Elite**
- Growing investment model (increases each year)
- Highest 3-year total commitment
- Premium visibility and benefits
- Substantial franchise fee discounts

**Tier 3 - Standard**
- Consistent annual commitment
- Standard visibility and benefits
- Franchise conversion eligibility
- Moderate franchise fee discounts

**Tier 4 - Growth**
- Increasing investment over time
- Entry-level premium sponsorship
- Franchise conversion pathway
- Base franchise fee discounts

## Sponsor-to-Franchise Bridge

### Conversion Process

1. **Sponsor Active** - Casino/resort is active sponsor
2. **Interest Expressed** - Sponsor indicates franchise interest
3. **Evaluation** - Financial and operational assessment
4. **Negotiation** - Terms and territory discussion
5. **Franchise Deal Pending** - Contract preparation
6. **Converted** - Sponsor becomes franchise owner

### Franchise Fee Discount Structure

Sponsors receive discounts on the $10M franchise fee based on their sponsorship investment:

**Discount Formula:**
- 10% discount for every $1M in sponsorship value
- Maximum discount: 30%

**Examples:**

| Sponsorship Value | Discount % | Discount Amount | Net Franchise Fee |
|-------------------|------------|-----------------|-------------------|
| $1,000,000 | 10% | $1,000,000 | $9,000,000 |
| $3,000,000 | 30% | $3,000,000 | $7,000,000 |
| $5,000,000 | 30% (max) | $3,000,000 | $7,000,000 |
| $7,000,000 | 30% (max) | $3,000,000 | $7,000,000 |

**Tier 1 Example (3-year sponsor):**
- Total sponsorship: $15,000,000
- Franchise fee discount: $3,000,000 (30% max)
- Net franchise fee: $7,000,000
- **Total investment: $22,000,000** (sponsorship + franchise)

**Tier 2 Example (3-year sponsor):**
- Total sponsorship: $21,000,000
- Franchise fee discount: $3,000,000 (30% max)
- Net franchise fee: $7,000,000
- **Total investment: $28,000,000** (sponsorship + franchise)

## Collections

### 1. sponsors
Casino and corporate sponsorships

**Fields:**
- `companyName` - Sponsor company name
- `type` - casino, resort, hospitality, entertainment, corporate, other
- `tier` - tier_1, tier_2, tier_3, tier_4
- `status` - prospect, negotiating, active, renewed, expired, converted_to_franchise, inactive
- `primaryContactName` - Main contact person
- `primaryContactEmail` - Contact email
- `primaryContactPhone` - Contact phone
- `location` - Sponsor location
- `territory` - Geographic territory
- `contractStartDate` - Contract start
- `contractEndDate` - Contract end
- `currentYear` - Current year (2025, 2026, 2027)
- `annualCommitment` - Annual sponsorship amount
- `totalPaid` - Total amount paid to date
- `franchiseInterest` - Boolean - interested in franchise
- `franchiseConversionDate` - Date converted to franchise
- `franchiseDealId` - Link to franchise_deals
- `assignedTo` - Sales rep managing relationship
- `notes` - Additional notes

### 2. sponsor_franchise_bridge
Tracks sponsor-to-franchise conversion process

**Fields:**
- `sponsorId` - Link to sponsors collection
- `status` - Conversion stage
- `interestExpressedDate` - When interest was expressed
- `evaluationStartDate` - When evaluation began
- `sponsorshipValueToDate` - Total sponsorship investment
- `franchiseFeeDiscount` - Calculated discount amount
- `netFranchiseFee` - Final franchise fee after discount
- `franchiseLeadId` - Link to franchise_leads
- `franchiseOpportunityId` - Link to franchise_opportunities
- `franchiseDealId` - Link to franchise_deals (when converted)
- `proposedTerritory` - Territory for franchise
- `targetConversionDate` - Expected conversion date
- `actualConversionDate` - Actual conversion date
- `assignedSalesRep` - Sales rep managing conversion
- `notes` - Conversion notes

### 3. franchise_leads (Updated)
Added sponsor relationship tracking:
- `isExistingSponsor` - Boolean flag
- `sponsorId` - Link to sponsors collection
- `sponsorBridgeId` - Link to sponsor_franchise_bridge

## Dashboard Features

### Sponsors Dashboard (`/dashboard/sponsors`)

**Metrics:**
- Active Sponsors count
- Total Revenue from sponsors
- Franchise Interest count
- Converted to Franchise count
- Sponsors by Tier breakdown

**Sections:**
- **Tier Pricing Reference** - Full pricing table with counts
- **Active Sponsors** - List of active sponsorships
- **Franchise Conversion Pipeline** - Sponsors in conversion process

**Access:** Admin and Sales roles

## Sample Data

### Casino Sponsors Created

1. **MGM Grand Casino**
   - Tier 1, Active
   - $7M annual (2025)
   - Franchise interest: Yes
   - Territory: Las Vegas

2. **Caesars Palace**
   - Tier 2, Active
   - $5M annual (2025)
   - Franchise interest: No
   - Territory: Las Vegas

3. **Wynn Resorts**
   - Tier 1, Negotiating
   - $7M annual (2025)
   - Franchise interest: Yes
   - Territory: Las Vegas

4. **Atlantis Casino Resort**
   - Tier 3, Active
   - $1M annual (2025)
   - Franchise interest: No
   - Territory: Caribbean

5. **Mohegan Sun**
   - Tier 4, Prospect
   - $1M annual (2025)
   - Franchise interest: No
   - Territory: Northeast

## Navigation

**Sidebar:**
- "Sponsors" menu item added
- Visible to: Admin and Sales roles
- Icon: Star

**Sales Role Access:**
- Dashboard
- **Sponsors** ← NEW
- Franchise Sales
- Projects
- Tasks

**Admin Role Access:**
- All features including Sponsors

## Scripts

### Setup Scripts

```bash
# Create sponsor collections
npx tsx scripts/create-sponsor-collections.ts

# Create sample casino sponsors
npx tsx scripts/create-sample-sponsors.ts

# Check sponsor data
npx tsx scripts/check-sponsors.ts
```

## Business Model

### Revenue Streams

**Sponsorship Revenue (3-year example):**
- 2 x Tier 1: $30,000,000
- 1 x Tier 2: $21,000,000
- 1 x Tier 3: $4,000,000
- 1 x Tier 4: $4,500,000
- **Total: $59,500,000** over 3 years

**Franchise Conversion Revenue:**
- Tier 1 sponsor converts: $7,000,000 (after $3M discount)
- Tier 2 sponsor converts: $7,000,000 (after $3M discount)
- **Additional: $14,000,000**

**Combined Model:**
- Sponsorship: $59,500,000
- Franchise fees: $14,000,000
- **Total: $73,500,000** over 3 years

### Strategic Benefits

1. **Lower Barrier to Entry**
   - Sponsors "test drive" the partnership
   - Build relationship before franchise commitment
   - Reduce risk for both parties

2. **Increased Conversion Rate**
   - Sponsors already invested in brand
   - Proven partnership success
   - Financial incentive to convert

3. **Higher Total Value**
   - Sponsorship + Franchise > Franchise alone
   - Long-term relationship building
   - Multiple revenue touchpoints

4. **Casino Focus**
   - Natural fit with golf entertainment
   - High-value partners
   - Geographic expansion opportunities

## Integration with Franchise Sales

### Workflow

1. **Casino becomes Sponsor** (Tier 1-4)
2. **Sponsor expresses franchise interest**
3. **Bridge record created** with discount calculation
4. **Franchise lead created** (linked to sponsor)
5. **Opportunity created** with adjusted deal value
6. **Deal closed** at net franchise fee
7. **Sponsor status** → converted_to_franchise

### Data Flow

```
sponsors
    ↓
sponsor_franchise_bridge
    ↓
franchise_leads (isExistingSponsor = true)
    ↓
franchise_opportunities (dealValue = netFranchiseFee)
    ↓
franchise_deals (dealValue = netFranchiseFee)
```

## Future Enhancements

- Sponsor detail pages
- Contract management
- Payment tracking
- Benefit fulfillment tracking
- Conversion funnel analytics
- Automated discount calculations
- Territory availability integration
- Multi-year contract renewals
- Sponsor performance dashboards
- ROI reporting for sponsors

## Files Created/Modified

### Schemas
- `src/lib/domain/schemas/sponsor.schema.ts` (NEW)
- `src/lib/domain/schemas/sponsor-franchise-bridge.schema.ts` (NEW)
- `src/lib/domain/schemas/franchise-lead.schema.ts` (updated with sponsor fields)
- `src/lib/domain/schemas/index.ts` (export new schemas)

### Routes
- `src/routes/dashboard/sponsors/+page.svelte` (NEW)
- `src/routes/dashboard/sponsors/+page.server.ts` (NEW)

### Components
- `src/lib/components/flihub-sidebar.svelte` (added Sponsors navigation)

### Scripts
- `scripts/create-sponsor-collections.ts` (NEW)
- `scripts/create-sample-sponsors.ts` (NEW)
- `scripts/check-sponsors.ts` (NEW)

## Support

For questions or issues:
1. Check PocketBase admin panel for sponsor data
2. Verify tier pricing calculations
3. Review bridge status for conversions
4. Check franchise lead linkages
