# Sponsor System - Quick Start Guide

## Setup (Already Complete)

✅ Collections created with all fields
✅ Sample casino sponsors added
✅ Dashboard page created
✅ Navigation updated
✅ Schemas defined

## Access the System

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Login
**Admin:** `admin@flihub.com` / `admin123`
**Sales:** `sales@flihub.com` / `sales123`

### 3. Navigate
Click **"Sponsors"** in the sidebar (Star icon)

## Tier Pricing (Quick Reference)

| Tier | 2025 | 2026 | 2027 | Total |
|------|------|------|------|-------|
| **1** | $7M | $5M | $3M | **$15M** |
| **2** | $5M | $7M | $9M | **$21M** |
| **3** | $1M | $1M | $2M | **$4M** |
| **4** | $1M | $1.5M | $2M | **$4.5M** |

## Franchise Conversion

### Discount Formula
- 10% per $1M sponsorship
- Max 30% discount
- Applied to $10M franchise fee

### Examples
- $1M sponsor → $9M franchise fee
- $3M sponsor → $7M franchise fee
- $7M+ sponsor → $7M franchise fee (max)

## Sample Sponsors

1. **MGM Grand** - Tier 1, Active, 🎯 Franchise Interest
2. **Caesars Palace** - Tier 2, Active
3. **Wynn Resorts** - Tier 1, Negotiating, 🎯 Franchise Interest
4. **Atlantis** - Tier 3, Active
5. **Mohegan Sun** - Tier 4, Prospect

## Key Features

### Dashboard Shows
- Active sponsor count
- Total revenue
- Franchise interest tracking
- Conversion pipeline
- Tier pricing table

### Collections
- `sponsors` - 22 fields
- `sponsor_franchise_bridge` - 18 fields
- `franchise_leads` - +3 sponsor fields

## Common Workflows

### Add New Sponsor
1. Go to Sponsors dashboard
2. Click "New Sponsor"
3. Fill in company details
4. Select tier and type
5. Set status and contact info

### Track Franchise Interest
1. Edit sponsor
2. Set `franchiseInterest` = true
3. System creates bridge record
4. Track in conversion pipeline

### Convert to Franchise
1. Bridge status → evaluation
2. Create franchise lead (linked)
3. Create opportunity (discounted)
4. Close deal at net fee
5. Update sponsor status

## Files Reference

- **Schemas:** `src/lib/domain/schemas/sponsor*.ts`
- **Dashboard:** `src/routes/dashboard/sponsors/+page.svelte`
- **Collections:** `sponsor-collections-complete.json`
- **Docs:** `SPONSOR_SYSTEM.md`, `SPONSOR_COLLECTIONS_COMPLETE.md`

## Scripts

```bash
# Update collections
npx tsx scripts/update-sponsor-collections.ts

# Add sample data
npx tsx scripts/create-sample-sponsors.ts

# Check data
npx tsx scripts/check-sponsors.ts
```

## Support

- Check PocketBase admin panel for data
- Review `SPONSOR_SYSTEM.md` for details
- See `SPONSOR_COLLECTIONS_COMPLETE.md` for schema
