# Budget System Guide

## Overview

FliHub uses a **bottom-up budget system** where budgets flow from tasks → projects → departments. This ensures accurate budget tracking based on actual work planned, while still providing flexibility for special scenarios.

## Budget Flow

```
Task Budget (user sets)
    ↓
Project Budget (calculated or set)
    ↓
Department Budget (calculated or set)
```

## How It Works

### 1. Creating Tasks with Budgets

When you create a task in a project:

1. Go to any project detail page
2. Click **"Add Task"**
3. Fill in task details
4. **Set the Task Budget** (required field)
5. Save the task

**The project and department budgets automatically update!**

### 2. Project Budget Modes

Projects have 4 budget calculation modes. Choose the one that fits your scenario:

#### Auto Mode (Default) ✨

**When to use:** Standard projects where budget = sum of all tasks

**How it works:**
- System automatically sums all task budgets
- Budget updates in real-time as tasks are added/edited/deleted
- No manual entry needed

**Example:**
```
Task 1: $2,000
Task 2: $3,000
Task 3: $1,500
─────────────────
Project Budget: $6,500 (automatic)
```

#### Fixed Mode 💰

**When to use:** 
- Client has a fixed contract amount
- Sponsor provided specific budget
- Grant with set funding amount

**How it works:**
- Set a fixed budget amount
- Tasks can still be tracked, but project budget stays fixed
- Useful for tracking budget vs. actual spending

**Example:**
```
Fixed Budget: $10,000
Task budgets: $8,500
─────────────────
Project Budget: $10,000 (fixed, regardless of tasks)
```

#### Hybrid Mode 🔀

**When to use:**
- Need contingency/buffer on top of task budgets
- Want to add overhead or management fees
- Planning for unknowns

**How it works:**
- Calculates task budgets
- Adds your buffer/contingency amount
- Total = Tasks + Buffer

**Example:**
```
Task budgets: $5,000
Buffer: $1,000 (20% contingency)
─────────────────
Project Budget: $6,000 (tasks + buffer)
```

#### Capped Mode 🔒

**When to use:**
- Have a maximum budget limit
- Want to ensure you don't exceed a cap
- Need to stay within approved amount

**How it works:**
- Calculates task budgets
- Caps at your maximum limit
- Warns if tasks exceed cap

**Example:**
```
Task budgets: $8,000
Budget Cap: $6,000
─────────────────
Project Budget: $6,000 (capped at limit)
⚠️ Tasks exceed cap by $2,000
```

### 3. Department Budget Modes

Departments have 3 budget modes:

#### Auto Mode (Default) ✨

**When to use:** Standard departments

**How it works:**
- Automatically sums all project budgets in the department
- Updates as projects change

**Example:**
```
Project A: $5,000
Project B: $3,000
Project C: $2,000
─────────────────
Department Budget: $10,000 (automatic)
```

#### Annual Cap Mode 📅

**When to use:**
- Department has a fixed annual budget
- Need to track against yearly allocation

**How it works:**
- Set annual budget cap
- Projects calculate normally
- Can see if you're over/under budget

**Example:**
```
Annual Cap: $50,000
Current Projects: $42,000
─────────────────
Remaining: $8,000
```

#### Allocated Mode 📊

**When to use:**
- Pre-allocated budget amounts
- Budget assigned from finance

**How it works:**
- Set the allocated amount
- Fixed budget for the department

## Changing Budget Modes

### For Projects:

1. Go to project detail page
2. Click **"Edit Project"**
3. Find **"Budget Mode"** dropdown
4. Select your mode:
   - **Auto** - No additional fields needed
   - **Fixed** - Enter fixed budget amount
   - **Hybrid** - Enter buffer/contingency amount
   - **Capped** - Enter maximum budget cap
5. Save changes

The budget recalculates immediately!

### For Departments:

1. Go to departments page
2. Click on a department card
3. Click **"Edit"**
4. Find **"Budget Mode"** dropdown
5. Select your mode:
   - **Auto** - No additional fields needed
   - **Annual Cap** - Enter annual budget cap
   - **Allocated** - Enter allocated amount
6. Save changes

## Budget Tracking

### What Gets Tracked:

**For Projects:**
- `project_budget` - Total allocated budget
- `project_forecasted_expenses` - Expected costs (mirrors budget)
- `project_actual_expenses` - Real spending from expenses + task actual costs

