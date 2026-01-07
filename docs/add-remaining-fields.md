# Add Remaining Budget Fields

You've already added some fields! Here's what's still needed:

## Departments Collection (2 more fields)

Go to: https://pocketbase-production-6ab5.up.railway.app/_/ → Collections → departments → Edit

Add these fields:

1. **department_actual_expenses**
   - Type: Number
   - Min: 0
   - Required: No
   - Default: (leave empty)

2. **department_manual_budget_override**
   - Type: Number
   - Min: 0
   - Required: No
   - Default: (leave empty)

## Projects Collection (3 more fields)

Go to: Collections → projects → Edit

Add these fields:

1. **project_forecasted_expenses**
   - Type: Number
   - Min: 0
   - Required: No
   - Default: (leave empty)

2. **project_actual_expenses**
   - Type: Number
   - Min: 0
   - Required: No
   - Default: (leave empty)

3. **project_manual_budget_override**
   - Type: Number
   - Min: 0
   - Required: No
   - Default: (leave empty)

## Tasks Collection (1 more field)

Go to: Collections → tasks → Edit

Add this field:

1. **task_actual_cost**
   - Type: Number
   - Min: 0
   - Required: No
   - Default: (leave empty)

---

## After Adding All Fields

Once all 6 fields are added, run the migration script:

```bash
cd /workspaces/FliHub
npx tsx scripts/migrate-budget-system.ts
```

This will copy your existing data:
- `annualBudget` → `department_annual_budget` ✅ (already has field)
- `budget` → `project_budget` ✅ (already has field)
- `forecastedExpenses` → `project_forecasted_expenses`
- `actualExpenses` → `project_actual_expenses`
- Initialize all task fields to 0

---

## Quick Checklist

Before running the script, verify you have:

**Departments:**
- [x] department_annual_budget (you have this)
- [ ] department_actual_expenses
- [ ] department_manual_budget_override

**Projects:**
- [x] project_budget (you have this)
- [ ] project_forecasted_expenses
- [ ] project_actual_expenses
- [ ] project_manual_budget_override

**Tasks:**
- [x] task_budget (you have this)
- [ ] task_actual_cost

Total: 3 fields done, 6 fields remaining
