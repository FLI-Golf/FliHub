# Implementation Guide: 2026 Forecasting & Reporting System

## Quick Start Checklist

### Phase 1: Database Setup (Day 1-2)

- [ ] **Update PocketBase Schema**
  - [ ] Add `fiscalYear` field to tasks collection
  - [ ] Add `isForecast` boolean field
  - [ ] Add `forecastConfidence` enum field
  - [ ] Add `baselineTaskId` reference field
  - [ ] Add `actualBudget` and `actualIncome` fields
  - [ ] Add `variance` and `completionPercentage` fields
  - [ ] Update track enum to include "Phase 3"
  - [ ] Create new indexes

- [ ] **Run Migration**
  ```bash
  npm run migrate
  ```

- [ ] **Import 2024 Data**
  ```bash
  npm run import-data
  ```

- [ ] **Verify Data**
  - [ ] Check all 63 tasks imported
  - [ ] Verify budget/income totals
  - [ ] Confirm dates are correct

### Phase 2: Forecasting Service (Day 3-5)

- [ ] **Create Service Files**
  - [ ] `src/lib/domain/services/ForecastingService.ts`
  - [ ] `src/lib/domain/services/ReportService.ts`
  - [ ] `src/lib/domain/services/ExportService.ts`

- [ ] **Implement Core Functions**
  - [ ] `generateForecast(baseYear, targetYear, options)`
  - [ ] `applyGrowthFactors(tasks, factors)`
  - [ ] `calculateConfidence(task)`
  - [ ] `projectDates(task, targetYear)`

- [ ] **Create API Endpoints**
  - [ ] `POST /api/forecast/generate`
  - [ ] `GET /api/forecast/preview`
  - [ ] `PUT /api/forecast/adjust/:id`

### Phase 3: UI Components (Day 6-8)

- [ ] **Forecast Generation Page**
  - [ ] Create `src/routes/dashboard/forecast/+page.svelte`
  - [ ] Add year selector (2024 → 2026)
  - [ ] Add growth factor inputs
  - [ ] Add preview table
  - [ ] Add generate button

- [ ] **Forecast Adjustment Interface**
  - [ ] Editable forecast table
  - [ ] Confidence level selector
  - [ ] Bulk edit capabilities
  - [ ] Save/Cancel actions

### Phase 4: Reporting System (Day 9-12)

- [ ] **Create Report Pages**
  - [ ] Budget Report (`/dashboard/reports/budget`)
  - [ ] Income Report (`/dashboard/reports/income`)
  - [ ] Timeline Report (`/dashboard/reports/timeline`)
  - [ ] Strategic Goals Report (`/dashboard/reports/strategic-goals`)
  - [ ] Department Report (`/dashboard/reports/departments`)
  - [ ] Variance Report (`/dashboard/reports/variance`)

- [ ] **Implement Filters**
  - [ ] Year selector
  - [ ] Quarter selector
  - [ ] Department multi-select
  - [ ] Strategic goal selector
  - [ ] Date range picker

- [ ] **Add Visualizations**
  - [ ] Bar charts (budget by quarter)
  - [ ] Line charts (trends)
  - [ ] Pie charts (distribution)
  - [ ] Gantt chart (timeline)

### Phase 5: Export & Print (Day 13-14)

- [ ] **Export Functionality**
  - [ ] PDF export with print layout
  - [ ] Excel export with formatting
  - [ ] CSV export for data analysis

- [ ] **Print Layouts**
  - [ ] Header with logo and title
  - [ ] Footer with page numbers
  - [ ] Print-friendly styling
  - [ ] Page breaks

### Phase 6: Testing & Refinement (Day 15)

- [ ] **Test Forecasting**
  - [ ] Generate 2026 forecasts
  - [ ] Verify calculations
  - [ ] Test edge cases

- [ ] **Test Reports**
  - [ ] All filters work correctly
  - [ ] Charts render properly
  - [ ] Export functions work
  - [ ] Print layouts are correct

