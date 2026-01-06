# Vendor Access Control Setup

## Collection Schema Changes

### 1. Add `vendorId` field to `user_profiles` collection

**Via PocketBase UI:**
1. Go to Collections → `user_profiles`
2. Click "New field"
3. Select "Relation" type
4. Configure:
   - **Field name:** `vendorId`
   - **Collection:** `vendors` (pbc_3732325883)
   - **Max select:** 1
   - **Min select:** 0 (optional)
   - **Cascade delete:** false
   - **Required:** false (not all users are vendors)

### 2. Update Collection Rules

#### `vendors` collection - View Rule
```javascript
@request.auth.id != '' && (
  @request.auth.role = 'admin' || 
  @request.auth.role = 'leader' || 
  @request.auth.vendorId = id
)
```
**Explanation:** Admins and leaders see all vendors. Vendor users only see their own vendor record.

#### `vendors` collection - Update Rule
```javascript
@request.auth.id != '' && (
  @request.auth.role = 'admin' || 
  @request.auth.role = 'leader' || 
  (@request.auth.role = 'vendor' && @request.auth.vendorId = id)
)
```
**Explanation:** Vendors can update their own vendor information.

#### `projects` collection - View Rule
```javascript
@request.auth.id != '' && (
  @request.auth.role != 'vendor' || 
  vendors ~ @request.auth.vendorId
)
```
**Explanation:** Non-vendors see all projects. Vendors only see projects where they are listed in the vendors array.

#### `expenses` collection - View Rule (if you add vendorId to expenses)
```javascript
@request.auth.id != '' && (
  @request.auth.role != 'vendor' || 
  vendorId = @request.auth.vendorId
)
```
**Explanation:** Vendors only see expenses related to their vendor account.

## Implementation Notes

### Vendor User Flow
1. Admin creates vendor in vendors collection
2. Admin creates user profile with role="vendor" and assigns vendorId
3. Vendor logs in → redirected to vendor-specific dashboard
4. Vendor sees only:
   - Their vendor profile
   - Projects they're assigned to
   - Their invoices/expenses
   - Their profile settings

### Security Layers
1. **Collection Rules** - Database-level access control
2. **Sidebar Navigation** - UI-level hiding of restricted sections
3. **Login Redirects** - Route users to appropriate dashboards
4. **Server-side checks** - Additional validation in API endpoints

## Code Changes Implemented

### 1. Sidebar Navigation Filtering
**File:** `src/lib/components/flihub-sidebar.svelte`
- Filters navigation items based on user role
- Vendors see only: Dashboard, Projects, Expenses
- Pros/Franchise owners see limited views (no Managers/Vendors)
- Admins and leaders see everything

### 2. Login Redirect Logic
**File:** `src/routes/auth/login/+page.server.ts`
- Checks user role after login
- Vendors without vendorId → Dashboard with setup prompt
- Vendors with vendorId → Dashboard (filtered view)
- Leaders → Department dashboard if they head a department
- Others → Default dashboard

### 3. Collection Rules (Apply in PocketBase UI)

Copy these rules into PocketBase Admin UI:

#### vendors - listRule
```javascript
@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'leader' || @request.auth.vendorId = id)
```

#### vendors - viewRule
```javascript
@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'leader' || @request.auth.vendorId = id)
```

#### vendors - updateRule
```javascript
@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'leader' || (@request.auth.role = 'vendor' && @request.auth.vendorId = id))
```

#### projects - listRule (update existing)
```javascript
@request.auth.id != '' && (@request.auth.role != 'vendor' || vendors ~ @request.auth.vendorId)
```

#### projects - viewRule (update existing)
```javascript
@request.auth.id != '' && (@request.auth.role != 'vendor' || vendors ~ @request.auth.vendorId)
```

## Testing Checklist
- [ ] Add vendorId field to user_profiles collection
- [ ] Update collection rules in PocketBase UI
- [ ] Create test vendor user with vendorId assigned
- [ ] Test vendor login → sees filtered sidebar
- [ ] Vendor user can view their vendor profile
- [ ] Vendor user cannot view other vendors
- [ ] Vendor user can only see projects they're assigned to
- [ ] Vendor user cannot access managers, departments, or all projects
- [ ] Admin can still see and manage all vendors
- [ ] Sidebar hides restricted sections for vendor users

## Next Steps
1. Add vendorId field via PocketBase UI (see instructions above)
2. Apply collection rules via PocketBase UI
3. Test with a vendor user account
4. Optionally create `/dashboard/vendor` route for vendor-specific dashboard
