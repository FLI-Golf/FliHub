# Testing Quick Start Guide

**Purpose:** Rapidly test FliHub with realistic data that can be easily reset

---

## Quick Start (3 Steps)

### 1. Generate Test Data
```bash
npx tsx scripts/seed-test-data.ts quick
```
Creates: 10 expenses, 3 vendors

### 2. Test Your Features
- View expenses in the app
- Test approval workflows
- Check budget tracking
- Test UI/UX

### 3. Reset When Done
```bash
npx tsx scripts/reset-test-data.ts --all --force
```
Removes all test data, keeps blueprint

---

## Using the UI (Recommended)

### Access Data Management
1. Go to `/dashboard/admin`
2. View current database state
3. Generate seed data with one click
4. Reset data when needed

### Generate Test Data
1. Select scenario (Quick or Full)
2. Click "Generate Seed Data"
3. Wait for confirmation
4. Test data is ready!

### Reset Test Data
1. Click "Reset Test Data"
2. Type "CONFIRM"
3. Click "Confirm Reset"
4. Data is cleared!

---

## Available Scenarios

### Quick Test (Default)
```bash
npx tsx scripts/seed-test-data.ts quick
```
- **10 expenses** (3 draft, 4 submitted, 2 approved, 1 paid)
- **3 vendors**
- **Phase 1 dates**
- **Best for:** Quick testing, UI development

### Full Test
```bash
npx tsx scripts/seed-test-data.ts full
```
- **50 expenses** (10 draft, 15 submitted, 15 approved, 8 paid, 2 rejected)
- **10 vendors**
- **All phases**
- **Best for:** Comprehensive testing, demos

### Approval Workflow
```bash
npx tsx scripts/seed-test-data.ts approval
```
- **20 expenses** (5 draft, 8 submitted, 5 approved, 2 paid)
- **5 vendors**
- **Phase 2 dates**
- **Best for:** Testing approval flows

### Budget Testing
```bash
npx tsx scripts/seed-test-data.ts budget
```
- **15 expenses** (3 draft, 5 submitted, 5 approved, 2 paid)
- **5 vendors**
- **Phase 1 dates**
- **Best for:** Testing budget alerts and limits

---

## Reset Options

### Reset Everything (Recommended)
```bash
npx tsx scripts/reset-test-data.ts --all --force
```
Deletes: Expenses, vendors  
Keeps: Departments, projects, tasks (blueprint)

### Reset Only Expenses
```bash
npx tsx scripts/reset-test-data.ts --expenses --force
```
Deletes: Expenses only  
Keeps: Vendors, blueprint

### Reset Only Vendors
```bash
npx tsx scripts/reset-test-data.ts --vendors --force
```
Deletes: Vendors only  
Keeps: Expenses, blueprint

### Interactive Reset (with confirmation)
```bash
npx tsx scripts/reset-test-data.ts --all
```
Prompts for confirmation before deleting

---

## Common Workflows

### Daily Development
```bash
# Morning: Generate test data
npx tsx scripts/seed-test-data.ts quick

# Work on features...

# Evening: Reset for tomorrow
npx tsx scripts/reset-test-data.ts --all --force
```

### Demo Preparation
```bash
# Generate full test data
npx tsx scripts/seed-test-data.ts full

# Give demo...

# Reset after demo
npx tsx scripts/reset-test-data.ts --all --force
```

### Testing Specific Features
```bash
# Test approval workflow
npx tsx scripts/seed-test-data.ts approval

# Test approvals...

# Reset and test budget
npx tsx scripts/reset-test-data.ts --all --force
npx tsx scripts/seed-test-data.ts budget
```

---

## What Gets Created

### Vendors (Realistic)
- Smartboost Marketing
- Neology PR
- Pure Mobile Productions
- Go Throw Media
- Office Depot
- Adobe Creative Cloud
- Amazon Web Services
- FedEx
- Staples
- Disc Golf Manufacturers Inc

### Expenses (Realistic)
- Marketing campaigns ($5K-$15K)
- Social media ads ($2K-$8K)
- PR materials ($3K-$10K)
- Video production ($10K-$50K)
- Office supplies ($500-$2K)
- Software licenses ($1K-$5K)
- Cloud hosting ($2K-$8K)
- Shipping ($300-$1.5K)
- Player sponsorships ($5K-$25K)
- Event venues ($5K-$20K)