- [ ] **Performance Testing**
  - [ ] Load time < 2 seconds
  - [ ] Report generation < 5 seconds
  - [ ] Export < 10 seconds

---

## Code Templates

### 1. Forecasting Service

```typescript
// src/lib/domain/services/ForecastingService.ts

import type { Task } from '$lib/domain/modules/projects';
import type PocketBase from 'pocketbase';

export interface ForecastOptions {
  baseYear: number;
  targetYear: number;
  growthFactors: GrowthFactors;
  includeQuarters?: string[];
  includeDepartments?: string[];
}

export interface GrowthFactors {
  budgetGrowth: number; // e.g., 1.15 for 15% growth
  incomeGrowth: number; // e.g., 1.20 for 20% growth
  inflationRate: number; // e.g., 1.03 for 3% inflation
  byStrategicGoal?: Record<string, { budget: number; income: number }>;
}

export class ForecastingService {
  constructor(private pb: PocketBase) {}

  async generateForecast(options: ForecastOptions): Promise<Task[]> {
    // 1. Load baseline tasks
    const baseTasks = await this.loadBaselineTasks(options.baseYear);
    
    // 2. Filter if needed
    const filteredTasks = this.filterTasks(baseTasks, options);
    
    // 3. Generate forecasts
    const forecasts = filteredTasks.map(task => 
      this.forecastTask(task, options)
    );
    
    // 4. Save to database
    await this.saveForecasts(forecasts);
    
    return forecasts;
  }

  private async loadBaselineTasks(year: number): Promise<Task[]> {
    const records = await this.pb.collection('tasks').getFullList({
      filter: `fiscalYear = "${year}" && isForecast = false`,
      sort: 'startDate'
    });
    
    return records.map(r => Task.fromRecord(r));
  }

  private forecastTask(baseTask: Task, options: ForecastOptions): Task {
    const yearDiff = options.targetYear - options.baseYear;
    
    // Project dates
    const startDate = new Date(baseTask.startDate);
    const endDate = new Date(baseTask.endDate);
    startDate.setFullYear(startDate.getFullYear() + yearDiff);
    endDate.setFullYear(endDate.getFullYear() + yearDiff);
    
    // Calculate budget
    const goalFactors = options.growthFactors.byStrategicGoal?.[baseTask.strategicGoal];
    const budgetGrowth = goalFactors?.budget || options.growthFactors.budgetGrowth;
    const budget = (baseTask.budget || 0) * options.growthFactors.inflationRate * budgetGrowth;
    
    // Calculate income
    const incomeGrowth = goalFactors?.income || options.growthFactors.incomeGrowth;
    const income = (baseTask.income || 0) * incomeGrowth;
    
    // Calculate confidence
    const confidence = this.calculateConfidence(baseTask);
    
    return Task.create({
      task: baseTask.task,
      subTasksChecklist: baseTask.subTasksChecklist,
      managers: baseTask.managers,
      track: baseTask.track,
      strategicGoal: baseTask.strategicGoal,
      departments: baseTask.departments,
      quarters: baseTask.quarters,
      startDate,
      endDate,
      budget: Math.round(budget),
      income: Math.round(income),
      status: 'Scheduled',
      fiscalYear: options.targetYear.toString(),
      isForecast: true,
      forecastConfidence: confidence,
      baselineTaskId: baseTask.id
    });
  }

  private calculateConfidence(task: Task): 'Low' | 'Medium' | 'High' {
    let score = 0;
    
    // Has budget data
    if (task.budget && task.budget > 0) score += 1;
    
    // Has income data
    if (task.income && task.income > 0) score += 1;
    
    // Has clear dates
    if (task.startDate && task.endDate) score += 1;
    
    // Has manager assigned
    if (task.managers) score += 1;
    
    // Strategic goal is revenue-focused
    if (['Revenue', 'Increase Revenue'].includes(task.strategicGoal)) score += 1;
    
    if (score >= 4) return 'High';
    if (score >= 2) return 'Medium';
    return 'Low';
  }

  private async saveForecasts(forecasts: Task[]): Promise<void> {
    for (const forecast of forecasts) {
      await this.pb.collection('tasks').create(forecast.toRecord());
    }
  }
}
```

