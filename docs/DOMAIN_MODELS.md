# FliHub Domain Models

This document describes all domain models in FliHub with their Zod schemas for validation.

## Core Principles

- **Type Safety**: All models use TypeScript with Zod for runtime validation
- **Immutability**: Domain entities are immutable where appropriate
- **Validation**: All data is validated before persistence
- **Business Rules**: Domain logic is encapsulated in entity methods

## Models

### 1. Manager

Represents team members and their roles within the organization.

**Schema**: `ManagerSchema`

**Fields**:
- `id` (UUID, optional): Unique identifier
- `name` (string, required): Full name (1-255 characters)
- `department` (enum, required): One of:
  - Publicist
  - Sales
  - Product Development
  - Finance
  - Marketing and PR
  - Technical
  - Production
  - Consultant
  - Operations
  - Apparel
- `email` (email, optional): Contact email
- `phone` (string, optional): Contact phone
- `goals` (text, optional): Manager's goals and objectives
- `created` (date, auto): Creation timestamp
- `updated` (date, auto): Last update timestamp

**Business Rules**:
- Name must be unique within department
- Email must be valid format if provided
- Goals support markdown formatting

**Example**:
```typescript
const manager: ManagerInput = {
  name: "Andrew Panza",
  department: "Operations",
  email: "andrew@fligolf.com",
  goals: "Manage operations and partnerships"
};
```

---

### 2. Task

Represents business roadmap tasks with detailed tracking.

**Schema**: `TaskSchema`

**Fields**:
- `id` (UUID, optional): Unique identifier
- `task` (string, required): Task name (1-500 characters)
- `subTasksChecklist` (text, optional): Markdown checklist
- `managers` (string, optional): Assigned managers (comma-separated)
- `track` (enum, optional): Phase 1, Phase 2, Overall, Other
- `strategicGoal` (enum, optional): Company Growth, Brand Awareness, Revenue, etc.
- `departments` (string, optional): Related departments
- `quarters` (enum, optional): Q1, Q2, Q3, Q4
- `startDate` (date, optional): Task start date
- `endDate` (date, optional): Task end date
- `budget` (number, optional): Allocated budget (non-negative)
- `income` (number, optional): Expected income (non-negative)
- `status` (enum, required): In Progress, Scheduled, Completed, Cancelled
- `created` (date, auto): Creation timestamp
- `updated` (date, auto): Last update timestamp

**Business Rules**:
- Start date must be before or equal to end date
- Budget and income must be non-negative
- Sub-tasks support markdown checkboxes

**Example**:
```typescript
const task: TaskInput = {
  task: "Launch FLI Golf Brand Marketing",
  track: "Phase 1",
  strategicGoal: "Brand Awareness",
  departments: "Publicist",
  quarters: "Q3",
  startDate: new Date("2024-07-01"),
  endDate: new Date("2024-07-31"),
  status: "In Progress"
};
```

---

### 3. Broadcast Partner

Represents partnership opportunities and analysis points.

**Schema**: `BroadcastPartnerSchema`

**Fields**:
- `id` (UUID, optional): Unique identifier
- `point` (string, required): Main point or title
- `details` (text, required): Detailed description
- `type` (enum, required): Key Point, Supporting Point, Risk, Opportunity
- `category` (enum, required):
  - Broadcasting & Audience Growth
  - Viewer Engagement
  - Revenue Opportunities
  - Technology & Innovation
  - Brand Building
  - Operational Efficiency
  - Risk Management
- `importanceLevel` (enum, required): High, Medium, Low
- `tags` (string, optional): Comma-separated tags
- `additionalNotes` (text, optional): Extra notes
- `created` (date, auto): Creation timestamp
- `updated` (date, auto): Last update timestamp

**Business Rules**:
- Points are categorized for strategic analysis
- Importance level drives prioritization
- Tags enable cross-referencing

