# Dashboard Implementation Plan

## Overview
This document provides a step-by-step implementation plan for enhancing the FliHub dashboard with revenue, player, marketing, and vendor tracking capabilities.

---

## Phase 1: Revenue Dashboard (Priority: CRITICAL)

### Step 1.1: Add Sponsor Metrics to Server Load
**File**: `src/routes/dashboard/+page.server.ts`

```typescript
// Add to existing load function
const sponsors = await pb.collection('sponsors').getFullList();

const sponsorMetrics = {
  total: sponsors.length,
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
    renewed: sponsors.filter(s => s.status === 'renewed').length,
    expired: sponsors.filter(s => s.status === 'expired').length,
    converted_to_franchise: sponsors.filter(s => s.status === 'converted_to_franchise').length
  },
  totalCommitted: sponsors.reduce((sum, s) => sum + (s.annualCommitment || 0), 0),
  totalPaid: sponsors.reduce((sum, s) => sum + (s.totalPaid || 0), 0),
  byType: {
    casino: sponsors.filter(s => s.type === 'casino').length,
    resort: sponsors.filter(s => s.type === 'resort').length,
    hospitality: sponsors.filter(s => s.type === 'hospitality').length,
    entertainment: sponsors.filter(s => s.type === 'entertainment').length,
    corporate: sponsors.filter(s => s.type === 'corporate').length,
    other: sponsors.filter(s => s.type === 'other').length
  }
};
```

### Step 1.2: Add Franchise Metrics to Server Load
```typescript
const franchiseLeads = await pb.collection('franchise_leads').getFullList();
const franchiseOpportunities = await pb.collection('franchise_opportunities').getFullList();
const franchiseDeals = await pb.collection('franchise_deals').getFullList();
const franchiseTerritories = await pb.collection('franchise_territories').getFullList();

const franchiseMetrics = {
  pipeline: {
    leads: franchiseLeads.length,
    opportunities: franchiseOpportunities.length,
    deals: franchiseDeals.length
  },
  deals: {
    total: franchiseDeals.length,
    byStatus: {
      pending_signature: franchiseDeals.filter(d => d.status === 'pending_signature').length,
      signed: franchiseDeals.filter(d => d.status === 'signed').length,
      payment_pending: franchiseDeals.filter(d => d.status === 'payment_pending').length,
      payment_received: franchiseDeals.filter(d => d.status === 'payment_received').length,
      onboarding: franchiseDeals.filter(d => d.status === 'onboarding').length,
      active: franchiseDeals.filter(d => d.status === 'active').length,
      cancelled: franchiseDeals.filter(d => d.status === 'cancelled').length
    },
    totalValue: franchiseDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0),
    totalReceived: franchiseDeals.reduce((sum, d) => sum + (d.paymentReceived || 0), 0),
    averageDealValue: franchiseDeals.length > 0 
      ? franchiseDeals.reduce((sum, d) => sum + (d.dealValue || 0), 0) / franchiseDeals.length 
      : 0
  },
  territories: {
    total: franchiseTerritories.length,
    available: franchiseTerritories.filter(t => t.status === 'available').length,
    reserved: franchiseTerritories.filter(t => t.status === 'reserved').length,
    sold: franchiseTerritories.filter(t => t.status === 'sold').length
  },
  conversionRates: {
    leadToOpportunity: franchiseOpportunities.length / (franchiseLeads.length || 1),
    opportunityToDeal: franchiseDeals.length / (franchiseOpportunities.length || 1),
    leadToDeal: franchiseDeals.length / (franchiseLeads.length || 1)
  }
};
```

### Step 1.3: Create Revenue Chart Components

**File**: `src/lib/components/charts/revenue/SponsorTierChart.svelte`
```svelte
<script lang="ts">
  import { Pie } from 'svelte-chartjs';
  
  interface Props {
    tier_1: number;
    tier_2: number;
    tier_3: number;
    tier_4: number;
  }
  
  let { tier_1, tier_2, tier_3, tier_4 }: Props = $props();
  
  const data = {
    labels: ['Tier 1 - Premium', 'Tier 2 - Elite', 'Tier 3 - Standard', 'Tier 4 - Growth'],
    datasets: [{
      data: [tier_1, tier_2, tier_3, tier_4],
      backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
    }]
  };
</script>

<div class="chart-container">
  <Pie {data} />
</div>
```

**File**: `src/lib/components/charts/revenue/FranchisePipelineChart.svelte`
```svelte
<script lang="ts">
  import * as d3 from 'd3';
  import { onMount } from 'svelte';
  
  interface Props {
    leads: number;
    opportunities: number;
    deals: number;
  }
  
  let { leads, opportunities, deals }: Props = $props();
  let chartContainer: HTMLDivElement;
  
  function createFunnelChart() {
    // D3 funnel chart implementation
    // Shows conversion from leads → opportunities → deals
  }
  
  onMount(() => {
    createFunnelChart();
  });
</script>

<div bind:this={chartContainer} class="funnel-chart"></div>
```

