# Budget System Quick Reference

## Budget Modes at a Glance

### Project Budget Modes

| Mode | When to Use | How It Works | Example |
|------|-------------|--------------|---------|
| **Auto** ✨ | Standard projects | Sum of all task budgets | Tasks: $5K → Budget: $5K |
| **Fixed** 💰 | Fixed contracts, grants | Set fixed amount | Fixed: $10K (ignores tasks) |
| **Hybrid** 🔀 | Need contingency | Tasks + buffer | Tasks: $5K + Buffer: $1K = $6K |
| **Capped** 🔒 | Maximum limit | Tasks up to cap | Tasks: $8K capped at $6K = $6K |

### Department Budget Modes

| Mode | When to Use | How It Works |
|------|-------------|--------------|
| **Auto** ✨ | Standard departments | Sum of all project budgets |
| **Annual Cap** 📅 | Fixed annual budget | Set yearly budget cap |
| **Allocated** 📊 | Pre-allocated budget | Set allocated amount |

## Quick Actions

### Create Task with Budget
1. Open project → **Add Task**
2. Fill details + **Task Budget** (required)
3. Save → Budget auto-updates ✅

### Change Project Budget Mode
1. Open project → **Edit Project**
2. Select **Budget Mode**
3. Fill mode-specific fields
4. Save → Recalculates immediately ✅

### Change Department Budget Mode
1. Departments page → Click department
2. **Edit** → Select **Budget Mode**
3. Fill mode-specific fields
4. Save → Recalculates immediately ✅

## Budget Flow

```
┌─────────────┐
│   TASK      │  User sets: $2,000
│   Budget    │
└──────┬──────┘
       │ Automatically calculates ↓
┌──────▼──────┐
│  PROJECT    │  Auto: Sum of tasks = $2,000
│   Budget    │  Fixed: Set amount = $5,000
└──────┬──────┘  Hybrid: Tasks + buffer = $2,500
       │         Capped: Tasks up to cap = $2,000
       │ Automatically calculates ↓
┌──────▼──────┐
│ DEPARTMENT  │  Auto: Sum of projects
│   Budget    │  Annual Cap: Fixed yearly amount
└─────────────┘  Allocated: Pre-set allocation
```

## Common Scenarios

| Scenario | Use This Mode | Set This |
|----------|---------------|----------|
| Regular project | Auto | Nothing (automatic) |
| Client contract $25K | Fixed | Fixed Budget: $25,000 |
| Need 15% buffer | Hybrid | Buffer: 15% of tasks |
| Max budget $10K | Capped | Cap: $10,000 |
| Annual dept budget | Annual Cap | Cap: yearly amount |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Budget not updating | Edit a task to trigger recalc |
| Budget seems wrong | Check mode & mode-specific values |
| Can't set budget | Check if in Fixed mode (ignores tasks) |
| Tasks exceed cap | Review tasks or increase cap |

## Key Fields

**Tasks:**
- `task_budget` - Budget for this task (required)

**Projects:**
- `project_budget_mode` - Auto/Fixed/Hybrid/Capped
- `project_budget` - Total budget (calculated or set)

**Departments:**
- `department_budget_mode` - Auto/Annual Cap/Allocated
- `department_annual_budget` - Total budget

## Tips

✅ **Always set task budgets** - Foundation of the system  
✅ **Choose right mode** - Match your scenario  
✅ **Use hybrid for contingency** - Add buffer for unknowns  
✅ **Track actual vs budget** - Monitor spending  

❌ **Don't forget task budgets** - Required for auto modes  
❌ **Don't mix modes unnecessarily** - Keep it simple  
❌ **Don't ignore cap warnings** - Review if exceeded  

---

**Need more details?** See full guide: `/docs/budget-system-guide.md`
