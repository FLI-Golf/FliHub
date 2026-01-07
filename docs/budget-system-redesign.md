# Budget System Redesign

## Current State Analysis

### Existing Budget Fields

**Departments Collection:**
- `annualBudget` - Manually set annual budget

**Projects Collection:**
- `budget` - Manually set project budget
- `forecastedExpenses` - Manually set forecasted amount
- `actualExpenses` - Calculated from expenses

**Tasks Collection:**
- No budget field currently

**Expenses Collection:**
- `amount` - Individual expense amount
- Linked to `projectId`

## Proposed New System

### Bottom-Up Budget Flow
Tasks → Projects → Departments

### New Field Naming Convention

**Tasks Collection:**
- `task_budget` (new) - Budget allocated for this specific task
- `task_actual_cost` (new) - Actual cost from time tracking (hours × rate) + related expenses

**Projects Collection:**
- `project_budget` (rename from `budget`) - Calculated sum of all task budgets
- `project_forecasted_expenses` (rename from `forecastedExpenses`) - Sum of task budgets
- `project_actual_expenses` (rename from `actualExpenses`) - Sum of actual expenses + task actual costs
- `project_manual_budget_override` (new, optional) - Allow manual override if needed

**Departments Collection:**
- `department_annual_budget` (rename from `annualBudget`) - Calculated sum of all project budgets
- `department_actual_expenses` (new) - Sum of all project actual expenses
- `department_manual_budget_override` (new, optional) - Allow manual override if needed

### Budget Calculation Logic

1. **Task Level:**
   - User sets `task_budget` when creating/editing task
   - `task_actual_cost` = (actualHours × hourly_rate) + related expenses

2. **Project Level:**
   - `project_budget` = SUM(all tasks.task_budget) OR project_manual_budget_override
   - `project_actual_expenses` = SUM(all expenses.amount) + SUM(all tasks.task_actual_cost)
   - `project_forecasted_expenses` = project_budget (for consistency)

3. **Department Level:**
   - `department_annual_budget` = SUM(all projects.project_budget) OR department_manual_budget_override
   - `department_actual_expenses` = SUM(all projects.project_actual_expenses)

### Migration Strategy

**Option 1: Database Migration Script (Recommended)**
- Create a migration script that connects to production DB
- Rename existing fields with proper mapping
- Preserve all existing data
- Add new fields with default values
- Update all references in code

**Option 2: Manual Database Update**
- Provide SQL/PocketBase commands to run manually
- Update field names in PocketBase admin
- Manually update code references

## Implementation Plan

### Phase 1: Schema Updates
1. Update Zod schemas with new field names
2. Add new fields (task_budget, task_actual_cost, etc.)
3. Mark old fields as deprecated

### Phase 2: Database Migration
1. Create migration script in `scripts/migrate-budget-fields.ts`
2. Test on development data
3. Run on production with backup

### Phase 3: API Updates
1. Update all API endpoints to use new field names
2. Add aggregation logic for calculated fields
3. Add triggers/hooks to recalculate budgets when tasks/projects change

### Phase 4: UI Updates
1. Update all forms to use new field names
2. Add task budget input field
3. Show calculated budgets (read-only) with option to override
4. Update dashboard and reports

### Phase 5: Real-time Aggregation
1. Create PocketBase hooks or API endpoints to recalculate:
   - When task is created/updated/deleted → recalculate project_budget
   - When project is created/updated/deleted → recalculate department_annual_budget
   - When expense is created/updated/deleted → recalculate actual expenses

## Benefits

1. **Accuracy**: Budgets reflect actual task-level planning
2. **Transparency**: Clear visibility of budget allocation
3. **Automation**: Reduces manual data entry and errors
4. **Flexibility**: Can still override at project/department level if needed
5. **Tracking**: Better cost tracking from tasks through to departments

## Risks & Mitigation

**Risk**: Data loss during migration
**Mitigation**: Full database backup before migration, test on copy first

**Risk**: Existing reports/dashboards break
**Mitigation**: Update all references in same deployment, use feature flags

**Risk**: Users confused by new fields
**Mitigation**: Clear UI labels, tooltips, and documentation

## Recommendation

I recommend **Option 1** with the migration script approach:
1. Safer - automated and repeatable
2. Testable - can run on dev/staging first
3. Auditable - script shows exactly what changes
4. Reversible - can create rollback script

Would you like me to:
1. Create the migration script?
2. Provide manual update commands?
3. Start with schema updates first?
