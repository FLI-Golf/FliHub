# Manual Budget System Migration Guide

If you prefer to update the database manually through PocketBase Admin UI, follow these steps:

## ⚠️ IMPORTANT: Backup First!
Before making any changes, create a full backup of your PocketBase database.

## Step 1: Update Departments Collection

### Add New Fields:
1. Go to PocketBase Admin → Collections → departments
2. Add these new fields:

| Field Name | Type | Options |
|------------|------|---------|
| `department_annual_budget` | Number | Min: 0, Optional |
| `department_actual_expenses` | Number | Min: 0, Default: 0 |
| `department_manual_budget_override` | Number | Min: 0, Optional |

### Migrate Data:
3. For each department record:
   - Copy value from `annualBudget` to `department_annual_budget`
   - Set `department_actual_expenses` to 0
   - Leave `department_manual_budget_override` empty

### Optional - Remove Old Field:
4. After verifying data is copied, you can optionally delete the `annualBudget` field

## Step 2: Update Projects Collection

### Add New Fields:
1. Go to PocketBase Admin → Collections → projects
2. Add these new fields:

| Field Name | Type | Options |
|------------|------|---------|
| `project_budget` | Number | Min: 0, Optional |
| `project_forecasted_expenses` | Number | Min: 0, Optional |
| `project_actual_expenses` | Number | Min: 0, Optional |
| `project_manual_budget_override` | Number | Min: 0, Optional |

### Migrate Data:
3. For each project record:
   - Copy value from `budget` to `project_budget`
   - Copy value from `forecastedExpenses` to `project_forecasted_expenses`
   - Copy value from `actualExpenses` to `project_actual_expenses`
   - Leave `project_manual_budget_override` empty

### Optional - Remove Old Fields:
4. After verifying data is copied, you can optionally delete:
   - `budget`
   - `forecastedExpenses`
   - `actualExpenses`

## Step 3: Update Tasks Collection

### Add New Fields:
1. Go to PocketBase Admin → Collections → tasks
2. Add these new fields:

| Field Name | Type | Options |
|------------|------|---------|
| `task_budget` | Number | Min: 0, Default: 0 |
| `task_actual_cost` | Number | Min: 0, Default: 0 |

### No Data Migration Needed:
3. All existing tasks will have these fields set to 0 by default
4. Users will set `task_budget` when creating/editing tasks going forward

## Step 4: Verify Migration

After completing the above steps, verify:

1. ✅ All departments have `department_annual_budget` values
2. ✅ All projects have `project_budget`, `project_forecasted_expenses`, and `project_actual_expenses` values
3. ✅ All tasks have `task_budget` and `task_actual_cost` fields (can be 0)
4. ✅ No data was lost during the migration

## Step 5: Update Application Code

After the database migration is complete, the application code needs to be updated to use the new field names. This will be done in a separate code deployment.

## Rollback Plan

If you need to rollback:
1. Restore from the backup you created
2. Or manually copy values back from new fields to old fields
3. Delete the new fields

## Questions?

If you encounter any issues during manual migration, refer to the automated script at `scripts/migrate-budget-system.ts` for the exact logic.
