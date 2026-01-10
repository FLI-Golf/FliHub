# FliHub Dashboard Analysis & Recommendations

## Executive Summary
The current dashboard focuses primarily on **Projects**, **Departments**, **Expenses**, and **Approvals**. However, the database contains many additional collections that represent critical business data for running a disc golf league. This analysis identifies missing data visualizations and proposes new charts to create a comprehensive business intelligence dashboard.

---

## Current Dashboard Coverage

### ✅ Currently Tracked Collections
1. **projects** - Full coverage with status breakdown, phase filtering
2. **departments** - Budget allocation, spending by department
3. **expenses** - Pipeline tracking (draft → submitted → approved → paid)
4. **approvals** - Workflow status tracking
5. **user_profiles** - Basic people count
6. **tasks** - Used for expense-to-department mapping

### ❌ Missing Collections (Not Visualized)
1. **sponsors** - Revenue tracking, tier distribution, conversion pipeline
2. **franchise_deals** - Sales pipeline, revenue forecasting
3. **franchise_opportunities** - Lead funnel, territory coverage
4. **franchise_leads** - Lead generation and qualification
5. **franchise_territories** - Geographic coverage and availability
6. **pros** - Player roster, status distribution
7. **campaigns** - Marketing campaign performance
8. **vendors** - Vendor relationships and spending
9. **budgets** - Budget planning and tracking
10. **budget_periods** - Period-based budget analysis
11. **business_objectives** - Strategic goal tracking
12. **marketing_goals** - Marketing KPI tracking
13. **brand_positioning** - Brand strategy tracking
14. **broadcast_partners** - Media partnership tracking
15. **digital_marketing_strategy** - Digital marketing metrics
16. **swot_analysis** - Strategic analysis tracking
17. **continuous_improvement** - Process improvement tracking

---

## Critical Data Relationships

### Revenue Generation Flow
```
sponsors (revenue) → franchise_opportunities → franchise_leads → franchise_deals (revenue)
                                                                        ↓
                                                              franchise_territories
```

### Expense & Budget Flow
```
departments (budget) → projects (forecasted) → tasks → expenses (actual)
                                                          ↓
                                                      approvals
```

### Marketing & Sales Flow
```
campaigns → marketing_goals → digital_marketing_strategy
                                        ↓
                              franchise_leads → franchise_opportunities
```

### Operations Flow
```
pros (players) → projects (events/tournaments)
                        ↓
                    tasks → expenses
```

---

## Proposed New Dashboard Sections

### 1. **Revenue Dashboard** (HIGH PRIORITY)
**Purpose**: Track revenue generation from sponsors and franchise sales

#### Charts & Metrics:
- **Sponsor Revenue Overview**
  - Total committed revenue by tier (Tier 1-4)
  - Revenue by year (2025, 2026, 2027)
  - Sponsor status distribution (prospect → negotiating → active → renewed)
  - Conversion rate: sponsors → franchise deals
  
- **Franchise Sales Pipeline**
  - Deal funnel: leads → opportunities → deals
  - Deal status breakdown (pending_signature → signed → payment_received → active)
  - Revenue forecasted vs. received
  - Territory coverage map/heatmap
  - Average deal cycle time
  
- **Revenue Forecasting**
  - Monthly recurring revenue (MRR) projection
  - Annual recurring revenue (ARR) by source
  - Payment collection status
  - Revenue at risk (expiring contracts)

**Collections Used**: `sponsors`, `franchise_deals`, `franchise_opportunities`, `franchise_leads`, `franchise_territories`

**Key Metrics**:
```typescript
{
  sponsors: {
    total: number,
    byTier: { tier_1: number, tier_2: number, tier_3: number, tier_4: number },
    byStatus: { prospect: number, negotiating: number, active: number, renewed: number },
    totalCommitted: number,
    totalPaid: number,
    conversionToFranchise: number
  },
  franchises: {
    totalDeals: number,
    totalValue: number,
    totalReceived: number,
    pipeline: { leads: number, opportunities: number, deals: number },
    dealsByStatus: { pending_signature: number, signed: number, payment_received: number, active: number },
    territoriesCovered: number,
    territoriesAvailable: number
  }
}
```

---

