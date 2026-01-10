# ✅ Sample Data Migration Complete

All sample data has been successfully migrated with all fields properly populated.

## Data Created

### 1. Franchise Territories (5)

| Territory | Code | State | Population | Status | Price |
|-----------|------|-------|------------|--------|-------|
| Dallas-Fort Worth | TX-DFW | Texas | 7.6M | Available | $10M |
| Los Angeles | CA-LA | California | 13.2M | Available | $10M |
| Miami | FL-MIA | Florida | 6.2M | Available | $10M |
| Las Vegas | NV-LV | Nevada | 2.2M | Reserved | $10M |
| Phoenix | AZ-PHX | Arizona | 4.9M | Available | $10M |

**Features:**
- Full descriptions with rich text
- Market size and population data
- Territory codes for easy reference
- Las Vegas reserved for MGM Grand conversion

### 2. Franchise Leads (3)

| Name | Company | Territory | Status | Net Worth | Experience |
|------|---------|-----------|--------|-----------|------------|
| John Smith | Smith Enterprises | Dallas-Fort Worth | Qualified | $15M | Some |
| Sarah Johnson | Johnson Hospitality | Los Angeles | Contacted | $20M | Extensive |
| Michael Brown | - | Miami | New | $12M | None |

**Features:**
- Complete contact information
- Financial qualifications
- Experience levels
- Rich text notes
- Assigned to sales rep

### 3. Franchise Opportunities (2)

| Opportunity | Lead | Stage | Deal Value | Probability | Expected Close |
|-------------|------|-------|------------|-------------|----------------|
| Dallas-Fort Worth - John Smith | John Smith | Proposal | $10M | 75% | 60 days |
| Los Angeles - Sarah Johnson | Sarah Johnson | Qualification | $10M | 50% | 90 days |

**Features:**
- Linked to leads
- Stage tracking (8 stages)
- Probability percentages
- Follow-up dates
- Rich text notes

### 4. Casino Sponsors (5)

| Company | Type | Tier | Status | Annual | Total Paid | Franchise Interest |
|---------|------|------|--------|--------|------------|-------------------|
| MGM Grand Casino | Casino | Tier 1 | Active | $7M | $7M | ✅ Yes |
| Caesars Palace | Casino | Tier 2 | Active | $5M | $5M | No |
| Wynn Resorts | Resort | Tier 1 | Negotiating | $7M | $0 | ✅ Yes |
| Atlantis Casino Resort | Resort | Tier 3 | Active | $1M | $1M | No |
| Mohegan Sun | Casino | Tier 4 | Prospect | $1M | $0 | No |

**Features:**
- Complete contact details
- Contract dates
- Current year tracking (2025-2027)
- Territory assignments
- Rich text notes

### 5. Sponsor-Franchise Bridges (2)

| Sponsor | Status | Sponsorship Value | Discount | Net Franchise Fee |
|---------|--------|-------------------|----------|-------------------|
| MGM Grand Casino | Interest Expressed | $7M | $3M (30%) | $7M |
| Wynn Resorts | Evaluation | $0 | $0 (0%) | $10M |

**Features:**
- Conversion status tracking
- Automatic discount calculation
- Target conversion dates
- Proposed territories
- Rich text notes

## Tier Pricing Reference

| Tier | 2025 | 2026 | 2027 | Total |
|------|------|------|------|-------|
| Tier 1 | $7M | $5M | $3M | $15M |
| Tier 2 | $5M | $7M | $9M | $21M |
| Tier 3 | $1M | $1M | $2M | $4M |
| Tier 4 | $1M | $1.5M | $2M | $4.5M |

## Discount Structure

**Formula:** 10% per $1M sponsorship, max 30%

**Examples:**
- $1M sponsor → $1M discount → $9M net fee
- $3M sponsor → $3M discount → $7M net fee
- $7M sponsor → $3M discount (max) → $7M net fee

## Data Relationships

```
Territories
    ↓
Leads → Opportunities → Deals
    ↑
Sponsors → Bridges → Leads
```

## Access the Data

### Via Dashboard
1. Start dev server: `npm run dev`
2. Login as admin or sales
3. Navigate to:
   - `/dashboard/sales` - Franchise sales
   - `/dashboard/sponsors` - Sponsors

### Via Scripts

```bash
# View all sponsor data
npx tsx scripts/check-sponsors.ts

# Clear all sample data
npx tsx scripts/clear-sample-data.ts

# Recreate all sample data
npx tsx scripts/create-all-sample-data.ts
```

## Field Verification

All collections now have complete field definitions:

✅ **franchise_territories** - 13 fields + metadata
- name, code, description, state, city, region
- population, marketSize, status, price
- reservedUntil, dealId, notes

✅ **franchise_leads** - 18 fields + metadata
- firstName, lastName, email, phone, company
- location, territory, source, status
- netWorth, liquidCapital, experienceLevel
- isExistingSponsor, notes, qualifiedDate
- assignedTo, sponsorId, sponsorBridgeId

✅ **franchise_opportunities** - 13 fields + metadata
- leadId, opportunityName, stage, dealValue
- probability, expectedCloseDate, territory
- proposalSentDate, lastContactDate, nextFollowUpDate
- notes, assignedTo, projectId

✅ **franchise_deals** - 14 fields + metadata
- opportunityId, dealNumber, franchiseOwnerName
- territory, dealValue, paymentReceived
- paymentDueDate, contractSignedDate, status
- franchiseOwnerProfileId, notes, closedBy
- commissionPaid, commissionAmount

✅ **sponsors** - 19 fields + metadata
- companyName, type, tier, status
- primaryContactName, primaryContactEmail, primaryContactPhone
- location, territory, contractStartDate, contractEndDate
- currentYear, annualCommitment, totalPaid
- franchiseInterest, franchiseConversionDate
- notes, franchiseDealId, assignedTo

✅ **sponsor_franchise_bridge** - 15 fields + metadata
- sponsorId, status, interestExpressedDate
- evaluationStartDate, sponsorshipValueToDate
- franchiseFeeDiscount, netFranchiseFee
- franchiseLeadId, franchiseOpportunityId, franchiseDealId
- proposedTerritory, targetConversionDate, actualConversionDate
- assignedSalesRep, notes

## Next Steps

### Immediate
- View data in dashboards
- Test filtering and sorting
- Verify all fields display correctly

### Future
- Add more territories
- Create additional leads
- Track opportunity progression
- Convert sponsors to franchises

## Notes

- All monetary values are in USD
- All dates are in ISO 8601 format
- Rich text fields use HTML editor format
- Relations properly link between collections
- All data assigned to sales rep where applicable

---

**Status:** ✅ COMPLETE - All sample data migrated successfully with full field population
