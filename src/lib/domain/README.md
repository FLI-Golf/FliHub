# Domain Layer - OOP Architecture

This directory contains the business logic layer using Object-Oriented Programming principles.

## Architecture Overview

```
domain/
├── models/          # Domain entities (Campaign, Expense)
├── repositories/    # Data access interfaces
├── services/        # Business logic managers
├── factories/       # Object creation patterns
├── providers/       # Data aggregation and analytics
├── reports/         # Report generation
├── contracts/       # Contract generation
└── schemas/         # Zod validation schemas
```

## Design Patterns

### 1. **Entity Pattern** (models/)
Domain entities represent core business objects with behavior.

```typescript
import { Campaign } from '$lib/domain/models';

const campaign = Campaign.fromJSON(data);
const variance = campaign.getVariance();
const isOverBudget = campaign.isOverBudget();
```

### 2. **Repository Pattern** (repositories/)
Abstracts data access, allowing different implementations (PocketBase, API, mock).

```typescript
import type { ICampaignRepository } from '$lib/domain/repositories';

class PocketBaseCampaignRepository implements ICampaignRepository {
  async getById(id: string): Promise<Campaign | null> {
    // Implementation
  }
}
```

### 3. **Service/Manager Pattern** (services/)
Encapsulates business logic and orchestrates operations.

```typescript
import { CampaignManager } from '$lib/domain/services';

const campaignManager = new CampaignManager(campaignRepo, expenseRepo);

// Create campaign
const campaign = await campaignManager.createCampaign({
  name: 'Q1 2024 Marketing',
  type: 'campaign',
  managerId: 'user123',
  forecastedExpenses: 50000
});

// Submit for approval
await campaignManager.submitForApproval(campaign.id);

// Approve
await campaignManager.approveCampaign(campaign.id, 'approver123');

// Track expenses
await campaignManager.syncActualExpenses(campaign.id);
```

### 4. **Factory Pattern** (factories/)
Creates objects with proper defaults and validation.

```typescript
import { CampaignFactory } from '$lib/domain/factories';

// Create quarterly campaign
const campaign = CampaignFactory.createQuarterlyCampaign({
  name: 'Q1 Marketing',
  type: 'campaign',
  managerId: 'user123',
  quarter: 1,
  year: 2024,
  forecastedExpenses: 50000
});

// Create from template
const newCampaign = CampaignFactory.createFromTemplate(existingCampaign, {
  name: 'Q2 Marketing',
  quarter: 2
});
```

### 5. **Provider Pattern** (providers/)
Aggregates and provides data for reporting and analytics.

```typescript
import { CampaignProvider } from '$lib/domain/providers';

const provider = new CampaignProvider(campaignRepo, expenseRepo);

// Get summary statistics
const summary = await provider.getCampaignSummary('manager123');

// Get performance metrics
const metrics = await provider.getCampaignPerformanceMetrics('campaign123');

// Get campaigns needing attention
const attention = await provider.getCampaignsNeedingAttention();
```

### 6. **Report Generator Pattern** (reports/)
Generates various reports for campaigns and expenses.

```typescript
import { CampaignReportGenerator } from '$lib/domain/reports';

const reportGen = new CampaignReportGenerator(provider, expenseRepo);

// Generate campaign report
const report = await reportGen.generateCampaignReport('campaign123', {
  includeExpenses: true,
  generatedBy: 'user123'
});

// Generate financial report
const financial = await reportGen.generateFinancialReport('campaign123');

// Generate manager summary
const managerReport = await reportGen.generateManagerSummaryReport('manager123');

// Export to CSV
const csv = reportGen.exportToCSV(campaigns);
```

### 7. **Contract Generator Pattern** (contracts/)
Generates legal contracts and agreements.

