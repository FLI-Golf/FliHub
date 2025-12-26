# Forecasting System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FliHub Forecasting System                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Data Sources   │      │  Processing      │      │   Outputs        │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                         │                         │
        ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ Business Roadmap │──────▶│  Import Service  │      │   Dashboard      │
│   CSV (2024)     │      │                  │      │   Reports        │
└──────────────────┘      └──────────────────┘      └──────────────────┘
                                  │                         ▲
                                  ▼                         │
                          ┌──────────────────┐             │
                          │   PocketBase     │             │
                          │   Database       │             │
                          │   - tasks        │             │
                          │   - managers     │             │
                          └──────────────────┘             │
                                  │                         │
                                  ▼                         │
                          ┌──────────────────┐             │
                          │  Forecasting     │             │
                          │  Service         │             │
                          │  - Algorithms    │             │
                          │  - Growth Models │             │
                          └──────────────────┘             │
                                  │                         │
                                  ▼                         │
                          ┌──────────────────┐             │
                          │  2026 Forecasts  │─────────────┘
                          │  (Generated)     │
                          └──────────────────┘
```

## Data Model Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Database Schema                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                            TASKS                                  │
├──────────────────────────────────────────────────────────────────┤
│ PK: id (string)                                                   │
│ ─────────────────────────────────────────────────────────────── │
│ task (text) *required                                            │
│ subTasksChecklist (editor)                                       │
│ managers (text) ──────────────┐                                  │
│ track (enum)                  │                                  │
│ strategicGoal (enum)          │                                  │
│ departments (text) ───────┐   │                                  │
│ quarters (enum)           │   │                                  │
│ startDate (date)          │   │                                  │
│ endDate (date)            │   │                                  │
│ budget (number)           │   │                                  │
│ income (number)           │   │                                  │
│ status (enum) *required   │   │                                  │
│ ─────────────────────────────────────────────────────────────── │
│ NEW FIELDS FOR FORECASTING:   │   │                              │
│ fiscalYear (text) *required   │   │                              │
│ isForecast (boolean)          │   │                              │
│ forecastConfidence (enum)     │   │                              │
│ baselineTaskId (text) ────────┼───┼──┐ (self-reference)          │
│ actualBudget (number)         │   │  │                           │
│ actualIncome (number)         │   │  │                           │
│ variance (number)             │   │  │                           │
│ completionPercentage (number) │   │  │                           │
│ notes (editor)                │   │  │                           │
│ tags (text)                   │   │  │                           │
└───────────────────────────────┼───┼──┼───────────────────────────┘
                                │   │  │
                                │   │  └──────┐
                                │   │         │
                                ▼   ▼         ▼
┌──────────────────────────────────────────────────────────────────┐
│                          MANAGERS                                 │
├──────────────────────────────────────────────────────────────────┤
│ PK: id (string)                                                   │
│ ─────────────────────────────────────────────────────────────── │
│ name (text) *required                                            │
│ department (enum) *required                                      │
│ email (email)                                                    │
│ phone (text)                                                     │
│ goals (editor)                                                   │
└──────────────────────────────────────────────────────────────────┘
                                │
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        DEPARTMENTS                                │
├──────────────────────────────────────────────────────────────────┤
│ - Publicist                                                       │
│ - Sales                                                           │
│ - Product Development                                             │
│ - Finance                                                         │
│ - Marketing and PR                                                │
│ - Technical                                                       │
│ - Production                                                      │
│ - Consultant                                                      │
│ - Operations                                                      │
│ - Apparel                                                         │
└──────────────────────────────────────────────────────────────────┘
```

## Forecasting Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Forecasting Process Flow                          │
└─────────────────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────────────┐
│ 1. Load 2024 Baseline   │
│    - Filter by year     │
│    - Exclude forecasts  │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│ 2. Select Parameters    │
│    - Target year: 2026  │
│    - Growth rates       │
│    - Confidence levels  │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│ 3. Apply Algorithms     │
│    For each task:       │
│    ├─ Project dates     │
│    ├─ Calculate budget  │
│    ├─ Calculate income  │
│    └─ Set confidence    │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│ 4. Manual Adjustments   │
│    - Review forecasts   │
│    - Override values    │
│    - Add/remove tasks   │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│ 5. Validation           │
│    - Check totals       │
│    - Verify dates       │
│    - Validate logic     │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│ 6. Save to Database     │
│    - Mark as forecast   │
│    - Link to baseline   │
│    - Set fiscal year    │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│ 7. Generate Reports     │
│    - Budget summary     │
│    - Income projection  │
│    - Timeline view      │
└─────────────────────────┘
  │
  ▼