**File**: `src/lib/components/charts/revenue/RevenueOverviewCard.svelte`
```svelte
<script lang="ts">
  import Card from '$lib/components/ui/card.svelte';
  import { DollarSign, TrendingUp } from 'lucide-svelte';
  
  interface Props {
    totalCommitted: number;
    totalReceived: number;
    dealValue: number;
    dealReceived: number;
  }
  
  let { totalCommitted, totalReceived, dealValue, dealReceived }: Props = $props();
  
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  const totalRevenue = totalCommitted + dealValue;
  const totalCollected = totalReceived + dealReceived;
  const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;
</script>

<Card class="p-6 bg-gradient-to-br from-green-950 to-emerald-900 border-green-800">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-semibold">Revenue Overview</h3>
    <DollarSign class="size-5 text-green-400" />
  </div>
  
  <div class="space-y-4">
    <div>
      <p class="text-sm text-green-200">Total Committed</p>
      <p class="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
    </div>
    
    <div>
      <p class="text-sm text-green-200">Total Collected</p>
      <p class="text-2xl font-bold">{formatCurrency(totalCollected)}</p>
    </div>
    
    <div class="pt-4 border-t border-green-800">
      <div class="flex items-center justify-between">
        <span class="text-sm text-green-200">Collection Rate</span>
        <div class="flex items-center gap-2">
          <TrendingUp class="size-4 text-green-400" />
          <span class="text-lg font-bold">{collectionRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  </div>
</Card>
```

### Step 1.4: Add Revenue Section to Dashboard
**File**: `src/routes/dashboard/+page.svelte`

Add after "Key Metrics" section:
```svelte
<!-- Revenue Dashboard -->
{#if isAdmin}
  <div>
    <h2 class="text-2xl font-bold mb-4">Revenue & Sales</h2>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
      <!-- Revenue Overview Card -->
      <RevenueOverviewCard 
        totalCommitted={metrics.sponsors.totalCommitted}
        totalReceived={metrics.sponsors.totalPaid}
        dealValue={metrics.franchises.deals.totalValue}
        dealReceived={metrics.franchises.deals.totalReceived}
      />
      
      <!-- Sponsor Status Card -->
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Sponsor Pipeline</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm">Prospects</span>
            <span class="font-bold">{metrics.sponsors.byStatus.prospect}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm">Negotiating</span>
            <span class="font-bold">{metrics.sponsors.byStatus.negotiating}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm">Active</span>
            <span class="font-bold text-green-600">{metrics.sponsors.byStatus.active}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm">Renewed</span>
            <span class="font-bold text-blue-600">{metrics.sponsors.byStatus.renewed}</span>
          </div>
        </div>
      </Card>
      
      <!-- Franchise Pipeline Card -->
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Franchise Pipeline</h3>
        <FranchisePipelineChart 
          leads={metrics.franchises.pipeline.leads}
          opportunities={metrics.franchises.pipeline.opportunities}
          deals={metrics.franchises.pipeline.deals}
        />
      </Card>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Sponsor Tier Distribution -->
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Sponsors by Tier</h3>
        <SponsorTierChart {...metrics.sponsors.byTier} />
      </Card>
      
      <!-- Territory Coverage -->
      <Card class="p-6">
        <h3 class="text-lg font-semibold mb-4">Territory Coverage</h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span>Available</span>
            <span class="text-2xl font-bold text-green-600">{metrics.franchises.territories.available}</span>
          </div>
          <div class="flex justify-between items-center">
            <span>Reserved</span>
            <span class="text-2xl font-bold text-yellow-600">{metrics.franchises.territories.reserved}</span>
          </div>
          <div class="flex justify-between items-center">
            <span>Sold</span>
            <span class="text-2xl font-bold text-blue-600">{metrics.franchises.territories.sold}</span>
          </div>
        </div>
      </Card>
    </div>
  </div>
{/if}
```

---

## Phase 2: Player Management Dashboard

### Step 2.1: Add Pro Metrics to Server Load
```typescript
const pros = await pb.collection('pros').getFullList();

const proMetrics = {
  total: pros.length,
  active: pros.filter(p => p.status === 'active').length,
  inactive: pros.filter(p => p.status === 'inactive').length,
  retired: pros.filter(p => p.status === 'retired').length,
  byGender: {
    male: pros.filter(p => p.gender === 'male').length,
    female: pros.filter(p => p.gender === 'female').length,
    other: pros.filter(p => p.gender === 'other').length
  },
  withContracts: pros.filter(p => p.signedContract).length,
  topRanked: pros.filter(p => p.worldRanking && p.worldRanking <= 100).length,
  byCountry: pros.reduce((acc, p) => {
    if (p.country) {
      acc[p.country] = (acc[p.country] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>)
};
```

### Step 2.2: Create Player Chart Components
**File**: `src/lib/components/charts/players/PlayerRosterChart.svelte`
**File**: `src/lib/components/charts/players/PlayerStatusChart.svelte`

