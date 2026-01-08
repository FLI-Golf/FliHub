# Terminology Consistency Update

## Overview
Updated the application to use consistent terminology throughout. The term "managers" has been replaced with more appropriate terms based on context.

## Changes Made

### 1. Database Schema
- **Removed**: `managers` collection (deprecated, empty)
- **Using**: `user_profiles` collection with `role` field
- **Migration**: Created `remove-managers-collection.ts` to safely remove the deprecated collection

### 2. Routes
- **Before**: `/dashboard/managers`
- **After**: `/dashboard/people`
- **Purpose**: This route manages ALL user profiles (leaders, admins, vendors, pros, franchise owners), not just managers

### 3. User Roles
The system uses these roles in `user_profiles.role`:
- `leader` - Leadership roles (department heads, organizational leaders)
- `admin` - System administrators
- `vendor` - Vendor representatives
- `pro` - Professional players
- `franchise_owner` - Franchise location owners

### 4. File Structure Changes

**Routes:**
```
src/routes/dashboard/managers/  →  src/routes/dashboard/people/
  ├── +page.server.ts
  └── +page.svelte
```

**Components:**
```
src/lib/components/managers/  →  src/lib/components/people/
  └── add-manager-modal.svelte  →  add-person-modal.svelte
```

### 5. Code Updates

**Server-side (`+page.server.ts`):**
- Variable `managers` → `people`
- Fetches all user profiles (admin) or filtered by role (non-admin)
- Expands `vendorId` and `proReference` relations

**Client-side (`+page.svelte`):**
- All references to "manager" → "person"
- Component imports updated
- Filtering and display logic maintained

**Navigation (`flihub-sidebar.svelte`):**
- Menu item "Managers" → "People"
- URL `/dashboard/managers` → `/dashboard/people`

**Dashboard (`dashboard/+page.svelte`):**
- Metrics `managers.total` → `people.total`
- Button link updated to `/dashboard/people`

### 6. Collections Schema (`collections.ts`)
- Removed `managers` collection definition
- Added comment explaining deprecation
- System now uses `user_profiles` with role-based filtering

## Terminology Guide

### Use "Leader" when:
- Referring to the role: `role='leader'`
- Describing department heads or organizational leaders
- Filtering user profiles by leadership role

### Use "People" when:
- Referring to the management interface for all users
- Describing the collection of all user profiles
- In UI labels for the user management page

### Use "User Profile" when:
- Referring to the database record
- In technical documentation
- When discussing the data model

## Database Relationships

```
user_profiles
  ├── role: 'leader' | 'admin' | 'vendor' | 'pro' | 'franchise_owner'
  ├── availableRoles: array of roles user can switch between
  ├── vendorId: relation to vendors collection
  └── proReference: relation to pros collection

departments_collection
  └── headOfDepartment: relation to user_profiles

vendors
  └── headOfVendor: relation to user_profiles
```

## Migration Scripts

### `remove-managers-collection.ts`
- Checks if managers collection exists
- Verifies no records exist before deletion
- Safely removes the deprecated collection
- Provides clear messaging about the new system

**Usage:**
```bash
npx tsx src/lib/migrations/remove-managers-collection.ts
```

## Benefits

1. **Clarity**: "People" clearly indicates this manages all users, not just one role
2. **Consistency**: "Leader" is used consistently as a role name
3. **Scalability**: Easy to add new roles without terminology confusion
4. **Maintainability**: Single source of truth (`user_profiles`) for all user data

## Future Considerations

- Consider adding a "Teams" concept for grouping people
- May want to add "Roles & Permissions" management page
- Could add "People Directory" for public-facing profiles