**Example**:
```typescript
const partner: BroadcastPartnerInput = {
  point: "Nationwide Reach",
  details: "FDSN's network ensures FLI Golf tournaments are broadcast to millions",
  type: "Key Point",
  category: "Broadcasting & Audience Growth",
  importanceLevel: "High",
  tags: "Visibility, Reach"
};
```

---

### 4. Marketing Models

#### Brand Positioning

**Schema**: `BrandPositioningSchema`

Defines brand identity and market position.

**Key Fields**:
- `name`: Brand/product name
- `keyDifferentiator`: What makes it unique
- `brandMessage`: Core messaging
- `coreValues`: Company values
- `targetAudience`: Primary audience

---

#### Budget

**Schema**: `BudgetSchema`

Tracks financial allocations and spending.

**Key Fields**:
- `departmentArea`: Budget owner
- `allocatedBudget`: Total allocation
- `spentBudget`: Amount spent
- `remainingBudget`: Calculated remaining

**Business Rules**:
- Spent budget cannot exceed allocated budget
- Remaining budget is auto-calculated

---

#### Business Objectives

**Schema**: `BusinessObjectiveSchema`

High-level business goals and targets.

**Key Fields**:
- `objectiveName`: Goal description
- `priorityLevel`: High, Medium, Low
- `status`: Not Started, In Progress, Completed, On Hold, Cancelled
- `targetDate`: Deadline
- `responsiblePerson`: Owner

---

#### Campaign

**Schema**: `CampaignSchema`

Marketing campaigns with timelines.

**Key Fields**:
- `name`: Campaign name
- `startDate`: Launch date
- `endDate`: End date

**Business Rules**:
- Start date must be before end date

---

#### Continuous Improvement

**Schema**: `ContinuousImprovementSchema`

Process improvement initiatives.

**Key Fields**:
- `areaOfImprovement`: What to improve
- `actionPlan`: How to improve
- `status`: Identified, In Progress, Implemented, Monitoring

---

#### Digital Marketing Strategy

**Schema**: `DigitalMarketingStrategySchema`

Digital channel strategies.

**Key Fields**:
- `channel`: Social Media, Email, SEO, PPC, etc.
- `description`: Strategy details
- `budgetAllocated`: Channel budget
- `status`: Progress status

---

#### Marketing Goals

**Schema**: `MarketingGoalSchema`

SMART marketing objectives.

**Key Fields**:
- `descriptionOfGoal`: Goal details
- `smartCriteria`: Specific, Measurable, Achievable, Relevant, Time-bound
- `dueDate`: Target completion
- `marketingMix`: Related mix elements

---

#### SWOT Analysis

**Schema**: `SWOTAnalysisSchema`

Strategic analysis framework.

**Key Fields**:
- `category`: Strength, Weakness, Opportunity, Threat
- `description`: Analysis details
- `impactLevel`: High, Medium, Low
- `actionPlan`: Response strategy

---

#### KPI (Key Performance Indicator)

**Schema**: `KPISchema`

Performance metrics and tracking.

**Key Fields**:
- `kpiDescription`: What is measured
- `targetValue`: Goal value
- `currentValue`: Actual value
- `analysisFrequency`: Daily, Weekly, Monthly, Quarterly, Annually

---

## Validation

All models use Zod for validation:

```typescript
import { ManagerSchema } from '$lib/domain/schemas';

// Validate input
const result = ManagerSchema.safeParse(data);

if (result.success) {
  // Data is valid
  const manager = result.data;
} else {
  // Handle validation errors
  console.error(result.error.errors);
}
```

## Type Inference

TypeScript types are automatically inferred from Zod schemas:

```typescript
import type { ManagerInput, TaskInput } from '$lib/domain/schemas';

const manager: ManagerInput = { /* ... */ };
const task: TaskInput = { /* ... */ };
```

## Database Mapping

All models map directly to PocketBase collections with the same field names (camelCase in code, snake_case in database).

See `src/lib/migrations/collections.ts` for complete collection definitions.
