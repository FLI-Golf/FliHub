# Vendor Assignment Testing Checklist

## Prerequisites

Before testing, ensure the following setup is complete in PocketBase:

### 1. Add vendorId Field to user_profiles Collection

1. Open PocketBase Admin UI
2. Navigate to Collections → user_profiles
3. Add new field:
   - **Name**: `vendorId`
   - **Type**: Relation
   - **Collection**: vendors
   - **Max Select**: 1 (single)
   - **Display Fields**: name
   - **Required**: No

### 2. Update Collection Rules

Update the `vendors` collection rules to restrict vendor users:

```javascript
// List/Search Rule
@request.auth.id != "" && (
  @request.auth.user_profiles_via_userId.role ?= "admin" ||
  @request.auth.user_profiles_via_userId.role ?= "leader" ||
  (@request.auth.user_profiles_via_userId.role ?= "vendor" && 
   @request.auth.user_profiles_via_userId.vendorId ?= id)
)

// View Rule
@request.auth.id != "" && (
  @request.auth.user_profiles_via_userId.role ?= "admin" ||
  @request.auth.user_profiles_via_userId.role ?= "leader" ||
  (@request.auth.user_profiles_via_userId.role ?= "vendor" && 
   @request.auth.user_profiles_via_userId.vendorId ?= id)
)
```

## Test Scenarios

### Scenario 1: Admin Assigns Vendor to User

**Steps:**
1. Log in as admin user
2. Navigate to Dashboard → Managers
3. Click on a user card to edit
4. Change role to "vendor"
5. Select a vendor from the "Assigned Vendor" dropdown
6. Click "Update Manager"

**Expected Results:**
- ✅ Vendor dropdown appears when role is set to "vendor"
- ✅ Dropdown is populated with all vendors
- ✅ User profile is updated with vendorId
- ✅ Success message is displayed

### Scenario 2: Vendor User Login (With Assignment)

**Steps:**
1. Log out from admin account
2. Log in with vendor user credentials (user with vendorId set)

**Expected Results:**
- ✅ User is redirected to `/dashboard/vendors`
- ✅ Page title shows "My Vendor"
- ✅ Only the assigned vendor is displayed
- ✅ "Add Vendor" button is hidden
- ✅ Sidebar shows only: Dashboard, Projects, Expenses

### Scenario 3: Vendor User Login (Without Assignment)

**Steps:**
1. Log out
2. Log in with vendor user credentials (user without vendorId)

**Expected Results:**
- ✅ User is redirected to `/dashboard/vendors`
- ✅ Orange warning card is displayed
- ✅ Message: "No vendor assigned to your account. Please contact an administrator."
- ✅ No vendors are shown
- ✅ "Add Vendor" button is hidden

### Scenario 4: Add New Manager as Vendor

**Steps:**
1. Log in as admin
2. Navigate to Dashboard → Managers
3. Click "Add Manager" button
4. Fill in user details
5. Select "vendor" as role
6. Select a vendor from dropdown
7. Click "Add Manager"

**Expected Results:**
- ✅ Vendor dropdown appears when role is "vendor"
- ✅ New user is created with vendorId
- ✅ User appears in managers list
- ✅ Success message is displayed

### Scenario 5: Change User from Vendor to Another Role

**Steps:**
1. Log in as admin
2. Navigate to Dashboard → Managers
3. Edit a vendor user
4. Change role from "vendor" to "pro"
5. Click "Update Manager"

**Expected Results:**
- ✅ Vendor dropdown disappears when role changes
- ✅ vendorId is cleared (set to null)
- ✅ User profile is updated
- ✅ User can now access full dashboard

### Scenario 6: Vendor Access Control

**Steps:**
1. Log in as vendor user (with vendorId)
2. Try to access different routes:
   - `/dashboard` - should redirect to `/dashboard/vendors`
   - `/dashboard/vendors` - should show only assigned vendor
   - `/dashboard/managers` - should be hidden in sidebar
   - `/dashboard/projects` - should be accessible
   - `/dashboard/expenses` - should be accessible

**Expected Results:**
- ✅ Sidebar navigation is filtered correctly
- ✅ Only allowed routes are accessible
- ✅ Vendor can only see their assigned vendor data

## API Endpoint Testing

### Test Update Role API

```bash
# Test updating role with vendorId
curl -X POST http://localhost:5174/api/user-profiles/update-role \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "PROFILE_ID",
    "role": "vendor",
    "vendorId": "VENDOR_ID"
  }'

# Test updating role without vendorId (should clear it)
curl -X POST http://localhost:5174/api/user-profiles/update-role \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "PROFILE_ID",
    "role": "admin"
  }'
```

**Expected Results:**
- ✅ API accepts vendorId parameter
- ✅ vendorId is updated in database
- ✅ vendorId is cleared when not provided
- ✅ Success response is returned

## Code Changes Summary

### Files Modified:

1. **src/routes/api/user-profiles/update-role/+server.ts**
   - Added vendorId parameter handling
   - Updates vendorId alongside role

2. **src/lib/components/managers/add-manager-modal.svelte**
   - Added vendorId field to form
   - Conditional vendor dropdown for vendor role

3. **src/routes/dashboard/managers/+page.svelte**
   - Added vendor dropdown to edit modal
   - Conditional display based on role

4. **src/routes/dashboard/managers/+page.server.ts**
   - Fetches vendors list for admin users
   - Expands vendorId in queries

5. **src/routes/dashboard/vendors/+page.server.ts**
   - Filters vendors based on user role
   - Shows only assigned vendor for vendor users
   - Displays error message if no vendor assigned

6. **src/routes/dashboard/vendors/+page.svelte**
   - Conditional UI for vendor users
   - Hides "Add Vendor" button for vendor role
   - Shows error message when no vendor assigned

7. **src/routes/auth/login/+page.server.ts**
   - Redirects vendor users to `/dashboard/vendors`
   - Handles both assigned and unassigned vendors

8. **src/lib/components/flihub-sidebar.svelte**
   - Filters navigation based on user role
   - Vendors see: Dashboard, Projects, Expenses only

## Manual Testing Notes

Record your test results here:

- [ ] Scenario 1: Admin Assigns Vendor to User
- [ ] Scenario 2: Vendor User Login (With Assignment)
- [ ] Scenario 3: Vendor User Login (Without Assignment)
- [ ] Scenario 4: Add New Manager as Vendor
- [ ] Scenario 5: Change User from Vendor to Another Role
- [ ] Scenario 6: Vendor Access Control
- [ ] API Endpoint Testing

## Known Issues

None at this time.

## Next Steps

After successful testing:
1. Remove this testing checklist file
2. Update main documentation if needed
3. Consider adding automated tests for vendor workflows
