# Leader Department Assignment Setup

This document outlines the implementation of department-based access control for leader users, ensuring they can only access and manage their assigned department.

## Overview

Leaders are department managers who should:
- Only see their assigned department's data
- Manage projects and tasks within their department
- View expenses but NOT approve them (admin-only)
- Have restricted sidebar navigation

## Database Schema Changes

### 1. Add `departmentId` field to `user_profiles` collection

**Via PocketBase UI:**
1. Go to Collections → `user_profiles`
2. Click "New field"
3. Select "Relation" type
4. Configure:
   - **Field name:** `departmentId`
   - **Collection:** `departments` (departments_collection)
   - **Max select:** 1
   - **Min select:** 0 (optional)
   - **Cascade delete:** false
   - **Required:** false (not all users are leaders)
   - **Display fields:** name

### 2. Update Collection Rules

#### `departments` collection - List/View Rules

Leaders should only see their assigned department:

```javascript
// List Rule
@request.auth.id != "" && (
  @request.auth.user_profiles_via_userId.role ?= "admin" ||
  (@request.auth.user_profiles_via_userId.role ?= "leader" && 
   @request.auth.user_profiles_via_userId.departmentId ?= id)
)

// View Rule
@request.auth.id != "" && (
  @request.auth.user_profiles_via_userId.role ?= "admin" ||
  (@request.auth.user_profiles_via_userId.role ?= "leader" && 
   @request.auth.user_profiles_via_userId.departmentId ?= id)
)
```

#### `projects` collection - Filter by Department

Leaders should only see projects in their department:

```javascript
// List Rule
@request.auth.id != "" && (
  @request.auth.user_profiles_via_userId.role ?= "admin" ||
  (@request.auth.user_profiles_via_userId.role ?= "leader" && 
   departmentId ?= @request.auth.user_profiles_via_userId.departmentId)
)
```

#### `expenses` collection - View Only (No Approval)

Leaders can view expenses but cannot approve them:

```javascript
// List/View Rule
@request.auth.id != ""

// Update Rule (for approval - ADMIN ONLY)
@request.auth.id != "" && @request.auth.user_profiles_via_userId.role ?= "admin"
```

**Note:** The Update Rule ensures only admins can modify expense status (including approval). Leaders will see expenses but any approval buttons should be disabled or hidden in the UI.

#### `tasks` collection - Filter by Department

Leaders should only see tasks in their department's projects:

```javascript
// List Rule
@request.auth.id != "" && (
  @request.auth.user_profiles_via_userId.role ?= "admin" ||
  (@request.auth.user_profiles_via_userId.role ?= "leader" && 
   projectId.departmentId ?= @request.auth.user_profiles_via_userId.departmentId)
)
```

## Implementation Details

### User Profile Structure

```typescript
interface UserProfile {
  id: string;
  userId: string;
  role: 'admin' | 'leader' | 'vendor' | 'pro' | 'franchise_owner';
  departmentId?: string;  // NEW: Link to department for leaders
  vendorId?: string;      // Existing: Link to vendor for vendor users
  // ... other fields
}
```

### Login Flow for Leaders

1. User logs in with leader role
2. System checks if `departmentId` is set
3. If set: Redirect to `/dashboard/department/[departmentId]`
4. If not set: Redirect to `/dashboard/departments` with error message

### Department Dashboard Features

Leaders can:
- ✅ View department details (name, budget, description)
- ✅ View and manage projects in their department
- ✅ View and manage tasks in their department
- ✅ View expenses (read-only)
- ✅ View department metrics and statistics

Leaders cannot:
- ❌ Approve expenses (admin-only)
- ❌ Access other departments
- ❌ Manage vendors
- ❌ Manage other users/managers
- ❌ Access global dashboard

### Sidebar Navigation for Leaders

Leaders see only:
- Dashboard (redirects to their department)
- Projects (filtered to their department)
- Tasks (filtered to their department)
- Expenses (read-only, filtered to their department)

Hidden from leaders:
- Managers
- Vendors
- Departments (list view)

## Migration Notes

### Existing Leaders

For existing leader users who are currently assigned via `headOfDepartment` in departments:

1. Query all departments with `headOfDepartment` set
2. For each department, find the user_profile by the headOfDepartment ID
3. Update that user_profile with `departmentId = department.id`
4. This creates a bidirectional link (department → leader, leader → department)

### Why Both Relations?

- `departments.headOfDepartment` → Shows who leads the department (display purposes)
- `user_profiles.departmentId` → Enables efficient filtering and access control

## Testing Checklist

### PocketBase Setup
- [ ] Add departmentId field to user_profiles collection (Relation to departments)
- [ ] Update departments collection rules (List/View)
- [ ] Update projects collection rules (filter by departmentId)
- [ ] Update tasks collection rules (filter by project's departmentId)
- [ ] Update expenses collection rules (Update rule = admin only)

### Leader Assignment
- [ ] Admin can see department dropdown when creating leader user
- [ ] Admin can see department dropdown when editing leader user
- [ ] Department dropdown only shows when role is "leader"
- [ ] departmentId is saved to user_profiles

### Leader Login Flow
- [ ] Leader with departmentId redirects to `/dashboard/department/[id]`
- [ ] Leader without departmentId redirects to `/dashboard/departments` with error
- [ ] Leader cannot access `/dashboard` (main dashboard)

### Leader Permissions
- [ ] Leader sees only their department's projects
- [ ] Leader sees only their department's tasks
- [ ] Leader can view expenses but cannot approve them
- [ ] Leader sidebar shows: Dashboard, Projects, Tasks, Expenses only
- [ ] Leader sidebar hides: Departments, Managers, Vendors

### Admin Capabilities
- [ ] Admin can assign department when creating leader
- [ ] Admin can change leader's department
- [ ] Admin can change user from leader to another role (clears departmentId)
- [ ] Admin sees all navigation items

## Code Changes

### Files Modified:

1. `src/routes/auth/login/+page.server.ts` - Leader redirect logic
2. `src/routes/dashboard/+page.server.ts` - Redirect leaders to their department
3. `src/routes/dashboard/department/[id]/+page.server.ts` - Department dashboard with access control
4. `src/lib/components/managers/add-manager-modal.svelte` - Department assignment field
5. `src/routes/dashboard/managers/+page.svelte` - Department assignment in edit modal
6. `src/routes/api/user-profiles/update-role/+server.ts` - Handle departmentId updates
7. `src/lib/components/flihub-sidebar.svelte` - Filter navigation for leaders

## Security Considerations

1. **Collection-level rules** enforce access control at the database level
2. **Server-side redirects** prevent unauthorized route access
3. **UI filtering** provides better UX but is not a security measure
4. **Expense approval** is restricted to admins only via collection rules

## Future Enhancements

- Multi-department leaders (change maxSelect to allow multiple departments)
- Department-specific permissions (beyond just leader/admin)
- Department budget tracking and alerts
- Department performance metrics