### Expense Statuses
- **Draft:** Created but not submitted
- **Submitted:** Awaiting approval
- **Approved:** Approved, awaiting payment
- **Paid:** Completed and paid
- **Rejected:** Denied with reason

---

## Safety Features

### Blueprint Protection
- Departments, projects, and tasks are NEVER deleted
- Only test data (expenses, vendors) can be reset
- Blueprint data is your Phase 1-3 structure

### Confirmation Required
- Interactive mode requires typing "yes"
- UI requires typing "CONFIRM"
- Force flag (`--force`) skips confirmation

### Mode Detection
- **Blueprint Mode:** No test data
- **Testing Mode:** Has test data
- **Production Mode:** Real data (reset disabled)

---

## Troubleshooting

### "No projects found"
**Problem:** Trying to seed data before Phase 1 migration  
**Solution:** Run Phase 1 migration first
```bash
npx tsx scripts/migrate-to-phase1.ts
```

### "Unauthorized"
**Problem:** Not logged in or not admin  
**Solution:** Log in as admin user

### "Cannot reset in production mode"
**Problem:** Trying to reset real data  
**Solution:** This is a safety feature - don't reset production!

### Expenses not showing
**Problem:** Data created but not visible  
**Solution:** Refresh the page or check filters

---

## Before Going Live

### Pre-Production Checklist
1. ✅ Test all features with seed data
2. ✅ Verify workflows work correctly
3. ✅ Check budget calculations
4. ✅ Test approval flows
5. ✅ **Reset ALL test data**
6. ✅ Verify clean state
7. ✅ Switch to Production mode
8. ✅ Ready for real data!

### Final Reset Command
```bash
# This is the last command before production
npx tsx scripts/reset-test-data.ts --all --force

# Verify clean state
npx tsx scripts/export-current-data.ts
```

---

## Tips & Best Practices

### 1. Reset Often
Don't let test data accumulate. Reset daily or after each testing session.

### 2. Use Quick for Development
The "quick" scenario is perfect for daily development. Fast and sufficient.

### 3. Use Full for Demos
The "full" scenario creates impressive demo data with variety.

### 4. Test Different Scenarios
Each scenario tests different aspects. Use them all during development.

### 5. Keep Blueprint Clean
Never manually delete departments, projects, or tasks. They're your structure.

### 6. Document Custom Tests
If you create custom test scenarios, document them for the team.

### 7. Backup Before Major Changes
Create a backup before making significant changes:
```bash
npx tsx scripts/backup-database.ts
```

---

## API Endpoints (for UI)

### Get Status
```
GET /api/admin/data-status
```

### Generate Seed Data
```
POST /api/admin/seed-data
Body: { scenario: 'quick' | 'full' | 'approval' | 'budget' }
```

### Reset Data
```
POST /api/admin/reset-data
Body: { 
  deleteExpenses: true, 
  deleteVendors: true, 
  confirmation: 'CONFIRM' 
}
```

---

## Files Created

### Scripts
- `scripts/seed-test-data.ts` - Generate test data
- `scripts/reset-test-data.ts` - Reset test data

### API Routes
- `src/routes/api/admin/seed-data/+server.ts`
- `src/routes/api/admin/reset-data/+server.ts`
- `src/routes/api/admin/data-status/+server.ts`

### UI
- `src/routes/dashboard/admin/+page.svelte` - Data management UI

### Documentation
- `docs/testing-seed-data-plan.md` - Detailed plan
- `docs/TESTING-QUICK-START.md` - This guide

---

## Support

### Questions?
- Check `docs/testing-seed-data-plan.md` for detailed information
- Review the scripts in `scripts/` directory
- Test in the UI at `/dashboard/admin`

### Issues?
- Verify you're logged in as admin
- Check that Phase 1 migration is complete
- Try resetting and regenerating data
- Check browser console for errors

---

**Remember:** This is for testing only. Always reset before production!

**Quick Commands:**
```bash
# Generate test data
npx tsx scripts/seed-test-data.ts quick

# Reset test data
npx tsx scripts/reset-test-data.ts --all --force

# Or use the UI at /dashboard/admin
```