**For Departments:**
- `department_annual_budget` - Total annual budget
- `department_actual_expenses` - Real spending across all projects

### Budget vs. Actual:

Track your spending against budget:
- **Budget** = What you planned to spend
- **Actual** = What you actually spent
- **Remaining** = Budget - Actual

## Common Scenarios

### Scenario 1: Standard Project

**Situation:** Regular project with multiple tasks

**Solution:** Use **Auto Mode**
1. Create project
2. Add tasks with budgets
3. Budget calculates automatically

### Scenario 2: Fixed Contract

**Situation:** Client contract for $25,000

**Solution:** Use **Fixed Mode**
1. Create project
2. Set mode to "Fixed"
3. Enter $25,000 as fixed budget
4. Add tasks to track work (budget stays at $25,000)

### Scenario 3: Need Contingency

**Situation:** Project tasks = $10,000, want 15% buffer

**Solution:** Use **Hybrid Mode**
1. Create project with tasks ($10,000)
2. Set mode to "Hybrid"
3. Enter $1,500 as buffer
4. Total budget = $11,500

### Scenario 4: Budget Limit

**Situation:** Approved for max $8,000, but tasks might exceed

**Solution:** Use **Capped Mode**
1. Create project
2. Set mode to "Capped"
3. Enter $8,000 as cap
4. Add tasks - budget won't exceed $8,000

### Scenario 5: Department Annual Budget

**Situation:** Marketing has $100,000 annual budget

**Solution:** Use **Annual Cap Mode**
1. Edit Marketing department
2. Set mode to "Annual Cap"
3. Enter $100,000
4. Track projects against this cap

## Tips & Best Practices

### ✅ Do's:

- **Set task budgets** when creating tasks - this is the foundation
- **Choose the right mode** for each project's situation
- **Review budgets regularly** to ensure accuracy
- **Use hybrid mode** for contingency planning
- **Track actual expenses** to compare against budget

### ❌ Don'ts:

- **Don't mix modes unnecessarily** - pick one that fits and stick with it
- **Don't forget task budgets** - they're required for auto/hybrid/capped modes
- **Don't set unrealistic caps** - ensure caps are achievable
- **Don't ignore warnings** - if tasks exceed caps, review your plan

## Troubleshooting

### Budget Not Updating?

**Check:**
1. Are tasks assigned to the project?
2. Do tasks have budgets set?
3. Is project in "Fixed" mode? (won't update from tasks)
4. Try editing a task to trigger recalculation

### Budget Seems Wrong?

**Check:**
1. Review all task budgets in the project
2. Check if buffer is set (hybrid mode)
3. Check if cap is limiting (capped mode)
4. Verify budget mode is correct

### Department Budget Not Matching?

**Check:**
1. Are all projects assigned to the department?
2. Check department budget mode
3. If "Annual Cap" or "Allocated", check those values
4. Try editing a project to trigger recalculation

## Technical Details

### Automatic Recalculation

Budgets recalculate automatically when:
- ✅ Task is created
- ✅ Task is updated
- ✅ Task is deleted
- ✅ Project budget mode changes
- ✅ Department budget mode changes

### Manual Override

If you need to manually set budgets:
- **Projects**: Use "Fixed" mode
- **Departments**: Use "Annual Cap" or "Allocated" mode

### Data Fields

**Projects:**
- `project_budget_mode` - Calculation mode
- `project_budget` - Total budget
- `project_budget_buffer` - Buffer amount (hybrid mode)
- `project_budget_cap` - Maximum limit (capped mode)
- `project_manual_budget_override` - Fixed amount (fixed mode)

**Departments:**
- `department_budget_mode` - Calculation mode
- `department_annual_budget` - Total budget
- `department_budget_cap` - Annual cap (annual cap mode)
- `department_manual_budget_override` - Allocated amount (allocated mode)

**Tasks:**
- `task_budget` - Budget for this task
- `task_actual_cost` - Actual cost (from hours worked)

## Support

For questions or issues with the budget system:
1. Check this guide first
2. Review the troubleshooting section
3. Contact your system administrator
4. Check the technical documentation in `/docs/budget-system-redesign.md`

---

**Last Updated:** January 2026  
**Version:** 1.0
