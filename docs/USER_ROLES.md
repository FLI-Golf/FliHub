# User Roles and Permissions

## Overview

FliHub uses a role-based access control system to manage user permissions and access levels.

## User Roles

### Leader
- **Description**: Full access to all features and settings
- **Permissions**: 
  - Manage all users and roles
  - Access all collections and data
  - Configure system settings
  - View all reports and analytics
- **Use Case**: Company executives, founders

### Administrator
- **Description**: Manage users, projects, and business operations
- **Permissions**:
  - Manage managers, tasks, projects, expenses
  - Create and edit business data
  - View reports and dashboards
  - Cannot modify other admin/leader accounts
- **Use Case**: Operations managers, department heads

### Vendor
- **Description**: Access to vendor-specific features and contracts
- **Permissions**:
  - View assigned projects
  - Submit expenses
  - Update vendor information
  - Limited access to business data
- **Use Case**: External vendors, suppliers, contractors

### Professional (Pro)
- **Description**: Professional player access to tournaments and events
- **Permissions**:
  - View tournament schedules
  - Access player information
  - Submit availability
  - Limited project access
- **Use Case**: Professional golfers, athletes

### Franchise Owner
- **Description**: Manage franchise locations and operations
- **Permissions**:
  - Manage franchise-specific data
  - View franchise reports
  - Access franchise projects
  - Submit franchise expenses
- **Use Case**: Franchise location owners

## User Profile Collection

The `user_profiles` collection stores additional user information:

### Fields
- `userId` (text, required, unique) - Links to PocketBase users collection
- `role` (select, required) - User role (leader, admin, vendor, pro, franchise_owner)
- `firstName` (text, required) - User's first name
- `lastName` (text, required) - User's last name
- `phone` (text, optional) - Contact phone number
- `organization` (text, optional) - Company or organization name
- `bio` (editor, optional) - User biography or description
- `avatar` (url, optional) - Profile picture URL
- `isActive` (bool) - Account active status

### Access Rules
- **List/View**: Authenticated users can view all profiles
- **Create**: Authenticated users can create profiles
- **Update**: Users can only update their own profile (role changes restricted)
- **Delete**: Users can only delete their own profile

## Registration Flow

1. User visits `/auth/register`
2. Fills out registration form:
   - First name, last name
   - Email address
   - Password (min 8 characters)
   - Select role
3. System creates:
   - User account in `users` collection
   - User profile in `user_profiles` collection
4. User is automatically logged in
5. Redirected to dashboard

## Implementation

### Schema Definition
```typescript
// src/lib/domain/schemas/user-profile.schema.ts
export const UserRoleEnum = z.enum([
  'leader', 
  'admin', 
  'vendor', 
  'pro', 
  'franchise_owner'
]);

export const UserProfileSchema = z.object({
  userId: z.string().min(1),
  role: UserRoleEnum,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  organization: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().default(true)
});
```

### Registration Handler
```typescript
// src/routes/auth/register/+page.server.ts
// Creates user account and profile in single transaction
// Auto-login after successful registration
```

## Future Enhancements

### Planned Features
- Role-based UI customization
- Permission-based feature access
- Team/organization grouping
- Role hierarchy and delegation
- Audit logging for role changes
- Multi-role support per user

### Permission Matrix
Future implementation will include detailed permission matrix for each role:
- Collection-level permissions
- Field-level permissions
- Action-level permissions (create, read, update, delete)
- Feature-level permissions

## Setup Instructions

1. **Import Collection**:
   ```bash
   # Upload json_data/user-profiles-collection.json to PocketBase
   ```

2. **Verify Collection**:
   - Check that `user_profiles` collection exists
   - Verify all fields are present
   - Test access rules

3. **Test Registration**:
   - Visit `/auth/register`
   - Create test account for each role
   - Verify profile creation
   - Check dashboard access

## Troubleshooting

### Profile Not Created
- Check PocketBase logs for errors
- Verify `user_profiles` collection exists
- Ensure access rules allow creation

### Role Not Saving
- Verify role value matches enum
- Check select field values in PocketBase
- Review validation errors

### Cannot Update Profile
- Check access rules for update permission
- Verify user is authenticated
- Ensure userId matches current user
