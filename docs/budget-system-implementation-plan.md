# Budget System Implementation Plan

## Executive Summary

This plan outlines the migration from manual budget entry to an automated bottom-up budget system where budgets flow from Tasks → Projects → Departments.

## Key Changes

### Field Naming Convention
All budget fields now have clear prefixes indicating their level:
- `task_budget`, `task_actual_cost`
- `project_budget`, `project_forecasted_expenses`, `project_actual_expenses`
- `department_annual_budget`, `department_actual_expenses`

### Budget Flow
```
Task Budget (user sets)
    ↓
Project Budget (calculated from tasks)
    ↓
Department Budget (calculated from projects)
```

## Implementation Options

### Option A: Automated Migration (Recommended) ⭐

**Pros:**
- Safer and more reliable
- Repeatable and testable
- Can run on dev/staging first
- Auditable and reversible
- Handles all data automatically

**Cons:**
- Requires running a script
- Need access to production credentials

**Steps:**
1. Backup production database
2. Test script on development/staging
3. Run: `tsx scripts/migrate-budget-system.ts`
4. Verify data migration
5. Deploy code updates
6. Update PocketBase collection schemas if needed

**Files Created:**
- `scripts/migrate-budget-system.ts` - Migration script
- `src/lib/utils/budget-calculator.ts` - Budget calculation utilities

### Option B: Manual Migration

**Pros:**
- Full control over each step
- Can review each change
- No script dependencies

**Cons:**
- Time-consuming
- Error-prone for large datasets
- Harder to rollback

**Steps:**
Follow the guide in `docs/budget-migration-manual.md`

## Recommended Approach

**I recommend Option A (Automated Migration)** for these reasons:

1. **Safety**: You have existing data that needs to be preserved
2. **Efficiency**: Automated script handles all records consistently
3. **Testing**: Can test on a copy of production first
4. **Rollback**: Easy to revert if needed

## Next Steps

### Phase 1: Database Migration (Choose One)

**Option A - Automated:**
```bash
# 1. Backup database first!
# 2. Test on development
tsx scripts/migrate-budget-system.ts

# 3. Verify results
# 4. Run on production
```

**Option B - Manual:**
Follow `docs/budget-migration-manual.md`

### Phase 2: Schema Updates

Update Zod schemas to use new field names:
- `src/lib/domain/schemas/department.schema.ts`
- `src/lib/domain/schemas/project.schema.ts`
- `src/lib/domain/schemas/task.schema.ts`

### Phase 3: API Updates

Update API endpoints to:
- Use new field names
- Call budget calculation functions after task/project changes
- Handle manual overrides

Key files to update:
- `src/routes/api/tasks/+server.ts`
- `src/routes/api/tasks/[id]/+server.ts`
- `src/routes/api/projects/+server.ts`
- `src/routes/api/projects/[id]/+server.ts`

### Phase 4: UI Updates

Update forms and displays:
- Add task budget input field to task forms
- Show calculated budgets (read-only) with override option
- Update dashboard displays
- Update project and department detail pages

Key files to update:
- `src/lib/components/tasks/add-task-modal.svelte`
- `src/lib/components/tasks/edit-task-modal.svelte`
- `src/lib/components/projects/edit-project-modal.svelte`
- `src/lib/components/departments/edit-department-modal.svelte`
- `src/routes/dashboard/+page.svelte`
- `src/routes/dashboard/projects/+page.svelte`
- `src/routes/dashboard/department/[id]/+page.svelte`

## Budget Calculation Logic

### When Task is Created/Updated:
```typescript
1. User sets task_budget
2. Calculate task_actual_cost from actualHours
3. Recalculate project_budget (sum of all task budgets)
4. Recalculate project_actual_expenses
5. Recalculate department_annual_budget
6. Recalculate department_actual_expenses
```

### Manual Override Support:
- Projects can set `project_manual_budget_override` to bypass task calculation
- Departments can set `department_manual_budget_override` to bypass project calculation
- This provides flexibility when needed

## Testing Checklist

Before deploying to production:

- [ ] Backup production database
- [ ] Test migration script on development data
- [ ] Verify all budget fields are populated correctly
- [ ] Test task creation with budget
- [ ] Test task update recalculates project budget
- [ ] Test project budget recalculates department budget
- [ ] Test manual override functionality
- [ ] Test dashboard displays correct values
- [ ] Test all forms work with new fields

## Rollback Plan

If issues arise:

1. **Database**: Restore from backup
2. **Code**: Revert to previous commit
3. **Partial Rollback**: Keep new fields but revert code to use old fields temporarily

## Timeline Estimate

- **Automated Migration**: 2-3 hours (including testing)
- **Manual Migration**: 4-6 hours (depending on data volume)
- **Code Updates**: 4-6 hours
- **Testing**: 2-3 hours
- **Total**: 1-2 days

## Questions to Answer

1. **Do you want to run the automated script or do manual migration?**
2. **Should we test on a copy of production first?**
3. **What hourly rate should we use for task_actual_cost calculation?** (Default: $50/hour)
4. **Do you want to keep old fields for a transition period or remove them immediately?**

## Support

All documentation and scripts are in:
- `docs/budget-system-redesign.md` - Full design document
- `docs/budget-migration-manual.md` - Manual migration guide
- `scripts/migrate-budget-system.ts` - Automated migration script
- `src/lib/utils/budget-calculator.ts` - Budget calculation utilities

Let me know which approach you'd like to take, and I can help with the next steps!
