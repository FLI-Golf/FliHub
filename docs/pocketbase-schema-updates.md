# PocketBase Schema Updates for Budget System

## Step 1: Add New Fields to Collections

Before running the migration script, you need to add the new fields to your PocketBase collections through the Admin UI.

### Access PocketBase Admin
1. Go to: https://pocketbase-production-6ab5.up.railway.app/_/
2. Login with your admin credentials

---

## Departments Collection

Go to: Collections → departments → Edit

### Add These Fields:

1. **department_annual_budget**
   - Type: Number
   - Min: 0
   - Optional: Yes
   - Default: (leave empty)

2. **department_actual_expenses**
   - Type: Number
   - Min: 0
   - Optional: Yes
   - Default: 0

3. **department_manual_budget_override**
   - Type: Number
   - Min: 0
   - Optional: Yes
   - Default: (leave empty)

**Save the collection**

---

## Projects Collection

Go to: Collections → projects → Edit

### Add These Fields:

1. **project_budget**
   - Type: Number
   - Min: 0
   - Optional: Yes
   - Default: (leave empty)

2. **project_forecasted_expenses**
   - Type: Number
   - Min: 0
   - Optional: Yes
   - Default: (leave empty)

3. **project_actual_expenses**
   - Type: Number
   - Min: 0
   - Optional: Yes
   - Default: (leave empty)

4. **project_manual_budget_override**
   - Type: Number
   - Min: 0
   - Optional: Yes
   - Default: (leave empty)

**Save the collection**

---

## Tasks Collection

Go to: Collections → tasks → Edit

### Add These Fields:

1. **task_budget**
   - Type: Number
   - Min: 0
   - Optional: Yes
   - Default: 0

2. **task_actual_cost**
   - Type: Number
   - Min: 0
   - Optional: Yes
   - Default: 0

**Save the collection**

---

## After Adding Fields

Once all fields are added to the collections:

1. Run the migration script again:
   ```bash
   npx tsx scripts/migrate-budget-system.ts
   ```

2. The script will:
   - Copy `annualBudget` → `department_annual_budget`
   - Copy `budget` → `project_budget`
   - Copy `forecastedExpenses` → `project_forecasted_expenses`
   - Copy `actualExpenses` → `project_actual_expenses`
   - Initialize all task budget fields to 0

3. After successful migration, you can optionally delete the old fields:
   - `annualBudget` from departments
   - `budget`, `forecastedExpenses`, `actualExpenses` from projects

---

## Verification Checklist

After adding fields, verify in PocketBase Admin:

- [ ] Departments collection has 3 new fields
- [ ] Projects collection has 4 new fields
- [ ] Tasks collection has 2 new fields
- [ ] All fields are type "Number"
- [ ] All fields allow optional/null values
- [ ] Collections are saved

Then you're ready to run the migration script!
