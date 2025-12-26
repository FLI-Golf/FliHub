# Schema Update Summary

## Updated Zod Schemas

All Zod schemas have been updated to match the new PocketBase collection structures.

### ✅ Updated Schemas

1. **user-profile.schema.ts**
   - Added `email` field
   - Changed `isActive` → `status` (active, inactive, pending)
   - Added `UserStatusEnum`

2. **task.schema.ts**
   - Renamed `task` → `title`
   - Added `description` field
   - Changed `subTasksChecklist` from string to JSON array
   - Updated status values: todo, in_progress, blocked, completed, cancelled
   - Added `priority` field (low, medium, high, urgent)
   - Renamed `endDate` → `dueDate`
   - Added `completedDate`
   - Added relation fields: `projectId`, `assignedTo`, `createdBy`, `managerId`
   - Added `estimatedHours` and `actualHours`
   - Removed: budget, income, track, strategicGoal, departments, quarters

3. **project.schema.ts** (NEW)
   - Complete schema for projects/campaigns
   - Includes expense forecasting fields
   - Types: tournament, activation, event, campaign
   - Status: draft, planned, in_progress, completed, cancelled
   - Expense tracking: forecastedExpenses, actualExpenses, expenseCategories
   - Approval workflow: approvalStatus, approvedBy

4. **expense.schema.ts** (NEW)
   - Complete schema for expense tracking
   - Categories: travel, accommodation, meals, equipment, marketing, venue, staff, other
   - Status: draft, submitted, approved, rejected, paid
   - Payment tracking: paymentMethod, paidDate, vendor, reimbursementTo
   - Links to projects via `projectId`

5. **department.schema.ts** (NEW)
   - Department management schema
   - Includes annual budget tracking
   - Links to head of department

### 📦 Collections with JSON Import Files

Ready to import into PocketBase:

- ✅ `users_import.json` - Minimal auth collection
- ✅ `user_profiles_import.json` - User profile with status
- ✅ `projects_updated.json` - Projects with expense forecasting
- ✅ `tasks_import.json` - Updated task management
- ✅ `expenses_import.json` - Expense tracking
- ✅ `departments_import.json` - Department structure
- ✅ `budget_periods_import.json` - Fiscal periods
- ✅ `approvals_import.json` - Approval workflow

### 🔄 Import Order

Import collections in this order to avoid relation errors:

1. `users_import.json` (auth collection)
2. `user_profiles_import.json`
3. `departments_import.json`
4. `managers` (existing - update to reference departments if needed)
5. `projects_updated.json`
6. `tasks_import.json`
7. `expenses_import.json`
8. `budget_periods_import.json` (optional)
9. `approvals_import.json` (optional)

### 🗑️ Collections to Consider Removing

- `broadcast_partners` - Unless specifically needed for your use case
- `marketing` - Check if still relevant

### 📝 Next Steps

1. Import all JSON files into PocketBase
2. Test creating records with the new schemas
3. Update any existing UI components to use new field names
4. Update API calls to match new collection structures

### 🔗 Relationships

```
users (auth)
  ↓
user_profiles (profile data + role + status)
  ↓
managers (department managers)
  ↓
projects (campaigns with forecasts)
  ↓
  ├─→ tasks (work items)
  └─→ expenses (actual spending)

departments
  ↓
managers (belongs to department)
```

### 💡 Key Changes

- **Removed redundancy**: No more duplicate fields between users and user_profiles
- **Added relations**: Proper foreign keys instead of text fields
- **Expense forecasting**: Projects now track forecasted vs actual expenses
- **Better task management**: More standard task fields with proper relations
- **Department structure**: Centralized department management