END
```

## Report Generation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Report Generation System                        │
└─────────────────────────────────────────────────────────────────────┘

User Request
  │
  ▼
┌─────────────────────────┐
│ Report Controller       │
│ - Parse filters         │
│ - Validate parameters   │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│ Data Aggregation        │
│ - Query database        │
│ - Apply filters         │
│ - Calculate metrics     │
└─────────────────────────┘
  │
  ├──────────────┬──────────────┬──────────────┬──────────────┐
  ▼              ▼              ▼              ▼              ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Budget   │ │ Income   │ │ Timeline │ │Strategic │ │Department│
│ Report   │ │ Report   │ │ Report   │ │  Goals   │ │  Report  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
  │              │              │              │              │
  └──────────────┴──────────────┴──────────────┴──────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Visualization Engine  │
                    │ - Charts              │
                    │ - Tables              │
                    │ - Graphs              │
                    └───────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌───────────────┐       ┌───────────────┐
            │ Web Dashboard │       │ Export Engine │
            │ - Interactive │       │ - PDF         │
            │ - Real-time   │       │ - Excel       │
            └───────────────┘       │ - CSV         │
                                    └───────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Frontend Components                             │
└─────────────────────────────────────────────────────────────────────┘

src/routes/dashboard/
│
├── forecast/
│   ├── +page.svelte ──────────────┐ Main forecast page
│   ├── +page.server.ts            │ Server-side data loading
│   ├── components/                │
│   │   ├── ForecastGenerator.svelte   Generate forecasts UI
│   │   ├── ForecastPreview.svelte     Preview before saving
│   │   ├── GrowthFactorEditor.svelte  Edit growth rates
│   │   └── ConfidenceIndicator.svelte Show confidence levels
│   └── [id]/
│       ├── +page.svelte              Edit single forecast
│       └── +page.server.ts
│
├── reports/
│   ├── +layout.svelte ───────────────┐ Shared report layout
│   ├── +layout.server.ts             │
│   ├── budget/
│   │   ├── +page.svelte              │ Budget report
│   │   └── +page.server.ts           │
│   ├── income/
│   │   ├── +page.svelte              │ Income report
│   │   └── +page.server.ts           │
│   ├── timeline/
│   │   ├── +page.svelte              │ Timeline/Gantt
│   │   └── +page.server.ts           │
│   ├── strategic-goals/
│   │   ├── +page.svelte              │ Goals report
│   │   └── +page.server.ts           │
│   ├── departments/
│   │   ├── +page.svelte              │ Department report
│   │   └── +page.server.ts           │
│   └── variance/
│       ├── +page.svelte              │ Variance analysis
│       └── +page.server.ts           │
│
└── tasks/
    ├── +page.svelte ─────────────────┐ Task list view
    ├── +page.server.ts               │
    └── [id]/
        ├── +page.svelte              │ Task detail/edit
        └── +page.server.ts           │

┌─────────────────────────────────────────────────────────────────────┐
│                      Backend Services                                │
└─────────────────────────────────────────────────────────────────────┘

src/lib/domain/services/
│
├── ForecastingService.ts ────────────┐ Core forecasting logic
│   ├── generateForecast()            │
│   ├── applyGrowthFactors()          │
│   ├── calculateConfidence()         │
│   ├── projectDates()                │
│   └── saveForecasts()               │
│
├── ReportService.ts ─────────────────┐ Report generation
│   ├── generateBudgetReport()        │
│   ├── generateIncomeReport()        │
│   ├── generateTimelineReport()      │
│   ├── generateGoalsReport()         │
│   ├── generateDepartmentReport()    │
│   └── generateVarianceReport()      │
│
└── ExportService.ts ─────────────────┐ Export functionality
    ├── exportToPDF()                 │
    ├── exportToExcel()               │
    ├── exportToCSV()                 │
    └── exportToJSON()                │

┌─────────────────────────────────────────────────────────────────────┐
│                      Shared Components                               │
└─────────────────────────────────────────────────────────────────────┘

src/lib/components/
│
├── reports/
│   ├── ReportFilters.svelte ─────────┐ Filter UI component
│   ├── ChartContainer.svelte         │ Chart wrapper
│   ├── DataTable.svelte              │ Sortable table
│   ├── ExportButton.svelte           │ Export dropdown
│   ├── PrintButton.svelte            │ Print layout
│   └── DateRangePicker.svelte        │ Date selection
│
├── charts/
│   ├── BarChart.svelte               │ Bar chart
│   ├── LineChart.svelte              │ Line chart
│   ├── PieChart.svelte               │ Pie chart
│   ├── GanttChart.svelte             │ Gantt timeline
│   └── HeatMap.svelte                │ Heatmap
│
└── ui/
    ├── Card.svelte                   │ Card container
    ├── Button.svelte                 │ Button component
    ├── Select.svelte                 │ Dropdown select
    └── Input.svelte                  │ Input field
```