### 2. Report Service

```typescript
// src/lib/domain/services/ReportService.ts

import type PocketBase from 'pocketbase';

export interface ReportFilters {
  fiscalYear?: string;
  quarter?: string;
  department?: string[];
  strategicGoal?: string;
  track?: string;
  startDate?: Date;
  endDate?: Date;
  isForecast?: boolean;
}

export interface BudgetReport {
  totalBudget: number;
  totalActual: number;
  variance: number;
  byQuarter: Record<string, number>;
  byDepartment: Record<string, number>;
  byStrategicGoal: Record<string, number>;
  tasks: Task[];
}

export class ReportService {
  constructor(private pb: PocketBase) {}

  async generateBudgetReport(filters: ReportFilters): Promise<BudgetReport> {
    const tasks = await this.loadTasks(filters);
    
    const report: BudgetReport = {
      totalBudget: 0,
      totalActual: 0,
      variance: 0,
      byQuarter: {},
      byDepartment: {},
      byStrategicGoal: {},
      tasks
    };
    
    for (const task of tasks) {
      const budget = task.budget || 0;
      const actual = task.actualBudget || 0;
      
      report.totalBudget += budget;
      report.totalActual += actual;
      
      // By quarter
      if (task.quarters) {
        report.byQuarter[task.quarters] = (report.byQuarter[task.quarters] || 0) + budget;
      }
      
      // By department
      if (task.departments) {
        const depts = task.departments.split(',').map(d => d.trim());
        for (const dept of depts) {
          report.byDepartment[dept] = (report.byDepartment[dept] || 0) + budget;
        }
      }
      
      // By strategic goal
      if (task.strategicGoal) {
        report.byStrategicGoal[task.strategicGoal] = 
          (report.byStrategicGoal[task.strategicGoal] || 0) + budget;
      }
    }
    
    report.variance = report.totalActual - report.totalBudget;
    
    return report;
  }

  private async loadTasks(filters: ReportFilters): Promise<Task[]> {
    const filterParts: string[] = [];
    
    if (filters.fiscalYear) {
      filterParts.push(`fiscalYear = "${filters.fiscalYear}"`);
    }
    
    if (filters.quarter) {
      filterParts.push(`quarters = "${filters.quarter}"`);
    }
    
    if (filters.isForecast !== undefined) {
      filterParts.push(`isForecast = ${filters.isForecast}`);
    }
    
    const filterString = filterParts.join(' && ');
    
    const records = await this.pb.collection('tasks').getFullList({
      filter: filterString || undefined,
      sort: 'startDate'
    });
    
    return records.map(r => Task.fromRecord(r));
  }
}
```

### 3. Forecast Page Component

