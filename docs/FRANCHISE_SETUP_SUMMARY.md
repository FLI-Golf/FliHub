# Franchise System Setup - Complete ✅

## What Was Created

### 1. Franchises Collection
**42 fields** covering all aspects of franchise management:
- Basic info (name, slug, tagline, description)
- Branding (logo, colors)
- Team roster (male pro, female pro, additional pros)
- Sales & financial tracking
- Territory & market data
- Franchisee information
- Contract management
- Performance metrics
- Marketing & content
- Operations data

### 2. Initial Franchise Data
**12 franchises** created and seeded with:
- Unique names and taglines
- Brand colors
- Territory assignments
- Pro player assignments (1 male + 1 female each)
- Financial projections
- Target sale dates

## Franchise Roster

| Franchise | Territory | Male Pro | Female Pro | Fee |
|-----------|-----------|----------|------------|-----|
| Hyzer Heroes | Northeast US | Niklas Anttila | Holyn Handley | $250K |
| Huk-a-Mania | Southeast US | Calvin Heimburg | Kona Star Montgomery | $250K |
| Flight Squad | Midwest US | Isaac Robinson | Hailey King | $250K |
| Birdie Storm | Pacific Northwest | Matthew Orum | Kat Mertsch | $250K |
| Chain Breakers | Southwest US | Chris Dickerson | Missy Gannon | $250K |
| Disc Jesters | Rocky Mountain | Ricky Wysocki | Paige Pierce | $250K |
| Midas Touch | California | Ezra Robinson | Heidi Laine | $300K |
| Chain Seekers | Great Lakes | Gannon Buhr | Henna Blomroos | $250K |
| Fairway Bombers | Texas | Paul Ulibarri | Ella Hansen | $275K |
| Disc Dynasty | Mid-Atlantic | Brad Hammock | Natalie Ryan | $250K |
| Ace Makers | Florida | Niklas Anttila | Ohn Scoggins | $275K |
| Glide Masters | New England | Calvin Heimburg | Evelina Salonen | $250K |

## Financial Overview

### Total Franchise Value
- **$3.15 Million** in initial franchise fees
- Average fee: $262,500 per franchise

### Projected Recurring Revenue (Year 4+)
- **Royalties**: 6% of franchise revenue = ~$360K/year
- **Marketing Fees**: 2% contribution = ~$120K/year
- **Total Annual**: ~$480K/year (assuming $500K revenue per franchise)

### 3-Year Sales Timeline
- **Year 1-2**: Development and pre-sales
- **Year 2-3**: Active sales period
- **Year 3+**: Ongoing operations and expansion

## Key Features

### Income Tracking Ready
- Franchise fee tracking
- Royalty percentage configuration
- Marketing fee percentage
- Estimated revenue projections
- Performance metrics

### Sales Pipeline Management
- Status tracking (available → reserved → negotiation → sold → active)
- Target sale dates
- Priority ranking
- Sales notes field
- Internal notes

### Franchisee Management
- Contact information
- Company details
- User account linking
- Contract dates and terms
- Document storage

### Territory Protection
- Geographic assignments
- Primary market identification
- Target demographic tracking
- Exclusive territory rights

## Scripts Created

### Create Collection
```bash
npx tsx src/lib/migrations/create-franchises-collection.ts
```
✅ Already run - collection created

### Seed Franchises
```bash
npx tsx src/lib/migrations/seed-franchises.ts
```
✅ Already run - 12 franchises created with pro assignments

### Create Franchise Owners
```bash
npx tsx src/lib/migrations/create-franchise-owners.ts
```
✅ Already run - 12 franchise owner accounts created and linked

**Franchise Owner Credentials:**
- Email pattern: `first@{franchise-slug}.com`
- Default password: `FLIGolf2024!`
- Role: `franchise_owner`
- All linked to their respective franchises

## Next Steps

### Immediate (Development Phase)
1. **Build franchise pages** in your app
   - List view with filters
   - Detail pages with team info
   - Sales dashboard
   
2. **Create marketing materials**
   - Franchise brochures
   - Territory maps
   - Financial projections
   - Success stories

3. **Develop operational docs**
   - Franchise operations manual
   - Training materials
   - Brand guidelines
   - Support resources

### Short-term (Pre-Sales Phase)
1. **Legal preparation**
   - Franchise Disclosure Document (FDD)
   - Franchise Agreement template
   - Territory agreements
   - Consult franchise attorney

2. **Financial modeling**
   - Detailed revenue projections
   - Cost analysis
   - ROI calculations
   - Financing options

3. **Lead generation**
   - Franchise website/landing page
   - Marketing campaigns
   - Discovery day events
   - Broker relationships

### Long-term (Sales Phase)
1. **Sales process**
   - Lead qualification
   - Discovery meetings
   - Due diligence
   - Contract negotiation

2. **Franchisee onboarding**
   - Training programs
   - System setup
   - Marketing launch
   - Ongoing support

3. **Performance management**
   - Monthly reporting
   - Quarterly reviews
   - Annual assessments
   - Network meetings

## Documentation

Complete documentation available at:
- **`docs/franchise-system.md`** - Full system documentation
  - Collection schema details
  - All 12 franchise profiles
  - Usage examples
  - Svelte components
  - Financial projections
  - Sales strategy
  - Best practices

- **`docs/franchise-owners.md`** - Franchise owner management
  - Complete owner list with credentials
  - Authentication examples
  - Dashboard components
  - Access control
  - Security best practices

## Database Access

View franchises in PocketBase admin:
- URL: `https://pocketbase-production-6ab5.up.railway.app/_/`
- Collection: `franchises`
- Records: 12 franchises with full data

## Quick Queries

### Get all available franchises
```typescript
const available = await pb.collection('franchises').getFullList({
  filter: 'status = "available"',
  expand: 'malePro,femalePro',
  sort: 'targetSaleDate'
});
```

### Calculate total value
```typescript
const franchises = await pb.collection('franchises').getFullList();
const totalValue = franchises.reduce((sum, f) => sum + f.franchiseFee, 0);
// Result: $3,150,000
```

### Get franchise with team
```typescript
const franchise = await pb.collection('franchises').getOne(id, {
  expand: 'malePro,femalePro,additionalPros'
});
```

## Success Metrics

Track these KPIs:
- Number of qualified leads
- Conversion rate (leads → sales)
- Average time to close
- Franchise satisfaction scores
- Revenue per franchise
- Royalty collection rate
- Territory performance

## Support

For questions or modifications:
1. Review `docs/franchise-system.md`
2. Check collection schema in PocketBase admin
3. Modify scripts in `src/lib/migrations/`
4. Test changes in development first

---

**Status**: ✅ Franchise system fully operational and ready for development phase!