```typescript
import { ContractGenerator } from '$lib/domain/contracts';

const contractGen = new ContractGenerator();

// Generate budget approval contract
const budgetContract = contractGen.generateBudgetApprovalContract({
  campaign,
  parties: {
    organization: 'FLI Golf',
    representative: 'John Doe',
    email: 'john@fligolf.com'
  }
});

// Generate vendor service agreement
const vendorContract = contractGen.generateVendorServiceAgreement({
  campaign,
  parties: { /* ... */ },
  vendor: {
    name: 'ABC Services',
    representative: 'Jane Smith'
  },
  terms: {
    paymentTerms: 'Net 30',
    deliverables: ['Service 1', 'Service 2']
  }
});

// Export to HTML
const html = contractGen.exportToHTML(budgetContract);
```

## Usage Examples

### Complete Campaign Workflow

```typescript
import { 
  CampaignManager, 
  ExpenseManager,
  CampaignFactory,
  CampaignProvider,
  CampaignReportGenerator,
  ContractGenerator
} from '$lib/domain';

// 1. Create campaign
const campaignData = CampaignFactory.createQuarterlyCampaign({
  name: 'Q1 2024 Marketing Campaign',
  type: 'campaign',
  managerId: 'manager123',
  quarter: 1,
  year: 2024,
  expenseCategories: {
    marketing: 20000,
    travel: 10000,
    equipment: 5000
  }
});

const campaign = await campaignManager.createCampaign(campaignData);

// 2. Generate budget approval contract
const contract = contractGen.generateBudgetApprovalContract({
  campaign,
  parties: {
    organization: 'FLI Golf',
    representative: 'Manager Name'
  }
});

// 3. Submit for approval
await campaignManager.submitForApproval(campaign.id);

// 4. Approve campaign
await campaignManager.approveCampaign(campaign.id, 'approver123');

// 5. Start campaign
await campaignManager.startCampaign(campaign.id);

// 6. Submit expenses
await expenseManager.submitExpense({
  description: 'Conference booth',
  amount: 5000,
  category: 'marketing',
  date: new Date(),
  projectId: campaign.id,
  submittedBy: 'user123'
});

// 7. Approve expenses
await expenseManager.approveExpense('expense123', 'approver123');

// 8. Sync actual expenses
await campaignManager.syncActualExpenses(campaign.id);

// 9. Generate reports
const report = await reportGen.generateCampaignReport(campaign.id);
const financial = await reportGen.generateFinancialReport(campaign.id);

// 10. Complete campaign
await campaignManager.completeCampaign(campaign.id);

// 11. Generate final report
const finalReport = await reportGen.generateCampaignReport(campaign.id, {
  includeExpenses: true
});
```

### Manager Dashboard

```typescript
// Get manager's campaign summary
const summary = await provider.getCampaignSummary('manager123');

// Get campaigns needing attention
const attention = await provider.getCampaignsNeedingAttention('manager123');

// Generate manager report
const managerReport = await reportGen.generateManagerSummaryReport('manager123');

// Export to CSV
const csv = reportGen.exportToCSV(summary.campaigns);
```

### Fiscal Year Reporting

```typescript
// Get fiscal year data
const fyReport = await reportGen.generateFiscalYearReport('2024');

// Get expense breakdown
const breakdown = await provider.getExpenseBreakdownByCategory();

// Export to JSON
const json = reportGen.exportToJSON(fyReport);
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a specific responsibility
2. **Testability**: Easy to mock repositories and test business logic
3. **Maintainability**: Changes to data source don't affect business logic
4. **Reusability**: Services and providers can be used across different UI components
5. **Type Safety**: Full TypeScript support with Zod validation
6. **Scalability**: Easy to add new features without breaking existing code

## Implementation Checklist

- [ ] Implement PocketBase repository implementations
- [ ] Create dependency injection container
- [ ] Add unit tests for services
- [ ] Add integration tests for workflows
- [ ] Create UI components that use services
- [ ] Add error handling and logging
- [ ] Implement caching layer
- [ ] Add audit trail functionality

## Next Steps

1. Create repository implementations for PocketBase
2. Set up dependency injection
3. Create SvelteKit routes that use these services
4. Build UI components for campaign management
5. Add report viewing and export functionality
6. Implement contract signing workflow