## API Endpoints

```
┌─────────────────────────────────────────────────────────────────────┐
│                         API Routes                                   │
└─────────────────────────────────────────────────────────────────────┘

/api/
│
├── forecast/
│   ├── POST   /generate              Generate forecasts
│   │          Body: { baseYear, targetYear, options }
│   │          Response: { tasks[], summary }
│   │
│   ├── GET    /preview               Preview forecasts
│   │          Query: ?year=2026&quarter=Q1
│   │          Response: { tasks[], totals }
│   │
│   ├── PUT    /adjust/:id            Adjust single forecast
│   │          Body: { budget, income, confidence }
│   │          Response: { task }
│   │
│   └── DELETE /clear                 Clear forecasts
│            Query: ?year=2026
│            Response: { deleted: number }
│
├── reports/
│   ├── GET    /budget                Budget report data
│   │          Query: ?year=2026&quarter=Q1&department=Sales
│   │          Response: { totals, byDepartment, byQuarter }
│   │
│   ├── GET    /income                Income report data
│   │          Query: ?year=2026&goal=Revenue
│   │          Response: { totals, byGoal, byQuarter }
│   │
│   ├── GET    /timeline              Timeline data
│   │          Query: ?start=2026-01-01&end=2026-12-31
│   │          Response: { tasks[], milestones[] }
│   │
│   ├── GET    /strategic-goals       Goals report data
│   │          Query: ?year=2026
│   │          Response: { byGoal[], progress[] }
│   │
│   ├── GET    /departments           Department report data
│   │          Query: ?year=2026&quarter=Q1
│   │          Response: { byDepartment[], metrics[] }
│   │
│   └── GET    /variance              Variance analysis data
│            Query: ?year=2026&threshold=10
│            Response: { variances[], summary }
│
├── export/
│   ├── POST   /pdf                   Export to PDF
│   │          Body: { reportType, filters, data }
│   │          Response: Blob (application/pdf)
│   │
│   ├── POST   /excel                 Export to Excel
│   │          Body: { reportType, filters, data }
│   │          Response: Blob (application/vnd.ms-excel)
│   │
│   └── POST   /csv                   Export to CSV
│            Body: { reportType, filters, data }
│            Response: Blob (text/csv)
│
└── tasks/
    ├── GET    /                      List tasks
    │          Query: ?year=2026&status=Scheduled&page=1
    │          Response: { items[], totalItems, page, perPage }
    │
    ├── GET    /:id                   Get single task
    │          Response: { task }
    │
    ├── POST   /                      Create task
    │          Body: { task, budget, income, ... }
    │          Response: { task }
    │
    ├── PUT    /:id                   Update task
    │          Body: { budget, income, status, ... }
    │          Response: { task }
    │
    ├── DELETE /:id                   Delete task
    │          Response: { success: true }
    │
    └── POST   /bulk-update           Bulk update tasks
             Body: { tasks[] }
             Response: { updated: number }
```

## Data Transformation Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Data Transformation Flow                           │
└─────────────────────────────────────────────────────────────────────┘

CSV Row (2024)
  │
  │ { Task: "Begin PR Strategy",
  │   Budget: "$15,000.00",
  │   Income: "$50,000.00",
  │   Quarters: "Q3",
  │   "Start Date": "9/28/2024" }
  │
  ▼
┌─────────────────────────┐
│ CSV Parser              │
│ - Parse dates           │
│ - Parse currency        │
│ - Split multi-values    │
└─────────────────────────┘
  │
  ▼
Task Object (2024)
  │
  │ { task: "Begin PR Strategy",
  │   budget: 15000,
  │   income: 50000,
  │   quarters: "Q3",
  │   startDate: Date(2024-09-28),
  │   fiscalYear: "2024",
  │   isForecast: false }
  │
  ▼
┌─────────────────────────┐
│ Forecasting Engine      │
│ - Apply growth factors  │
│ - Project dates         │
│ - Calculate confidence  │
└─────────────────────────┘
  │
  ▼
Forecasted Task (2026)
  │
  │ { task: "Begin PR Strategy",
  │   budget: 17250,        // +15%
  │   income: 60000,        // +20%
  │   quarters: "Q3",
  │   startDate: Date(2026-09-28),
  │   fiscalYear: "2026",
  │   isForecast: true,
  │   forecastConfidence: "Medium",
  │   baselineTaskId: "abc123" }
  │
  ▼