```svelte
<!-- src/routes/dashboard/forecast/+page.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import Card from '$lib/components/ui/card.svelte';
  import { Select } from '$lib/components/ui/select';
  
  let baseYear = $state(2024);
  let targetYear = $state(2026);
  let budgetGrowth = $state(15);
  let incomeGrowth = $state(20);
  let generating = $state(false);
  let preview = $state<any[]>([]);
  
  async function generateForecast() {
    generating = true;
    
    try {
      const response = await fetch('/api/forecast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseYear,
          targetYear,
          growthFactors: {
            budgetGrowth: 1 + budgetGrowth / 100,
            incomeGrowth: 1 + incomeGrowth / 100,
            inflationRate: 1.03
          }
        })
      });
      
      const data = await response.json();
      preview = data.tasks;
    } catch (error) {
      console.error('Forecast generation failed:', error);
    } finally {
      generating = false;
    }
  }
</script>

<div class="max-w-7xl">
  <h1 class="text-3xl font-bold mb-6">Generate 2026 Forecast</h1>
  
  <Card class="p-6 mb-6">
    <h2 class="text-xl font-semibold mb-4">Forecast Parameters</h2>
    
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium mb-2">Base Year</label>
        <Select bind:value={baseYear}>
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
        </Select>
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">Target Year</label>
        <Select bind:value={targetYear}>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
          <option value={2027}>2027</option>
        </Select>
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">
          Budget Growth (%)
        </label>
        <input
          type="number"
          bind:value={budgetGrowth}
          class="w-full px-3 py-2 border rounded-md"
          min="0"
          max="100"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">
          Income Growth (%)
        </label>
        <input
          type="number"
          bind:value={incomeGrowth}
          class="w-full px-3 py-2 border rounded-md"
          min="0"
          max="100"
        />
      </div>
    </div>
    
    <Button
      onclick={generateForecast}
      disabled={generating}
      class="mt-4"
    >
      {generating ? 'Generating...' : 'Generate Forecast'}
    </Button>
  </Card>
  
  {#if preview.length > 0}
    <Card class="p-6">
      <h2 class="text-xl font-semibold mb-4">
        Preview: {preview.length} Tasks
      </h2>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left p-2">Task</th>
              <th class="text-left p-2">Quarter</th>
              <th class="text-right p-2">Budget</th>
              <th class="text-right p-2">Income</th>
              <th class="text-center p-2">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {#each preview as task}
              <tr class="border-b hover:bg-gray-50">
                <td class="p-2">{task.task}</td>
                <td class="p-2">{task.quarters}</td>
                <td class="p-2 text-right">
                  ${task.budget?.toLocaleString() || 0}
                </td>
                <td class="p-2 text-right">
                  ${task.income?.toLocaleString() || 0}
                </td>
                <td class="p-2 text-center">
                  <span class="px-2 py-1 rounded text-xs {
                    task.forecastConfidence === 'High' ? 'bg-green-100 text-green-800' :
                    task.forecastConfidence === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }">
                    {task.forecastConfidence}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>
  {/if}
</div>
```

### 4. Budget Report Component

```svelte
<!-- src/routes/dashboard/reports/budget/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Card from '$lib/components/ui/card.svelte';
  import { Button } from '$lib/components/ui/button';
  import BarChart from '$lib/components/charts/BarChart.svelte';
  
  let fiscalYear = $state('2026');
  let quarter = $state('');
  let report = $state<any>(null);
  let loading = $state(false);
  
  async function loadReport() {
    loading = true;
    
    try {
      const params = new URLSearchParams({
        year: fiscalYear,
        ...(quarter && { quarter })
      });
      
      const response = await fetch(`/api/reports/budget?${params}`);
      report = await response.json();
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      loading = false;
    }
  }
  
  async function exportPDF() {
    const response = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportType: 'budget',
        filters: { fiscalYear, quarter },
        data: report
      })
    });
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-report-${fiscalYear}.pdf`;
    a.click();
  }
  
  onMount(() => {
    loadReport();
  });
</script>

<div class="max-w-7xl">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Budget Report</h1>
    <Button onclick={exportPDF}>Export PDF</Button>
  </div>
  
  <!-- Filters -->
  <Card class="p-4 mb-6">
    <div class="flex gap-4">
      <select bind:value={fiscalYear} onchange={loadReport}>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
        <option value="2026">2026</option>
      </select>
      
      <select bind:value={quarter} onchange={loadReport}>
        <option value="">All Quarters</option>
        <option value="Q1">Q1</option>
        <option value="Q2">Q2</option>
        <option value="Q3">Q3</option>
        <option value="Q4">Q4</option>
      </select>
    </div>
  </Card>
  
  {#if loading}
    <div class="text-center py-12">Loading...</div>
  {:else if report}
    <!-- Summary Cards -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <Card class="p-6">
        <div class="text-sm text-gray-600">Total Budget</div>
        <div class="text-3xl font-bold">
          ${report.totalBudget.toLocaleString()}
        </div>
      </Card>
      
      <Card class="p-6">
        <div class="text-sm text-gray-600">Total Actual</div>
        <div class="text-3xl font-bold">
          ${report.totalActual.toLocaleString()}
        </div>
      </Card>
      
      <Card class="p-6">
        <div class="text-sm text-gray-600">Variance</div>
        <div class="text-3xl font-bold {
          report.variance >= 0 ? 'text-green-600' : 'text-red-600'
        }">
          ${Math.abs(report.variance).toLocaleString()}
        </div>
      </Card>
    </div>
    
    <!-- Charts -->
    <div class="grid grid-cols-2 gap-6">
      <Card class="p-6">
        <h2 class="text-xl font-semibold mb-4">Budget by Quarter</h2>
        <BarChart data={report.byQuarter} />
      </Card>
      
      <Card class="p-6">
        <h2 class="text-xl font-semibold mb-4">Budget by Department</h2>
        <BarChart data={report.byDepartment} />
      </Card>
    </div>
  {/if}