### 2. **Player Management Dashboard** (MEDIUM PRIORITY)
**Purpose**: Track professional player roster and engagement

#### Charts & Metrics:
- **Player Roster Overview**
  - Total active pros
  - Status distribution (active, inactive, retired)
  - Gender distribution
  - Geographic distribution (by country/residence)
  
- **Player Rankings**
  - Top 10 world rankings
  - Ranking trends over time
  
- **Contract Status**
  - Players with signed contracts
  - Contract renewal dates
  - Sponsorship status

**Collections Used**: `pros`

**Key Metrics**:
```typescript
{
  pros: {
    total: number,
    active: number,
    inactive: number,
    retired: number,
    byGender: { male: number, female: number, other: number },
    topRanked: number, // count in top 100
    withContracts: number,
    byCountry: Record<string, number>
  }
}
```

---

### 3. **Marketing Performance Dashboard** (MEDIUM PRIORITY)
**Purpose**: Track marketing campaign effectiveness and ROI

#### Charts & Metrics:
- **Campaign Performance**
  - Active campaigns count
  - Campaign status distribution
  - Budget vs. actual spend by campaign
  - Campaign ROI (if lead attribution available)
  
- **Marketing Goals Tracking**
  - Goal completion rate
  - Goals by category
  - Timeline to goal completion
  
- **Digital Marketing Metrics**
  - Channel performance
  - Lead generation by source
  - Conversion rates

**Collections Used**: `campaigns`, `marketing_goals`, `digital_marketing_strategy`

**Key Metrics**:
```typescript
{
  campaigns: {
    total: number,
    active: number,
    byStatus: { planning: number, active: number, paused: number, completed: number },
    totalBudget: number,
    totalSpend: number,
    byType: Record<CampaignType, number>
  },
  marketingGoals: {
    total: number,
    completed: number,
    inProgress: number,
    completionRate: number
  }
}
```

---

### 4. **Vendor Management Dashboard** (LOW PRIORITY)
**Purpose**: Track vendor relationships and spending patterns

#### Charts & Metrics:
- **Vendor Overview**
  - Total active vendors
  - Vendor status distribution
  - Top vendors by spend
  
- **Vendor Spending**
  - Total spend by vendor
  - Spend by category
  - Payment terms compliance
  
- **Vendor Performance**
  - On-time delivery rate
  - Quality ratings
  - Contract renewal dates

**Collections Used**: `vendors`, `expenses` (linked by vendorId)

**Key Metrics**:
```typescript
{
  vendors: {
    total: number,
    active: number,
    inactive: number,
    totalSpend: number,
    topVendors: Array<{ name: string, spend: number }>,
    byCategory: Record<string, number>
  }
}
```

---

### 5. **Strategic Planning Dashboard** (LOW PRIORITY)
**Purpose**: Track business objectives and strategic initiatives

#### Charts & Metrics:
- **Business Objectives**
  - Objectives by status
  - Completion timeline
  - Priority distribution
  
- **SWOT Analysis**
  - Current strengths, weaknesses, opportunities, threats
  - Action items by category
  
- **Continuous Improvement**
  - Improvement initiatives
  - Implementation status
  - Impact metrics

**Collections Used**: `business_objectives`, `swot_analysis`, `continuous_improvement`, `brand_positioning`

---

## Enhanced Existing Sections

### Budget & Financial Overview (ENHANCE CURRENT)
**Add**:
- Budget period tracking (from `budget_periods`)
- Budget vs. actual by period
- Variance analysis
- Burn rate by department and phase
- Cash flow projection

**New Collections**: `budgets`, `budget_periods`

---

## Implementation Priority

### Phase 1: Revenue Focus (Immediate - Week 1-2)
1. ✅ Sponsor revenue tracking
2. ✅ Franchise sales pipeline
3. ✅ Revenue forecasting charts
4. ✅ Territory coverage visualization

**Why**: Revenue is the lifeblood of the business. Understanding sponsor commitments and franchise sales pipeline is critical for cash flow management and growth planning.

### Phase 2: Operations & Marketing (Week 3-4)
1. ✅ Player roster management
2. ✅ Campaign performance tracking
3. ✅ Enhanced budget period tracking
4. ✅ Vendor spending analysis

**Why**: Operational efficiency and marketing effectiveness directly impact profitability and growth.

