# Franchise Sales System Setup

## Overview
Complete franchise sales system with role-based access control, dedicated dashboards, and $10M franchise fee structure.

## User Accounts

### Admin User
- **Email**: `admin@flihub.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Access**: Full access to all features including Franchise Sales

### Sales User
- **Email**: `sales@flihub.com`
- **Password**: `sales123`
- **Role**: `sales`
- **Access**: Franchise Sales dashboard, Projects, Tasks

## Features

### Admin Access
Admins now have access to **ALL** sidebar features:
- ✅ Dashboard
- ✅ **Franchise Sales** (NEW)
- ✅ League
- ✅ Franchises
- ✅ Departments
- ✅ People
- ✅ Tasks
- ✅ Vendors
- ✅ Projects
- ✅ Expenses
- ✅ Approvals

### Franchise Sales Dashboard (`/dashboard/sales`)
Available to: `admin` and `sales` roles

**Metrics:**
- Total Leads
- Qualified Leads
- Active Opportunities
- Closed Deals
- Total Revenue
- Pipeline Value
- Available Territories

**Sections:**
- Recent Leads (with contact info, status, territory)
- Active Opportunities (with stage, deal value, probability)
- Available Territories (with location, market size, pricing)

## Collections

### 1. franchise_leads
Potential franchise buyers
- Contact information (name, email, phone)
- Territory interest
- Source (website, referral, event, etc.)
- Status (new, contacted, qualified, unqualified, converted, lost)
- Financial qualifications (net worth, liquid capital)
- Experience level
- Assigned sales rep

### 2. franchise_opportunities
Qualified leads in sales pipeline
- Linked to lead
- Opportunity name
- Stage (8 stages: discovery → closed_won/lost)
- Deal value (**$10,000,000 default**)
- Probability (% chance of closing)
- Expected close date
- Territory
- Proposal and contact dates
- Assigned sales rep
- Linked project (optional)

### 3. franchise_deals
Closed franchise sales
- Linked to opportunity
- Deal number (auto-generated)
- Franchise owner name
- Territory
- Deal value (**$10,000,000**)
- Payment tracking
- Contract signed date
- Status (pending_signature → active)
- Linked franchise owner profile
- Commission tracking
- Closed by (sales rep)

### 4. franchise_territories
Geographic territories for sale
- Territory name and code
- Location (state, city, region)
- Market data (population, market size)
- Status (available, reserved, sold, unavailable)
- Price (**$10,000,000 default**)
- Linked deal (if sold)
- Reserved until date

## Franchise Fee Structure

**All franchise fees are set to $10,000,000:**
- Territory price: $10M
- Opportunity deal value: $10M
- Deal value: $10M

## Role-Based Routing

### Login Redirects
- `admin` → `/dashboard` (can access all features)
- `sales` → `/dashboard/sales`
- `leader` → `/dashboard/department/[id]`
- `vendor` → `/dashboard/vendors`

### Sidebar Navigation by Role

**Admin:**
- Sees ALL navigation items (no restrictions)

**Sales:**
- Dashboard
- Franchise Sales
- Projects
- Tasks

**Leader:**
- Dashboard
- Projects
- Tasks
- Expenses
- Approvals

**Vendor:**
- Dashboard
- Projects
- Expenses

**Pro / Franchise Owner:**
- Dashboard
- League
- Franchises
- Departments
- Projects
- Tasks
- Expenses

## Sample Data

### Territories
- Dallas-Fort Worth, TX
- Los Angeles, CA
- Miami, FL

### Leads
- John Smith (qualified) - Dallas
- Sarah Johnson (contacted) - Los Angeles
- Michael Brown (new) - Miami

### Opportunities
- Dallas-Fort Worth Franchise - John Smith (proposal stage, 75% probability)

## Scripts

### Setup Scripts
- `scripts/create-franchise-sales-collections.ts` - Create all collections
- `scripts/create-test-sales-user.ts` - Create sales user and sample data
- `scripts/create-admin-user.ts` - Create admin user
- `scripts/update-franchise-fees.ts` - Update all fees to $10M
- `scripts/check-franchise-fees.ts` - Verify current fees

### Run Scripts
```bash
# Create collections
npx tsx scripts/create-franchise-sales-collections.ts

# Create test users
npx tsx scripts/create-test-sales-user.ts
npx tsx scripts/create-admin-user.ts

# Update/verify fees
npx tsx scripts/update-franchise-fees.ts
npx tsx scripts/check-franchise-fees.ts
```

## Files Modified

### Schemas
- `src/lib/domain/schemas/franchise-lead.schema.ts` (NEW)
- `src/lib/domain/schemas/franchise-opportunity.schema.ts` (NEW)
- `src/lib/domain/schemas/franchise-deal.schema.ts` (NEW)
- `src/lib/domain/schemas/franchise-territory.schema.ts` (NEW)
- `src/lib/domain/schemas/user-profile.schema.ts` (added `sales` role)
- `src/lib/domain/schemas/index.ts` (export new schemas)
- `src/lib/domain/schemas/approval.schema.ts` (renamed to avoid conflicts)

### Routes
- `src/routes/dashboard/sales/+page.svelte` (NEW - Sales dashboard)
- `src/routes/dashboard/sales/+page.server.ts` (NEW - Data loading)
- `src/routes/auth/login/+page.server.ts` (role-based redirects)
- `src/routes/dashboard/+layout.server.ts` (sales redirect)

### Components
- `src/lib/components/flihub-sidebar.svelte` (admin sees all, sales navigation)

### Auth
- `src/lib/domain/auth/types.ts` (sales permissions and routes)

## Next Steps

### Immediate
1. Start dev server: `npm run dev`
2. Login as admin: `admin@flihub.com` / `admin123`
3. Navigate to "Franchise Sales" in sidebar
4. View leads, opportunities, and territories

### Future Enhancements
- Lead/opportunity detail pages
- Create/edit forms for leads and opportunities
- Sales pipeline visualization (Kanban board)
- Territory management interface
- Commission tracking and reporting
- Sales analytics and forecasting
- Email integration for lead follow-ups
- Document management for contracts
- Automated lead scoring
- Sales team performance dashboards

## Architecture Notes

### Hierarchy
Role → Department → Projects → Tasks

### Separation of Concerns
- `sales` role: Sells franchises
- `franchise_owner` role: Operates franchises
- Clear distinction prevents confusion

### Scalability
- Can add more sales roles (sales_manager, regional_sales, etc.)
- Can create Sales Department with leader
- Projects can track individual franchise sales campaigns
- Tasks can track follow-ups, meetings, due diligence

## Support

For issues or questions:
1. Check PocketBase admin panel for collection data
2. Verify user roles in user_profiles collection
3. Check browser console for errors
4. Review server logs for authentication issues