</div>
```

---

## Database Migration Script

```typescript
// src/lib/migrations/update-tasks-schema.ts

import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);

async function updateTasksCollection() {
  console.log('Updating tasks collection schema...');
  
  const collection = await pb.collections.getOne('tasks');
  
  // Add new fields
  collection.schema.push(
    {
      name: 'fiscalYear',
      type: 'text',
      required: true,
      options: { max: 4 }
    },
    {
      name: 'isForecast',
      type: 'bool',
      required: false,
      options: {}
    },
    {
      name: 'forecastConfidence',
      type: 'select',
      required: false,
      options: {
        maxSelect: 1,
        values: ['Low', 'Medium', 'High']
      }
    },
    {
      name: 'baselineTaskId',
      type: 'text',
      required: false
    },
    {
      name: 'actualBudget',
      type: 'number',
      required: false
    },
    {
      name: 'actualIncome',
      type: 'number',
      required: false
    },
    {
      name: 'variance',
      type: 'number',
      required: false
    },
    {
      name: 'completionPercentage',
      type: 'number',
      required: false,
      options: { min: 0, max: 100 }
    }
  );
  
  // Update track enum to include Phase 3
  const trackField = collection.schema.find(f => f.name === 'track');
  if (trackField && trackField.options) {
    trackField.options.values = ['Phase 1', 'Phase 2', 'Phase 3', 'Overall', 'Other'];
  }
  
  await pb.collections.update(collection.id, collection);
  
  console.log('✓ Tasks collection updated successfully');
}

updateTasksCollection().catch(console.error);
```

---

## Testing Checklist

### Unit Tests
- [ ] ForecastingService.generateForecast()
- [ ] ForecastingService.calculateConfidence()
- [ ] ReportService.generateBudgetReport()
- [ ] Date projection logic
- [ ] Growth factor calculations

### Integration Tests
- [ ] API endpoint /api/forecast/generate
- [ ] API endpoint /api/reports/budget
- [ ] Database queries with filters
- [ ] Export to PDF functionality

### E2E Tests
- [ ] Generate forecast workflow
- [ ] View budget report
- [ ] Apply filters and see updated data
- [ ] Export report to PDF
- [ ] Print report

### Performance Tests
- [ ] Load 100+ tasks in < 2 seconds
- [ ] Generate forecast for 60+ tasks in < 5 seconds
- [ ] Render charts with 50+ data points smoothly

---

## Deployment Checklist

- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Import 2024 baseline data
- [ ] Test forecasting in staging
- [ ] Test all reports in staging
- [ ] Verify exports work
- [ ] Check print layouts
- [ ] Performance test with production data
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Train users on new features

---

## Support & Maintenance

### Daily Tasks
- Monitor forecast accuracy
- Check for data anomalies
- Review user feedback

### Weekly Tasks
- Update forecasts with actuals
- Generate variance reports
- Adjust growth factors if needed

### Monthly Tasks
- Review forecast accuracy
- Update confidence levels
- Refine algorithms based on performance

### Quarterly Tasks
- Major forecast refresh
- Strategic planning review
- System performance optimization

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Implementation Guide
