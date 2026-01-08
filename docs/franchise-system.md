# FLI Golf Franchise System

## Overview

The FLI Golf franchise system is designed to transition from an expense-focused business to an income-generating model through franchise sales. With a 3-year sales timeline, each franchise represents a regional disc golf team with professional players, branding, and revenue potential.

## Business Model

### Timeline
- **Current**: Expense tracking and team management
- **Year 1-2**: Franchise development and marketing
- **Year 3+**: Active franchise sales and revenue generation

### Revenue Streams
1. **Franchise Fees**: Initial purchase price ($250K-$300K)
2. **Royalties**: 6% of franchise revenue
3. **Marketing Fees**: 2% for national marketing fund
4. **Merchandise**: Team-branded products
5. **Sponsorships**: Local and regional partnerships

## Franchise Collection Schema

### Basic Information
- **name** (text, required): Franchise name (e.g., "Hyzer Heroes")
- **slug** (text, required): URL-friendly identifier (e.g., "hyzer-heroes")
- **tagline** (text): Marketing tagline
- **description** (editor): Full franchise description

### Branding
- **logo** (file): Team logo (5MB max, images/SVG)
- **primaryColor** (text): Hex color code (e.g., "#1E40AF")
- **secondaryColor** (text): Hex color code for accents

### Team Roster
- **malePro** (relation): Link to male pro player
- **femalePro** (relation): Link to female pro player
- **additionalPros** (relation): Up to 10 additional team members

### Sales & Financial
- **status** (select): 
  - `available` - Ready for sale
  - `reserved` - Interested buyer
  - `in_negotiation` - Active discussions
  - `sold` - Purchase complete
  - `active` - Operating franchise
  - `suspended` - Temporarily inactive
  - `terminated` - Contract ended
- **franchiseFee** (number): Initial purchase price
- **royaltyPercentage** (number): Ongoing royalty rate (typically 6%)
- **marketingFeePercentage** (number): Marketing fund contribution (typically 2%)
- **estimatedRevenue** (number): Projected annual revenue
- **targetSaleDate** (date): When you aim to sell this franchise

### Territory & Market
- **territory** (text): Geographic region (e.g., "Northeast United States")
- **primaryMarket** (text): Main city/metro area
- **targetDemographic** (text): Ideal customer profile

### Franchisee Information
- **franchiseeId** (relation): Link to user account
- **franchiseeName** (text): Owner's name
- **franchiseeEmail** (email): Contact email
- **franchiseePhone** (text): Contact phone
- **franchiseeCompany** (text): Operating company name

### Contract & Legal
- **contractStartDate** (date): When contract begins
- **contractEndDate** (date): When contract expires
- **contractTerm** (number): Length in years (typically 10)
- **contractDocuments** (file): Legal agreements (10MB max, PDF/Word)

### Performance & Metrics
- **performanceScore** (number): Overall rating (0-100)
- **fanEngagement** (number): Engagement metrics
- **socialMediaFollowers** (number): Total social following
- **merchandiseSales** (number): Product revenue

### Marketing & Content
- **website** (url): Franchise website
- **socialMediaLinks** (json): Social media profiles
- **marketingMaterials** (file): Promotional assets (20 files max)

### Operations
- **launchDate** (date): When franchise goes live
- **homeVenue** (text): Primary playing location
- **trainingFacility** (text): Practice facility

### Internal
- **internalNotes** (editor): Private team notes
- **salesNotes** (editor): Sales process tracking
- **priority** (number): Sales priority ranking (1-100)

## Current Franchises