### Step 2.3: Add Player Section to Dashboard
```svelte
<!-- Player Management -->
<div>
  <h2 class="text-2xl font-bold mb-4">Player Roster</h2>
  
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
    <MetricCard 
      title="Total Players"
      value={metrics.pros.total}
      icon={Users}
    />
    <MetricCard 
      title="Active Players"
      value={metrics.pros.active}
      icon={CheckCircle2}
      trend="positive"
    />
    <MetricCard 
      title="Top 100 Ranked"
      value={metrics.pros.topRanked}
      icon={TrendingUp}
    />
    <MetricCard 
      title="With Contracts"
      value={metrics.pros.withContracts}
      icon={FileText}
    />
  </div>
</div>
```

---

## Phase 3: Marketing Dashboard

### Step 3.1: Add Campaign Metrics
```typescript
const campaigns = await pb.collection('campaigns').getFullList();
const marketingGoals = await pb.collection('marketing_goals').getFullList();

const marketingMetrics = {
  campaigns: {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'Active').length,
    byStatus: {
      planning: campaigns.filter(c => c.status === 'Planning').length,
      active: campaigns.filter(c => c.status === 'Active').length,
      paused: campaigns.filter(c => c.status === 'Paused').length,
      completed: campaigns.filter(c => c.status === 'Completed').length,
      cancelled: campaigns.filter(c => c.status === 'Cancelled').length
    },
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
    totalSpend: campaigns.reduce((sum, c) => sum + (c.actualSpend || 0), 0),
    byType: campaigns.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  },
  goals: {
    total: marketingGoals.length,
    // Add goal-specific metrics based on schema
  }
};
```

---

## Phase 4: Vendor Dashboard

### Step 4.1: Add Vendor Metrics
```typescript
const vendors = await pb.collection('vendors').getFullList();

// Link expenses to vendors
const vendorSpending = vendors.map(vendor => {
  const vendorExpenses = allExpenses.filter(e => e.vendorId === vendor.id);
  return {
    id: vendor.id,
    name: vendor.name,
    totalSpend: vendorExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    expenseCount: vendorExpenses.length,
    status: vendor.status
  };
}).sort((a, b) => b.totalSpend - a.totalSpend);

const vendorMetrics = {
  total: vendors.length,
  active: vendors.filter(v => v.status === 'active').length,
  inactive: vendors.filter(v => v.status === 'inactive').length,
  totalSpend: vendorSpending.reduce((sum, v) => sum + v.totalSpend, 0),
  topVendors: vendorSpending.slice(0, 10)
};
```

---

## Testing Strategy

### Unit Tests
- Test metric calculations
- Test chart data transformations
- Test currency formatting

### Integration Tests
- Test data fetching from PocketBase
- Test error handling for missing collections
- Test dashboard rendering with mock data

### Visual Tests
- Verify chart responsiveness
- Test dark mode compatibility
- Verify accessibility (ARIA labels, keyboard navigation)

---

## Rollout Plan

### Week 1: Revenue Dashboard
- Day 1-2: Server-side data fetching
- Day 3-4: Chart components
- Day 5: Integration and testing

### Week 2: Revenue Dashboard Polish
- Day 1-2: UI refinements
- Day 3: Performance optimization
- Day 4-5: Documentation and handoff

### Week 3: Player & Marketing Dashboards
- Similar pattern to Week 1-2

### Week 4: Vendor & Strategic Dashboards
- Similar pattern to Week 1-2

---

## Performance Considerations

### Data Fetching Optimization
```typescript
// Use Promise.allSettled to prevent one failure from blocking others
const results = await Promise.allSettled([
  pb.collection('sponsors').getFullList(),
  pb.collection('franchise_deals').getFullList(),
  pb.collection('pros').getFullList(),
  pb.collection('campaigns').getFullList()
]);

// Handle each result independently
const sponsors = results[0].status === 'fulfilled' ? results[0].value : [];
const deals = results[1].status === 'fulfilled' ? results[1].value : [];
// etc.
```

### Caching Strategy
- Consider implementing server-side caching for dashboard metrics
- Cache duration: 5-15 minutes depending on data volatility
- Invalidate cache on data mutations

### Lazy Loading
- Load charts only when visible (Intersection Observer)
- Defer non-critical sections below the fold

---

## Monitoring & Analytics

### Track Dashboard Usage
- Page load time
- Time to interactive
- Chart render time
- User interactions (filters, tabs)

### Track Data Quality
- Missing data warnings
- Data freshness indicators
- Collection sync status

---

## Next Steps

1. ✅ Review this implementation plan
2. ⬜ Prioritize which sections to implement first
3. ⬜ Set up development branch
4. ⬜ Begin Phase 1 implementation
5. ⬜ Schedule regular check-ins for progress review

---

## Questions to Address

1. **Data Access**: Do all collections have proper read permissions for dashboard users?
2. **Seed Data**: Do we have sufficient test data in sponsors, franchise_deals, pros, and campaigns collections?
3. **Chart Library**: Should we use D3.js exclusively or mix with Chart.js for simpler charts?
4. **Real-time Updates**: Do we need real-time dashboard updates or is periodic refresh sufficient?
5. **Export Functionality**: Should users be able to export dashboard data to CSV/PDF?
