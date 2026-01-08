# Manual Schema Update Guide

Since the PocketBase API isn't cooperating, here's how to manually add fields via the Admin UI.

## For each collection, add these fields:

### 1. brand_positioning

1. Go to Collections → brand_positioning → Fields
2. Click "New field" for each:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| title | Text | Yes | Min: 1, Max: 255 |
| description | Editor | No | - |
| category | Select | Yes | Values: Mission, Vision, Values, Target Audience, Unique Value Proposition, Brand Personality, Competitive Advantage |
| priority | Select | No | Values: High, Medium, Low |
| status | Select | Yes | Values: Draft, Active, Under Review, Archived |

---

### 2. budgets

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| departmentArea | Text | Yes | Min: 1, Max: 255 |
| fiscalYear | Number | Yes | Min: 2020, Max: 2100, No decimal |
| quarter | Select | No | Values: Q1, Q2, Q3, Q4 |
| allocatedAmount | Number | Yes | Min: 0 |
| spentAmount | Number | No | Min: 0 |
| remainingAmount | Number | No | - |
| notes | Editor | No | - |

---

### 3. business_objectives

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| objective | Text | Yes | Min: 1, Max: 500 |
| description | Editor | No | - |
| category | Select | Yes | Values: Revenue Growth, Market Expansion, Operational Efficiency, Customer Satisfaction, Brand Awareness, Innovation, Sustainability |
| targetDate | Date | No | - |
| status | Select | Yes | Values: Not Started, In Progress, On Track, At Risk, Completed, Cancelled |
| progress | Number | No | Min: 0, Max: 100, No decimal |
| keyResults | Editor | No | - |

---

### 4. campaigns

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| name | Text | Yes | Min: 1, Max: 255 |
| description | Editor | No | - |
| type | Select | Yes | Values: Marketing, Sales, Product Launch, Brand Awareness, Lead Generation, Customer Retention, Event |
| startDate | Date | No | - |
| endDate | Date | No | - |
| budget | Number | No | Min: 0 |
| actualSpend | Number | No | Min: 0 |
| status | Select | Yes | Values: Planning, Active, Paused, Completed, Cancelled |
| targetAudience | Text | No | Max: 500 |
| goals | Editor | No | - |
| metrics | Editor | No | - |

---

### 5. continuous_improvements

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| title | Text | Yes | Min: 1, Max: 255 |
| description | Editor | No | - |
| category | Select | Yes | Values: Process Improvement, Quality Enhancement, Cost Reduction, Time Efficiency, Customer Experience, Technology Upgrade, Training & Development |
| currentState | Editor | No | - |
| proposedSolution | Editor | No | - |
| expectedBenefit | Editor | No | - |
| status | Select | Yes | Values: Proposed, Under Review, Approved, In Progress, Implemented, Rejected |
| implementationDate | Date | No | - |
| priority | Select | No | Values: High, Medium, Low |

---

### 6. digital_marketing_strategies

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| strategyName | Text | Yes | Min: 1, Max: 255 |
| description | Editor | No | - |
| channel | Select | Yes | Values: Social Media, Email Marketing, Content Marketing, SEO, PPC, Influencer Marketing, Video Marketing, Affiliate Marketing |
| targetAudience | Text | No | Max: 500 |
| objectives | Editor | No | - |
| kpis | Editor | No | - |
| budget | Number | No | Min: 0 |
| status | Select | Yes | Values: Planning, Active, Paused, Completed, Archived |
| startDate | Date | No | - |
| endDate | Date | No | - |

---

### 7. marketing_goals

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| goalName | Text | Yes | Min: 1, Max: 255 |
| description | Editor | No | - |
| category | Select | Yes | Values: Brand Awareness, Lead Generation, Customer Acquisition, Customer Retention, Revenue Growth, Market Share, Engagement |
| targetMetric | Text | No | Max: 255 |
| targetValue | Number | No | - |
| currentValue | Number | No | - |
| deadline | Date | No | - |
| status | Select | Yes | Values: Not Started, In Progress, On Track, At Risk, Achieved, Missed |
| priority | Select | No | Values: High, Medium, Low |

---

### 8. swot_analysis

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| title | Text | Yes | Min: 1, Max: 255 |
| type | Select | Yes | Values: Strength, Weakness, Opportunity, Threat |
| description | Editor | No | - |
| category | Select | No | Values: Market, Product, Operations, Financial, Technology, Human Resources, Brand, Competition |
| impact | Select | No | Values: High, Medium, Low |
| actionItems | Editor | No | - |
| status | Select | Yes | Values: Identified, Under Review, Action Planned, In Progress, Addressed, Monitoring |

---

## Important Notes:

- **DO NOT delete the existing `id` field** - it's a system field required by PocketBase
- Add fields one at a time using the "New field" button
- For Select fields, add values separated by commas or one per line
- For Number fields with "No decimal", check the "Only integers" option
- All collections already have the correct API Rules set

## Estimated Time:
- About 5-10 minutes per collection
- Total: ~40-60 minutes for all 8 collections

Would you like me to create a simpler alternative, like just doing the most important collections first (campaigns, budgets, business_objectives)?