### 1. Hyzer Heroes
- **Territory**: Northeast United States
- **Tagline**: Masters of the Fade
- **Colors**: Blue (#1E40AF) / Gold (#FBBF24)
- **Team**: Niklas Anttila (M), Holyn Handley (F)
- **Fee**: $250,000

### 2. Huk-a-Mania
- **Territory**: Southeast United States
- **Tagline**: Unleash the Power
- **Colors**: Red (#DC2626) / Black (#000000)
- **Team**: Calvin Heimburg (M), Kona Star Montgomery (F)
- **Fee**: $250,000

### 3. Flight Squad
- **Territory**: Midwest United States
- **Tagline**: Precision in Motion
- **Colors**: Purple (#7C3AED) / Amber (#F59E0B)
- **Team**: Isaac Robinson (M), Hailey King (F)
- **Fee**: $250,000

### 4. Birdie Storm
- **Territory**: Pacific Northwest
- **Tagline**: Raining Birdies
- **Colors**: Green (#059669) / White (#FFFFFF)
- **Team**: Matthew Orum (M), Kat Mertsch (F)
- **Fee**: $250,000

### 5. Chain Breakers
- **Territory**: Southwest United States
- **Tagline**: Breaking Through
- **Colors**: Orange (#EA580C) / Dark Gray (#1F2937)
- **Team**: Chris Dickerson (M), Missy Gannon (F)
- **Fee**: $250,000

### 6. Disc Jesters
- **Territory**: Rocky Mountain Region
- **Tagline**: Fun Meets Competition
- **Colors**: Pink (#EC4899) / Purple (#8B5CF6)
- **Team**: Ricky Wysocki (M), Paige Pierce (F)
- **Fee**: $250,000

### 7. Midas Touch
- **Territory**: California
- **Tagline**: Everything We Touch Turns Gold
- **Colors**: Gold (#F59E0B) / Brown (#78350F)
- **Team**: Ezra Robinson (M), Heidi Laine (F)
- **Fee**: $300,000 (premium market)

### 8. Chain Seekers
- **Territory**: Great Lakes Region
- **Tagline**: Always Finding the Basket
- **Colors**: Cyan (#0891B2) / Orange (#F97316)
- **Team**: Gannon Buhr (M), Henna Blomroos (F)
- **Fee**: $250,000

### 9. Fairway Bombers
- **Territory**: Texas
- **Tagline**: Distance is Our Game
- **Colors**: Red (#DC2626) / Yellow (#FBBF24)
- **Team**: Paul Ulibarri (M), Ella Hansen (F)
- **Fee**: $275,000 (large market)

### 10. Disc Dynasty
- **Territory**: Mid-Atlantic
- **Tagline**: Building a Legacy
- **Colors**: Purple (#7C3AED) / Gold (#FBBF24)
- **Team**: Brad Hammock (M), Natalie Ryan (F)
- **Fee**: $250,000

### 11. Ace Makers
- **Territory**: Florida
- **Tagline**: Perfection Every Throw
- **Colors**: Emerald (#10B981) / White (#FFFFFF)
- **Team**: Niklas Anttila (M), Ohn Scoggins (F)
- **Fee**: $275,000 (large market)

### 12. Glide Masters
- **Territory**: New England
- **Tagline**: Smooth and Steady
- **Colors**: Indigo (#6366F1) / Pink (#F472B6)
- **Team**: Calvin Heimburg (M), Evelina Salonen (F)
- **Fee**: $250,000

## Scripts

### Create Collection

```bash
npx tsx src/lib/migrations/create-franchises-collection.ts
```

Creates the franchises collection with all fields configured.

### Seed Franchises

```bash
npx tsx src/lib/migrations/seed-franchises.ts
```

Creates all 12 franchises with:
- Basic information and branding
- Pro assignments (1 male + 1 female each)
- Financial projections
- Territory assignments

## Usage in Your App

### List All Franchises

```typescript
import { pb } from '$lib/infra/pocketbase/pbClient';

const franchises = await pb.collection('franchises').getFullList({
  expand: 'malePro,femalePro',
  sort: 'priority'
});
```

### Get Franchise with Team

```typescript
const franchise = await pb.collection('franchises').getOne(franchiseId, {
  expand: 'malePro,femalePro,additionalPros'
});

console.log(franchise.name);
console.log('Male Pro:', franchise.expand?.malePro?.name);
console.log('Female Pro:', franchise.expand?.femalePro?.name);
```

### Filter by Status

```typescript
// Get available franchises
const available = await pb.collection('franchises').getFullList({
  filter: 'status = "available"',
  sort: 'targetSaleDate'
});

// Get sold franchises
const sold = await pb.collection('franchises').getFullList({
  filter: 'status = "sold" || status = "active"'
});
```

### Update Franchise Status

```typescript
// Mark as sold
await pb.collection('franchises').update(franchiseId, {
  status: 'sold',
  franchiseeName: 'John Smith',
  franchiseeEmail: 'john@example.com',
  contractStartDate: '2027-06-01',
  contractEndDate: '2037-05-31',
  contractTerm: 10
});
```

### Calculate Revenue Projections

```typescript
const franchises = await pb.collection('franchises').getFullList();

const totalFranchiseFees = franchises.reduce((sum, f) => 
  sum + (f.franchiseFee || 0), 0
);

const annualRoyalties = franchises
  .filter(f => f.status === 'active')
  .reduce((sum, f) => 
    sum + (f.estimatedRevenue * (f.royaltyPercentage / 100)), 0
  );

console.log('Total Franchise Fees:', totalFranchiseFees);
console.log('Projected Annual Royalties:', annualRoyalties);
```

## Svelte Components

### Franchise Card

```svelte
<script lang="ts">
  import { pb } from '$lib/infra/pocketbase/pbClient';
  
  export let franchise: any;
  
  $: logoUrl = franchise.logo 
    ? pb.files.getUrl(franchise, franchise.logo, { thumb: '300x300' })
    : null;
    
  function getStatusBadge(status: string) {
    const badges = {
      available: 'bg-green-100 text-green-800',
      reserved: 'bg-yellow-100 text-yellow-800',
      in_negotiation: 'bg-blue-100 text-blue-800',
      sold: 'bg-purple-100 text-purple-800',
      active: 'bg-emerald-100 text-emerald-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  }
</script>

<div class="franchise-card border rounded-lg p-6">
  <div class="flex items-start gap-4">
    {#if logoUrl}
      <img src={logoUrl} alt={franchise.name} class="w-16 h-16 rounded" />
    {:else}
      <div 
        class="w-16 h-16 rounded flex items-center justify-center text-white font-bold"
        style="background-color: {franchise.primaryColor}"
      >
        {franchise.name.substring(0, 2)}
      </div>
    {/if}
    
    <div class="flex-1">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-bold">{franchise.name}</h3>
        <span class="px-2 py-1 rounded text-sm {getStatusBadge(franchise.status)}">
          {franchise.status}
        </span>
      </div>
      
      <p class="text-gray-600 italic">{franchise.tagline}</p>
      <p class="text-sm text-gray-500 mt-1">{franchise.territory}</p>
      
      <div class="mt-4 flex gap-4">
        <div>
          <span class="text-sm text-gray-500">Male Pro:</span>
          <p class="font-medium">{franchise.expand?.malePro?.name || 'TBD'}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">Female Pro:</span>
          <p class="font-medium">{franchise.expand?.femalePro?.name || 'TBD'}</p>
        </div>
      </div>
      
      <div class="mt-4">
        <span class="text-2xl font-bold" style="color: {franchise.primaryColor}">
          ${franchise.franchiseFee?.toLocaleString()}
        </span>
        <span class="text-sm text-gray-500 ml-2">Franchise Fee</span>
      </div>
    </div>
  </div>
</div>
```

### Franchise Dashboard

```svelte
<script lang="ts">
  import { pb } from '$lib/infra/pocketbase/pbClient';
  import { onMount } from 'svelte';
  
  let franchises = [];
  let stats = {
    available: 0,
    sold: 0,
    totalValue: 0,
    projectedRevenue: 0
  };
  
  onMount(async () => {
    franchises = await pb.collection('franchises').getFullList({
      expand: 'malePro,femalePro',
      sort: 'priority'
    });
    
    stats.available = franchises.filter(f => f.status === 'available').length;
    stats.sold = franchises.filter(f => f.status === 'sold' || f.status === 'active').length;
    stats.totalValue = franchises.reduce((sum, f) => sum + (f.franchiseFee || 0), 0);
    stats.projectedRevenue = franchises.reduce((sum, f) => 
      sum + (f.estimatedRevenue || 0), 0
    );
  });
</script>

<div class="dashboard">
  <h1>Franchise Dashboard</h1>
  
  <div class="stats-grid grid grid-cols-4 gap-4 mb-8">
    <div class="stat-card">
      <h3>Available</h3>
      <p class="text-3xl font-bold">{stats.available}</p>
    </div>
    <div class="stat-card">
      <h3>Sold</h3>
      <p class="text-3xl font-bold">{stats.sold}</p>
    </div>
    <div class="stat-card">
      <h3>Total Value</h3>
      <p class="text-3xl font-bold">${(stats.totalValue / 1000000).toFixed(1)}M</p>
    </div>
    <div class="stat-card">
      <h3>Projected Revenue</h3>
      <p class="text-3xl font-bold">${(stats.projectedRevenue / 1000).toFixed(0)}K</p>
    </div>
  </div>
  
  <div class="franchises-grid grid grid-cols-2 gap-6">
    {#each franchises as franchise}
      <FranchiseCard {franchise} />
    {/each}
  </div>
</div>
```

## Financial Projections

### Initial Franchise Sales (Years 1-3)
- 12 franchises × $250K-$300K average = **$3.15M total**
- Staggered sales over 3 years
- Reinvestment in operations and marketing

### Ongoing Revenue (Year 4+)
- **Royalties**: 6% of franchise revenue
  - If each franchise generates $500K/year
  - 12 franchises × $500K × 6% = **$360K/year**
- **Marketing Fees**: 2% contribution
  - 12 franchises × $500K × 2% = **$120K/year**
- **Total Recurring**: **$480K/year**

### Growth Potential
- Expand to 20-30 franchises nationally
- International expansion opportunities
- Merchandise and licensing revenue
- Event hosting and sponsorships

## Sales Strategy

### Phase 1: Development (Current - Year 1)
- Build franchise infrastructure
- Develop marketing materials
- Create franchise disclosure documents
- Establish operational playbooks

### Phase 2: Pre-Sales (Year 1-2)
- Identify potential franchisees
- Host discovery days
- Build franchise website
- Generate leads through marketing

### Phase 3: Active Sales (Year 2-3)
- Close first franchise sales
- Provide training and support
- Refine franchise model
- Build success stories

### Phase 4: Expansion (Year 3+)
- Scale to additional territories
- Develop franchise support team
- Create franchisee network
- Explore international markets

## Best Practices

### Franchise Selection
- Vet potential franchisees carefully
- Look for disc golf passion + business acumen
- Verify financial capability
- Check references and background

### Territory Management
- Protect exclusive territories
- Define clear boundaries
- Consider population and market size
- Allow for future expansion

### Support & Training
- Provide comprehensive onboarding
- Ongoing operational support
- Marketing and branding guidelines
- Regular franchisee meetings

### Performance Monitoring
- Track key metrics monthly
- Quarterly business reviews
- Annual performance assessments
- Provide improvement resources

## Legal Considerations

⚠️ **Important**: Franchise sales are heavily regulated. Consult with:
- Franchise attorney
- CPA/financial advisor
- Franchise consultant

Required documents:
- Franchise Disclosure Document (FDD)
- Franchise Agreement
- Operations Manual
- Territory agreements

## Related Files

- `src/lib/migrations/create-franchises-collection.ts` - Collection creation
- `src/lib/migrations/seed-franchises.ts` - Initial data seeding
- `docs/avatar-management.md` - Pro avatar system
- `docs/signed-contracts-management.md` - Contract management
