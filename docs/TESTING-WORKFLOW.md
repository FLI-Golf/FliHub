# Testing Workflow Guide

This guide explains how to test FliHub with realistic data before going live with actual financial transactions.

## Overview

The testing workflow allows you to:
1. **Backup** your current production data
2. **Seed** realistic test data (vendors, expenses, etc.)
3. **Test** the complete financial workflow
4. **Restore** back to the original state

This ensures you can validate the entire system flow without risking real financial data.

## Quick Start

### Complete Test Flow (Recommended)

Run backup and seed in one command:

```bash
npm run test:flow
```

This will:
- Create a timestamped backup
- Seed 10 test expenses with 3 vendors
- Show you the test data breakdown

### Manual Step-by-Step

#### 1. Create Backup

Before adding any test data, create a backup:

```bash
npm run test:backup
```

This creates a timestamped backup file in `backups/pre-seed-backup-YYYY-MM-DDTHH-MM-SS.json`

#### 2. Seed Test Data

Choose a scenario based on your testing needs:

**Quick Test** (10 expenses, 3 vendors):
```bash
npm run test:seed:quick
```

**Full Test** (50 expenses, 10 vendors):
```bash
npm run test:seed:full
```

**Custom Scenario**:
```bash
npx tsx scripts/seed-test-data.ts [scenario]
```

Available scenarios:
- `quick` - 10 expenses, 3 vendors (default)
- `full` - 50 expenses, 10 vendors
- `approval` - 20 expenses with approval workflow
- `budget` - 15 expenses testing budget limits

#### 3. Test Your Workflow

Now you can test the complete flow:

1. **View Dashboard** - See financial metrics with test data
2. **Review Expenses** - Check expense approval workflow
3. **Test Departments** - View department budgets and spending
4. **Verify Charts** - Ensure D3 visualizations work correctly
5. **Test Phase Filtering** - Switch between Phase 1, 2, 3
6. **Approve/Reject** - Test the approval workflow
7. **Generate Reports** - Verify reporting functionality

#### 4. Restore Original Data

When testing is complete, restore your original data:

```bash
npm run test:restore
```

This will:
- Delete all test vendors and expenses
- Restore the original data from the most recent backup
- Show a summary of what was restored

## Test Data Details

### Vendors Created

The seed script creates realistic vendors:
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

### Expense Categories

Test expenses use valid categories:
- Marketing
- Advertising
- Public relations
- Production Studio
- Office/San Diego
- Software
- Internal Tech Budget
- Tech/App Development
- Expenses/MPO (Male)
- Course Build/Materials
- Course Build/Tools
- Travel/Airefare
- Travel/Lodging
- Legal
- E-Commerce/Clothing
- Consultants

### Expense Statuses

Test data includes expenses in various states:
- **Draft** - Not yet submitted
- **Submitted** - Awaiting approval
- **Approved** - Approved but not paid
- **Paid** - Completed transactions
- **Rejected** - Denied expenses

### Phase Distribution

Expenses are distributed across phases based on scenario:
- **Phase 1**: Jan - Sep 2026
- **Phase 2**: Oct 2026 - Mar 2027
- **Phase 3**: Apr - Dec 2027

## Backup Management

### List Available Backups

```bash
ls -lh backups/
```

### Restore Specific Backup

```bash
npx tsx scripts/restore-from-seed-backup.ts [backup-filename]
```

Example:
```bash
npx tsx scripts/restore-from-seed-backup.ts pre-seed-backup-2026-01-07T19-27-36.json
```

### Restore Latest Backup

```bash
npm run test:restore
```

This automatically finds and restores the most recent pre-seed backup.

## Best Practices

### Before Testing

1. ✅ Always create a backup first
2. ✅ Verify backup was created successfully
3. ✅ Note the backup filename for later restoration
4. ✅ Ensure you're not in production environment

### During Testing

1. ✅ Test all user roles (admin, leader, vendor)
2. ✅ Test approval workflows
3. ✅ Verify budget calculations
4. ✅ Check phase filtering
5. ✅ Test department views
6. ✅ Validate charts and visualizations
7. ✅ Test expense creation and editing
8. ✅ Verify financial health indicators

### After Testing

1. ✅ Document any issues found
2. ✅ Restore original data
3. ✅ Verify restoration was successful
4. ✅ Check that original vendors/expenses are back
5. ✅ Keep backup files for reference

## Troubleshooting

### Backup Failed

**Issue**: Backup script fails to connect

**Solution**: 
- Check `.env` file has correct PocketBase credentials
- Verify PocketBase URL is accessible
- Ensure admin credentials are correct

### Seed Failed

**Issue**: Seed script fails with validation errors

**Solution**:
- Ensure Phase 1 migration has been run
- Verify projects exist in database
- Check that user profiles exist

### Restore Incomplete

**Issue**: Not all vendors/expenses restored

**Solution**:
- This is normal if some records have validation issues
- Check the restore summary for counts
- Original data structure may have changed
- Consider this when planning production data

### Can't Find Backup

**Issue**: Restore can't find backup file

**Solution**:
- Check `backups/` directory exists
- Verify backup file was created
- Use full path if needed
- Run `npm run test:backup` to create new backup

## NPM Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run test:backup` | Create backup before seeding |
| `npm run test:seed` | Seed with default (quick) scenario |
| `npm run test:seed:quick` | Seed 10 expenses, 3 vendors |
| `npm run test:seed:full` | Seed 50 expenses, 10 vendors |
| `npm run test:restore` | Restore from latest backup |
| `npm run test:flow` | Backup + seed in one command |

## Files Created

### Backup Files

Location: `backups/pre-seed-backup-YYYY-MM-DDTHH-MM-SS.json`

Contains:
- Timestamp and metadata
- All vendors
- All expenses
- All projects
- All departments

### Scripts

- `scripts/backup-before-seed.ts` - Creates backups
- `scripts/seed-test-data.ts` - Seeds test data
- `scripts/restore-from-seed-backup.ts` - Restores from backup

## Safety Notes

⚠️ **Important**:
- Always backup before seeding
- Test in development environment first
- Verify restoration works before relying on it
- Keep multiple backups for safety
- Don't delete backup files until testing is complete

## Support

If you encounter issues:
1. Check this documentation
2. Review error messages carefully
3. Verify environment configuration
4. Check PocketBase connection
5. Ensure all migrations have been run

## Next Steps

After successful testing:
1. Document any workflow improvements needed
2. Update user training materials
3. Prepare for production launch
4. Set up monitoring and alerts
5. Plan for real financial data migration
