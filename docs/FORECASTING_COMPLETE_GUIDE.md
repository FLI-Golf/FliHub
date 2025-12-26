# FliHub 2026 Forecasting System - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Database Schema Updates](#database-schema-updates)
3. [Sample Data Examples](#sample-data-examples)
4. [Forecasting Algorithms](#forecasting-algorithms)
5. [API Endpoints](#api-endpoints)
6. [Report Routes](#report-routes)
7. [Implementation Steps](#implementation-steps)

---

## Overview

This guide provides complete implementation details for the FliHub 2026 forecasting system, including:
- Database schema updates with 9 new fields
- Sample 2024 baseline data and 2026 forecasts
- Forecasting algorithms and growth factors
- Report routes with filters and printable layouts
- Complete code examples

### Key Statistics from 2024 Data

```
Total Tasks: 63
Total Budget: $590,700
Total Income: $1,132,500
Net Profit: $541,800 (92% margin)

Quarterly Breakdown:
Q1: 5 tasks  | Budget: $9,000    | Income: $175,000
Q2: 4 tasks  | Budget: $200      | Income: $0
Q3: 44 tasks | Budget: $361,500  | Income: $947,500 ⭐
Q4: 10 tasks | Budget: $220,000  | Income: $10,000
```

---

## Database Schema Updates

### New Fields Required

Add these 9 fields to the `tasks` collection:

```json
{
  "fiscalYear": {
    "type": "number",
    "required": true,
    "default": 2024,
    "min": 2024,
    "max": 2030
  },
  "isForecast": {
    "type": "bool",
    "required": true,
    "default": false
  },
  "forecastConfidence": {
    "type": "select",
    "values": ["Low", "Medium", "High"],
    "default": "Medium"
  },
  "baselineTaskId": {
    "type": "text",
    "required": false,
    "note": "Reference to original 2024 task"
  },
  "actualBudget": {
    "type": "number",
    "required": false,
    "note": "Actual spending vs planned"
  },
  "actualIncome": {
    "type": "number",
    "required": false,
    "note": "Actual revenue vs projected"
  },
  "variance": {
    "type": "number",
    "required": false,
    "note": "Budget variance percentage"
  },
  "completionPercentage": {
    "type": "number",
    "min": 0,
    "max": 100,
    "default": 0
  },
  "notes": {
    "type": "editor",
    "required": false,
    "note": "Forecast assumptions and notes"
  }
}
```

### Update Track Enum

Add "Phase 3" to the track field:

```json
{
  "track": {
    "type": "select",
    "values": ["Phase 1", "Phase 2", "Phase 3", "Overall", "Other"]
  }
}
```

---

## Sample Data Examples

### 2024 Baseline Task Example

```json
{
  "id": "task_2024_001",
  "task": "Apparel and shopping cart added to the website",
  "subTasksChecklist": "Set up weekly meeting with Robert",
  "managers": "Dustin Dinsmore, Robert",
  "track": "Phase 1",
  "strategicGoal": "Revenue",
  "departments": "Technical",
  "quarters": "Q3",
  "startDate": "2024-09-26",
  "endDate": "2024-11-07",
  "budget": 15000,
  "income": 50000,
  "status": "Completed",
  "fiscalYear": 2024,
  "isForecast": false,
  "actualBudget": 14500,
  "actualIncome": 52000,
  "variance": -3.33,
  "completionPercentage": 100
}
```

### 2026 Forecasted Task Example

```json
{
  "id": "task_2026_001",
  "task": "Apparel and shopping cart enhancement - Phase 2",
  "subTasksChecklist": "Expand product line, integrate new payment gateway",
  "managers": "Dustin Dinsmore, Robert",
  "track": "Phase 2",
  "strategicGoal": "Revenue",
  "departments": "Technical",
  "quarters": "Q3",
  "startDate": "2026-09-26",
  "endDate": "2026-11-07",
  "budget": 18750,
  "income": 65000,
  "status": "Scheduled",
  "fiscalYear": 2026,
  "isForecast": true,
  "forecastConfidence": "High",
  "baselineTaskId": "task_2024_001",
  "notes": "Based on 2024 performance with 25% growth factor for revenue goals"
}
```

### Growth Calculation Example

```javascript
// 2024 Baseline
budget_2024 = $15,000
income_2024 = $50,000

// Growth Factors (Revenue strategic goal)
inflation_rate = 3%
budget_growth = 10%
income_growth = 30%

// 2026 Forecast
budget_2026 = $15,000 × 1.03 × 1.10 = $17,025
income_2026 = $50,000 × 1.03 × 1.30 = $66,950

// Rounded for presentation
budget_2026 = $17,000
income_2026 = $67,000
```

---

## Forecasting Algorithms

### Growth Factors by Strategic Goal

```typescript
const GROWTH_FACTORS = {
  'Company Growth': {
    budgetGrowth: 0.20,
    incomeGrowth: 0.25,
    confidence: 'Medium'
  },
  'Brand Awareness': {
    budgetGrowth: 0.15,
    incomeGrowth: 0.10,
    confidence: 'Medium'
  },
  'Revenue': {
    budgetGrowth: 0.10,
    incomeGrowth: 0.30,
    confidence: 'High'
  },
  'App': {
    budgetGrowth: 0.25,
    incomeGrowth: 0.40,
    confidence: 'Low'
  },
  'Managerial Tasks': {
    budgetGrowth: 0.05,
    incomeGrowth: 0.00,
    confidence: 'High'
  }
};

const INFLATION_RATE = 0.03; // 3% annual inflation
```

### Forecasting Function

```typescript
function forecastTask(baselineTask: Task, targetYear: number): Task {
  const yearDiff = targetYear - baselineTask.fiscalYear;
  const growthFactor = GROWTH_FACTORS[baselineTask.strategicGoal];
  
  // Calculate budget with inflation and growth
  const budgetMultiplier = Math.pow(
    (1 + INFLATION_RATE) * (1 + growthFactor.budgetGrowth),
    yearDiff
  );
  
  // Calculate income with growth
  const incomeMultiplier = Math.pow(
    (1 + INFLATION_RATE) * (1 + growthFactor.incomeGrowth),
    yearDiff
  );
  
  // Project dates forward
  const startDate = new Date(baselineTask.startDate);
  startDate.setFullYear(startDate.getFullYear() + yearDiff);
  
  const endDate = new Date(baselineTask.endDate);
  endDate.setFullYear(endDate.getFullYear() + yearDiff);
  
  return {
    ...baselineTask,
    id: `task_${targetYear}_${generateId()}`,
    task: `${baselineTask.task} - ${targetYear} Forecast`,
    budget: Math.round(baselineTask.budget * budgetMultiplier),
    income: Math.round(baselineTask.income * incomeMultiplier),
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    fiscalYear: targetYear,
    isForecast: true,
    forecastConfidence: growthFactor.confidence,
    baselineTaskId: baselineTask.id,
    status: 'Scheduled',
    actualBudget: null,
    actualIncome: null,
    variance: null,
    completionPercentage: 0,
    notes: `Forecasted from ${baselineTask.fiscalYear} baseline with ${growthFactor.budgetGrowth * 100}% budget growth and ${growthFactor.incomeGrowth * 100}% income growth`
  };
}
```

---

## API Endpoints

### 1. Generate Forecasts

**POST** `/api/forecasts/generate`

```typescript
// Request
{
  "baselineYear": 2024,
  "targetYear": 2026,
  "filters": {
    "quarters": ["Q1", "Q3"],
    "strategicGoals": ["Revenue", "Company Growth"],
    "departments": ["Technical", "Sales"]
  },
  "overrides": {
    "globalBudgetMultiplier": 1.15,
    "globalIncomeMultiplier": 1.20
  }
}

// Response
{
  "success": true,
  "forecastsGenerated": 45,
  "totalBudget": 699456,
  "totalIncome": 1302375,
  "netProfit": 602919,
  "forecasts": [...]
}
```

### 2. Get Report Data

**GET** `/api/reports/quarterly?year=2026&quarter=Q3`

```typescript
// Response
{
  "year": 2026,
  "quarter": "Q3",
  "summary": {
    "totalTasks": 48,
    "totalBudget": 428048,
    "totalIncome": 1089625,
    "netProfit": 661577,
    "profitMargin": 0.61
  },
  "byDepartment": [
    {
      "department": "Technical",
      "tasks": 15,
      "budget": 125000,
      "income": 350000
    }
  ],
  "byStrategicGoal": [...]
}
```

---

## Report Routes

### Route Structure

```
/dashboard/reports/
├── quarterly/          # Quarterly budget and income
├── timeline/           # Gantt chart view
├── strategic-goals/    # Progress by goal
├── departments/        # Department performance
├── variance/           # Forecast vs actual
└── forecast-generator/ # Generate new forecasts
```

### Example: Quarterly Report Page

**File:** `src/routes/dashboard/reports/quarterly/+page.svelte`

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import Chart from '$lib/components/charts/BarChart.svelte';
  import ExportButton from '$lib/components/reports/ExportButton.svelte';
  
  let { data } = $props();
  
  let selectedYear = $state(2026);
  let selectedQuarter = $state('Q3');
  let viewMode = $state<'chart' | 'table'>('chart');
</script>

<div class="report-container print:p-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-6 print:mb-4">
    <div>
      <h1 class="text-3xl font-bold">Quarterly Report</h1>
      <p class="text-muted-foreground">
        {selectedYear} {selectedQuarter}
      </p>
    </div>
    
    <div class="flex gap-2 print:hidden">
      <ExportButton format="pdf" data={data} />
      <ExportButton format="excel" data={data} />
    </div>
  </div>
  
  <!-- Filters -->
  <div class="filters-bar mb-6 print:hidden">
    <select bind:value={selectedYear}>
      <option value={2024}>2024</option>
      <option value={2025}>2025</option>
      <option value={2026}>2026</option>
    </select>
    
    <select bind:value={selectedQuarter}>
      <option value="Q1">Q1</option>
      <option value="Q2">Q2</option>
      <option value="Q3">Q3</option>
      <option value="Q4">Q4</option>
    </select>
  </div>
  
  <!-- Summary Cards -->
  <div class="grid grid-cols-4 gap-4 mb-6">
    <div class="stat-card">
      <h3>Total Tasks</h3>
      <p class="text-3xl font-bold">{data.summary.totalTasks}</p>
    </div>
    <div class="stat-card">
      <h3>Budget</h3>
      <p class="text-3xl font-bold">${data.summary.totalBudget.toLocaleString()}</p>
    </div>
    <div class="stat-card">
      <h3>Income</h3>
      <p class="text-3xl font-bold">${data.summary.totalIncome.toLocaleString()}</p>
    </div>
    <div class="stat-card">
      <h3>Net Profit</h3>
      <p class="text-3xl font-bold">${data.summary.netProfit.toLocaleString()}</p>
    </div>
  </div>
  
  <!-- Chart/Table Toggle -->
  <div class="tabs mb-4 print:hidden">
    <button 
      class:active={viewMode === 'chart'}
      onclick={() => viewMode = 'chart'}
    >
      Chart View
    </button>
    <button 
      class:active={viewMode === 'table'}
      onclick={() => viewMode = 'table'}
    >
      Table View
    </button>
  </div>
  
  <!-- Content -->
  {#if viewMode === 'chart'}
    <Chart data={data.chartData} />
  {:else}
    <table class="data-table">
      <thead>
        <tr>
          <th>Department</th>
          <th>Tasks</th>
          <th>Budget</th>
          <th>Income</th>
          <th>Net</th>
        </tr>
      </thead>
      <tbody>
        {#each data.byDepartment as dept}
          <tr>
            <td>{dept.department}</td>
            <td>{dept.tasks}</td>
            <td>${dept.budget.toLocaleString()}</td>
            <td>${dept.income.toLocaleString()}</td>
            <td>${(dept.income - dept.budget).toLocaleString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  @media print {
    .print\:hidden { display: none; }
    .report-container { 
      max-width: 100%;
      font-size: 10pt;
    }
  }
</style>
```

---

## Implementation Steps

### Step 1: Update Database Schema

```bash
# Run this script to update PocketBase schema
node scripts/update-tasks-schema.js
```

### Step 2: Import 2024 Baseline Data

```bash
# Import all 63 tasks from CSV
node scripts/import-2024-baseline.js
```

### Step 3: Generate 2026 Forecasts

```bash
# Generate forecasts for 2026
node scripts/generate-2026-forecasts.js
```

### Step 4: Create Report Routes

```bash
# Create all 6 report routes
mkdir -p src/routes/dashboard/reports/{quarterly,timeline,strategic-goals,departments,variance,forecast-generator}
```

### Step 5: Test Reports

```bash
# Run dev server and test each report
npm run dev
# Visit: http://localhost:5173/dashboard/reports/quarterly
```

---

## Next Steps

1. ✅ Review this documentation
2. ✅ Update PocketBase schema
3. ✅ Create forecasting service
4. ✅ Build report routes
5. ✅ Implement charts
6. ✅ Add PDF export
7. ✅ Test with real data
8. ✅ Deploy to production

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2024  
**Author:** FliHub Development Team