### Phase 3: Strategic Planning (Week 5-6)
1. ✅ Business objectives tracking
2. ✅ SWOT analysis dashboard
3. ✅ Continuous improvement metrics
4. ✅ Brand positioning tracking

**Why**: Strategic planning tools provide long-term direction but are less urgent than revenue and operations.

---

## Technical Implementation Notes

### Data Fetching Strategy
```typescript
// Add to +page.server.ts
const [sponsors, franchiseDeals, franchiseOpportunities, pros, campaigns] = await Promise.allSettled([
  pb.collection('sponsors').getFullList(),
  pb.collection('franchise_deals').getFullList(),
  pb.collection('franchise_opportunities').getFullList(),
  pb.collection('pros').getFullList(),
  pb.collection('campaigns').getFullList()
]);
```

### Chart Component Structure
```
src/lib/components/charts/
├── revenue/
│   ├── SponsorRevenueChart.svelte
│   ├── FranchisePipelineChart.svelte
│   ├── RevenueForecastChart.svelte
│   └── TerritoryMapChart.svelte
├── players/
│   ├── PlayerRosterChart.svelte
│   └── PlayerRankingsChart.svelte
├── marketing/
│   ├── CampaignPerformanceChart.svelte
│   └── MarketingGoalsChart.svelte
└── vendors/
    └── VendorSpendingChart.svelte
```

### Dashboard Layout Recommendation
```
1. Key Metrics Row (Revenue, Deals, Players, Campaigns)
2. Revenue Dashboard Section
3. Phase Filter (existing)
4. Financial Overview (existing + enhanced)
5. Department Budget Allocation (existing)
6. Project & Expense Analytics (existing)
7. Expenses & Approvals (existing)
8. Player Management Section (new)
9. Marketing Performance Section (new)
10. Recent Projects (existing)
11. Quick Actions (existing)
```

---

## Sample Queries for New Metrics

### Sponsor Revenue Calculation
```typescript
const sponsors = await pb.collection('sponsors').getFullList();
const sponsorMetrics = {
  totalCommitted: sponsors.reduce((sum, s) => sum + (s.annualCommitment || 0), 0),
  totalPaid: sponsors.reduce((sum, s) => sum + (s.totalPaid || 0), 0),
  byTier: {
    tier_1: sponsors.filter(s => s.tier === 'tier_1').length,
    tier_2: sponsors.filter(s => s.tier === 'tier_2').length,
    tier_3: sponsors.filter(s => s.tier === 'tier_3').length,
    tier_4: sponsors.filter(s => s.tier === 'tier_4').length
  },
  byStatus: {
    prospect: sponsors.filter(s => s.status === 'prospect').length,
    negotiating: sponsors.filter(s => s.status === 'negotiating').length,
    active: sponsors.filter(s => s.status === 'active').length,
    renewed: sponsors.filter(s => s.status === 'renewed').length
  }
};
```

### Franchise Pipeline Calculation
```typescript
const leads = await pb.collection('franchise_leads').getFullList();
const opportunities = await pb.collection('franchise_opportunities').getFullList();
const deals = await pb.collection('franchise_deals').getFullList();

const franchiseMetrics = {
  pipeline: {
    leads: leads.length,
    opportunities: opportunities.length,
    deals: deals.length
  },
  totalValue: deals.reduce((sum, d) => sum + (d.dealValue || 0), 0),
  totalReceived: deals.reduce((sum, d) => sum + (d.paymentReceived || 0), 0),
  conversionRate: {
    leadToOpportunity: opportunities.length / leads.length,
    opportunityToDeal: deals.length / opportunities.length,
    leadToDeal: deals.length / leads.length
  }
};
```

---

## Conclusion

The current dashboard provides solid project and expense tracking, but misses critical revenue, sales, and operational data. By implementing the proposed enhancements in phases, the dashboard will evolve into a comprehensive business intelligence tool that provides real-time insights into:

1. **Revenue health** - Sponsor commitments and franchise sales
2. **Operational efficiency** - Player management and vendor relationships
3. **Marketing effectiveness** - Campaign performance and lead generation
4. **Strategic alignment** - Business objectives and continuous improvement

This will enable data-driven decision-making across all aspects of running the disc golf league.
