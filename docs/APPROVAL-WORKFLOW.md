# Approval Workflow Documentation

## Overview

The approval workflow system provides an audit trail and approval process for expenses, projects, and budget changes. It consists of two parts:

1. **Approvals Collection** - Tracks approval requests and their history
2. **Entity Updates** - Automatically updates the linked expense/project when approved/rejected

## How It Works

### Approval Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Approval Request Created                                 │
│    - entityType: expense/project/budget                     │
│    - entityId: ID of the expense/project                    │
│    - status: pending                                        │
│    - requestedBy: User who requested                        │
│    - amount: Amount being approved                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Admin/Leader Reviews on /dashboard/approvals            │
│    - Views all pending approvals                            │
│    - Sees requester, amount, date, comments                 │
│    - Can filter by status/type                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴───────┐
                    │               │
            ┌───────▼─────┐   ┌────▼────────┐
            │   APPROVE   │   │   REJECT    │
            └───────┬─────┘   └────┬────────┘
                    │               │
                    ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Approval Record Updated                                  │
│    - status: approved/rejected                              │
│    - approver: Admin/Leader who acted                       │
│    - reviewedDate: Timestamp                                │
│    - comments: Approval/rejection reason                    │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Linked Entity Updated (NEW in Phase 2!)                 │
│                                                              │
│    IF APPROVED:                                             │
│    - Expense: status → "approved"                           │
│               approvedBy → approver ID                      │
│               approvedDate → timestamp                      │
│    - Project: status → "in_progress"                        │
│               approvedBy → approver ID                      │
│                                                              │
│    IF REJECTED:                                             │
│    - Expense: status → "rejected"                           │
│    - Project: status → "cancelled"                          │
└─────────────────────────────────────────────────────────────┘
```

## Collections

### Approvals Collection

**Fields:**
- `entityType` - Type of entity (expense/project/budget)
- `entityId` - ID of the linked entity
- `status` - pending/approved/rejected/revision_requested
- `requestedBy` - User profile who requested approval
- `approver` - User profile who approved/rejected
- `requestedDate` - When approval was requested
- `reviewedDate` - When approval was reviewed
- `comments` - Approval/rejection comments (HTML)
- `amount` - Amount being approved

**Purpose:**
- Audit trail of all approval requests
- Track who requested and who approved
- Store approval history and comments
- Enable reporting on approval patterns

### Linked Entities

**Expenses:**
- `status` - draft/submitted/approved/rejected/paid
- `approvedBy` - User profile who approved
- `approvedDate` - When expense was approved

**Projects:**
- `status` - draft/planned/in_progress/completed/cancelled
- `approvedBy` - User profile who approved

## API Endpoints

### POST `/api/approvals/create`

Manually create an approval request for any entity.

**Request:**
```json
{
  "entityType": "expense|project|budget",
  "entityId": "entity_record_id",
  "amount": 1500,
  "comments": "<p>Optional comments</p>"
}
```

**Actions:**
1. Validates entity type
2. Checks for existing pending approval
3. Creates approval record
4. Links to entity

**Response:**
```json
{
  "success": true,
  "message": "Approval request created successfully",
  "approval": { ... }
}
```

### POST `/api/expenses`

Create a new expense. If status is "submitted", automatically creates approval.

**Request:**
```json
{
  "description": "Office supplies",
  "amount": 150,
  "category": "Office/San Diego",
  "status": "submitted",
  "date": "2026-01-07",
  "vendor": "vendor_id",
  "project": "project_id"
}
```

**Actions:**
1. Creates expense record
2. If status is "submitted", creates approval automatically
3. Links approval to expense

**Response:**
```json
{
  "success": true,
  "message": "Expense created and submitted for approval",
  "expense": { ... },
  "approval": { ... }
}
```

### PATCH `/api/expenses`

Update an existing expense. If status changes to "submitted", creates approval.

**Request:**
```json
{
  "expenseId": "expense_record_id",
  "status": "submitted"
}
```

**Actions:**
1. Gets current expense
2. Updates expense
3. If status changed to "submitted", creates approval
4. Only creates if no pending approval exists

### POST `/api/projects/request-approval`

Request approval for a project.

**Request:**
```json
{
  "projectId": "project_record_id",
  "comments": "<p>Please approve this project</p>"
}
```

**Actions:**
1. Gets project details
2. Checks for existing approval
3. Creates approval with project budget amount

### POST `/api/budgets/request-approval`

Request approval for a budget change.

**Request:**
```json
{
  "entityId": "department_id_or_unique_id",
  "amount": 50000,
  "description": "Q2 budget increase",
  "comments": "<p>Requesting additional budget</p>"
}
```

**Actions:**
1. Validates amount
2. Checks for existing approval
3. Creates approval record

### POST `/api/approvals/approve`

Approves an approval request and updates the linked entity.

**Request:**
```json
{
  "approvalId": "approval_record_id"
}
```

**Actions:**
1. Verifies user is admin or leader
2. Updates approval record to "approved"
3. Records approver and timestamp
4. Updates linked expense/project status
5. Sets approvedBy and approvedDate fields

**Response:**
```json
{
  "success": true,
  "message": "Approval approved successfully",
  "approval": { ... }
}
```

### POST `/api/approvals/reject`

Rejects an approval request and updates the linked entity.

**Request:**
```json
{
  "approvalId": "approval_record_id"
}
```

**Actions:**
1. Verifies user is admin or leader
2. Updates approval record to "rejected"
3. Records approver and timestamp
4. Updates linked expense/project to rejected/cancelled

**Response:**
```json
{
  "success": true,
  "message": "Approval rejected successfully",
  "approval": { ... }
}
```

## User Interface

### `/dashboard/approvals`

**Features:**
- Statistics dashboard (pending, approved, rejected counts)
- Filter by status (all, pending, approved, rejected, revision_requested)
- Filter by type (all, expenses, projects, budgets)
- Approval cards showing:
  - Type and status
  - Amount
  - Requester name
  - Request date
  - Approver name (if reviewed)
  - Review date (if reviewed)
  - Comments
- Action buttons (Approve/Reject) for pending approvals
- Only visible to admin and leader roles

## Current State (Phase 3 Complete)

### ✅ What's Working:

1. **Approvals Page** - View and manage all approval requests
2. **Approve/Reject Actions** - Update approval records
3. **Entity Integration** - Automatically updates linked expenses/projects
4. **Audit Trail** - Complete history of who approved what and when
5. **Role-Based Access** - Only admins and leaders can approve
6. **Automatic Approval Creation** - Approvals auto-created when:
   - Expense status changes to "submitted"
   - Project approval is requested
   - Budget change approval is requested

## Automatic Approval Creation (Phase 3)

### Expense Workflow

When creating or updating an expense via `/api/expenses`:

**POST /api/expenses** (Create)
- If `status` is set to `"submitted"`
- Automatically creates approval record
- Links to expense ID
- Sets requester to current user

**PATCH /api/expenses** (Update)
- If status changes from any status → `"submitted"`
- Automatically creates approval record
- Only creates if no pending approval exists

### Project Workflow

**POST /api/projects/request-approval**
- Manually request approval for a project
- Creates approval record linked to project
- Includes project budget amount
- Allows custom comments

### Budget Workflow

**POST /api/budgets/request-approval**
- Request approval for budget changes
- Creates approval record with amount
- Includes description of change
- Allows custom comments

## Testing

### Seed Test Data

Create approval test data:
```bash
npm run test:seed:approvals
```

Or via dashboard:
- Click "Seed Approval Data" button
- Creates 15 approval requests (10 expenses, 3 projects, 2 budgets)
- Various statuses for testing

### Remove Test Data

Remove approval test data:
```bash
# Via API
POST /api/test-data/remove-approvals
```

Or via dashboard:
- Click "Remove Approval Data" button
- Deletes all approval records

### Manual Testing

1. Navigate to `/dashboard/approvals`
2. Find a pending approval
3. Click "Approve" or "Reject"
4. Verify:
   - Approval status updates
   - Linked expense/project status updates
   - Approver and date are recorded
5. Check `/dashboard/expenses` to see updated status

## Security

**Role Requirements:**
- **View Approvals**: Any authenticated user
- **Approve/Reject**: Admin or Leader roles only

**Validation:**
- User authentication checked
- User role verified before actions
- Approval ID required
- Entity updates wrapped in try-catch (continues if entity missing)

## Error Handling

**Missing Entity:**
- If linked expense/project doesn't exist
- Approval record still updates
- Warning logged to console
- User sees success message

**Permission Denied:**
- Returns 403 error
- Clear error message
- No changes made

**Invalid Request:**
- Returns 400 error
- Validation message
- No changes made

## Future Enhancements

1. **Comments on Approval** - Allow custom comments when approving/rejecting
2. **Revision Requests** - Request changes with specific feedback
3. **Multi-Level Approvals** - Require multiple approvers
4. **Approval Thresholds** - Auto-approve under certain amounts
5. **Email Notifications** - Notify when approval needed/completed
6. **Approval History View** - See all actions on a single entity
7. **Bulk Approvals** - Approve multiple items at once
8. **Approval Delegation** - Delegate approval authority
9. **Conditional Approvals** - Different approvers based on amount/type
10. **Approval Analytics** - Reports on approval times and patterns
