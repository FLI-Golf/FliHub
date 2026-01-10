# Revenue Dashboard - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Ensure Collections Exist
The revenue dashboard requires these PocketBase collections:
- `sponsors`
- `franchise_deals`
- `franchise_opportunities`
- `franchise_leads`
- `franchise_territories`

**Check if they exist:**
```bash
# Visit your PocketBase admin panel
# https://pocketbase-production-6ab5.up.railway.app/_/
# Look for these collections in the Collections tab
```

### Step 2: Seed Test Data
```bash
npm run test:seed:revenue
```

This creates:
- 5 sponsors ($19.5M committed, $13M paid)
- 10 territories (3 sold, 2 reserved, 5 available)
- 5 leads → 3 opportunities → 3 deals
- Total revenue: $49.5M committed, $28M collected

### Step 3: View Dashboard
1. Navigate to `/dashboard`
2. Log in as admin
3. See the new "Revenue & Sales" section

---

## 📊 What You'll See

### Revenue Overview Card (Green)
- Total Committed: $49.5M
- Total Collected: $28M
- Collection Rate: 56.6%
- Breakdown by sponsors vs franchises

### Sponsor Pipeline Card (Blue)
- Prospects: 1
- Negotiating: 1
- Active: 2
- Renewed: 1

### Franchise Pipeline (Funnel Chart)
- Leads: 5
- Opportunities: 3 (60% conversion)
- Deals: 3 (100% conversion)

### Sponsor Tier Chart (Donut)
- Tier 1: 2 sponsors
- Tier 2: 1 sponsor
- Tier 3: 1 sponsor
- Tier 4: 1 sponsor

### Deal Status
- Active: 1 ($10M received)
- Payment Pending: 1 ($5M received)
- Signed: 1 ($0 received)

### Territory Coverage
- Sold: 3 (30%)
- Reserved: 2 (20%)
- Available: 5 (50%)

---

## 🔧 Troubleshooting

### "No data available" messages?
**Solution:** Run `npm run test:seed:revenue`

### Collections don't exist?
**Solution:** Create them in PocketBase admin panel using schemas from `src/lib/domain/schemas/`

### Not seeing Revenue section?
**Solution:** Make sure you're logged in as an admin user (not leader or vendor)

### Server errors in console?
**Solution:** Check that `.env` has correct PocketBase credentials

---

## 📝 Next Actions

### Add Real Data
Replace seed data with actual sponsors and franchise deals:
1. Go to PocketBase admin panel
2. Navigate to each collection
3. Add/edit records manually or import CSV

### Customize Charts
Edit components in `src/lib/components/charts/revenue/`:
- `RevenueOverviewCard.svelte` - Revenue summary
- `SponsorTierChart.svelte` - Tier distribution
- `FranchisePipelineChart.svelte` - Sales funnel
- `TerritoryStatusCard.svelte` - Territory coverage

### Add More Features
See `docs/DASHBOARD_IMPLEMENTATION_PLAN.md` for:
- Phase 2: Player Management Dashboard
- Phase 3: Marketing Dashboard
- Phase 4: Vendor Dashboard

---

## 📚 Documentation

- **Full Implementation Details:** `docs/REVENUE_DASHBOARD_IMPLEMENTATION.md`
- **Overall Analysis:** `docs/DASHBOARD_ANALYSIS.md`
- **Complete Roadmap:** `docs/DASHBOARD_IMPLEMENTATION_PLAN.md`

---

## 🎯 Key Metrics at a Glance

| Metric | Value |
|--------|-------|
| Total Revenue Committed | $49.5M |
| Total Revenue Collected | $28M |
| Collection Rate | 56.6% |
| Active Sponsors | 2 |
| Franchise Deals | 3 |
| Territories Sold | 3/10 |
| Pipeline Conversion | 60% (leads→opps) |

---

**Need Help?** Check the full documentation or review the implementation files.