┌─────────────────────────┐
│ Database (PocketBase)   │
│ - Validate              │
│ - Save                  │
│ - Index                 │
└─────────────────────────┘
  │
  ▼
┌─────────────────────────┐
│ Report Aggregation      │
│ - Group by quarter      │
│ - Sum totals            │
│ - Calculate metrics     │
└─────────────────────────┘
  │
  ▼
Report Data
  │
  │ { quarter: "Q3",
  │   year: "2026",
  │   totalBudget: 415725,
  │   totalIncome: 1137000,
  │   tasks: 51,
  │   confidence: "Medium" }
  │
  ▼
┌─────────────────────────┐
│ Visualization           │
│ - Render charts         │
│ - Format tables         │
│ - Apply styling         │
└─────────────────────────┘
  │
  ▼
Dashboard / PDF
```

## Security & Permissions

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Access Control Matrix                           │
└─────────────────────────────────────────────────────────────────────┘

Role: Admin
  ├── View all tasks (2024, 2025, 2026)          ✓
  ├── Create/Edit/Delete tasks                   ✓
  ├── Generate forecasts                         ✓
  ├── Adjust forecast parameters                 ✓
  ├── View all reports                           ✓
  ├── Export reports (PDF, Excel, CSV)           ✓
  └── Manage users and permissions               ✓

Role: Leader (Manager)
  ├── View tasks in their department             ✓
  ├── Edit tasks assigned to them                ✓
  ├── View forecasts                             ✓
  ├── View reports (filtered to department)      ✓
  ├── Export reports                             ✓
  └── Generate forecasts                         ✗

Role: Viewer
  ├── View tasks (read-only)                     ✓
  ├── View reports (read-only)                   ✓
  ├── Export reports                             ✓
  └── Edit/Create tasks                          ✗

PocketBase Rules:
  tasks:
    listRule:   @request.auth.id != ""
    viewRule:   @request.auth.id != ""
    createRule: @request.auth.role = "admin" || @request.auth.role = "leader"
    updateRule: @request.auth.role = "admin" || @request.auth.role = "leader"
    deleteRule: @request.auth.role = "admin"
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Performance Strategies                            │
└─────────────────────────────────────────────────────────────────────┘

Database Level:
  ├── Indexes on frequently queried fields
  │   ├── idx_tasks_fiscal_year
  │   ├── idx_tasks_quarters
  │   ├── idx_tasks_status
  │   └── idx_tasks_dates (startDate, endDate)
  │
  ├── Pagination (50 items per page)
  │
  └── Query optimization
      ├── Filter at database level
      ├── Use expand for relations
      └── Limit fields in response

Application Level:
  ├── Caching
  │   ├── Cache report data (5 min TTL)
  │   ├── Cache aggregations
  │   └── Cache static data (departments, enums)
  │
  ├── Lazy loading
  │   ├── Load charts on demand
  │   ├── Infinite scroll for task lists
  │   └── Defer non-critical data
  │
  └── Debouncing
      ├── Search input (300ms)
      ├── Filter changes (500ms)
      └── Auto-save (1000ms)

Frontend Level:
  ├── Code splitting
  │   ├── Route-based splitting
  │   ├── Component lazy loading
  │   └── Dynamic imports
  │
  ├── Virtual scrolling for large lists
  │
  └── Optimistic UI updates
      ├── Instant feedback
      ├── Background sync
      └── Rollback on error
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Error Handling Strategy                         │
└─────────────────────────────────────────────────────────────────────┘

Validation Errors:
  ├── Client-side validation (Zod schemas)
  ├── Server-side validation (double-check)
  ├── User-friendly error messages
  └── Field-level error indicators

Database Errors:
  ├── Connection failures → Retry with exponential backoff
  ├── Constraint violations → Show specific error
  ├── Timeout errors → Show loading state, retry
  └── Not found errors → Redirect to 404 page

Forecasting Errors:
  ├── Invalid baseline data → Show warning, skip task
  ├── Calculation errors → Use fallback values
  ├── Missing required fields → Prompt user
  └── Confidence too low → Flag for review

Report Generation Errors:
  ├── No data found → Show empty state
  ├── Export failures → Retry, show error toast
  ├── Chart rendering errors → Show table fallback
  └── Timeout → Show partial results

User Feedback:
  ├── Toast notifications for success/error
  ├── Loading spinners for async operations
  ├── Progress bars for long operations
  └── Error boundaries for component crashes
```

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Architecture Design
