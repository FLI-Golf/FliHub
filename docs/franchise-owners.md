# Franchise Owners

## Overview

Each franchise has an associated franchise owner user account with the `franchise_owner` role. These accounts allow franchise owners to log in and manage their franchise operations.

## Email Pattern

Franchise owner emails follow the pattern:
```
first@{franchise-slug}.com
```

Examples:
- `first@hyzer-heroes.com`
- `first@midas-touch.com`
- `first@disc-jesters.com`

## Default Credentials

**Password**: `FLIGolf2024!`

⚠️ **Important**: Franchise owners should change this password on first login.

## Complete Franchise Owner List

| Franchise | Email | User ID | Status |
|-----------|-------|---------|--------|
| Hyzer Heroes | first@hyzer-heroes.com | lu3qx8o92toa23x | Active |
| Huk-a-Mania | first@huk-a-mania.com | 21jeeo8nim3c2zt | Active |
| Flight Squad | first@flight-squad.com | muuvz5oev0zqg1m | Active |
| Birdie Storm | first@birdie-storm.com | 9ghlmffwp8st63p | Active |
| Chain Breakers | first@chain-breakers.com | 55lz01no7wluqd8 | Active |
| Disc Jesters | first@disc-jesters.com | 24hmronf2nv6mxq | Active |
| Midas Touch | first@midas-touch.com | an7evhehuaecdxm | Active |
| Chain Seekers | first@chain-seekers.com | 5hqpsu9ex2z9qeo | Active |
| Fairway Bombers | first@fairway-bombers.com | 2jvpcqpxae212h1 | Active |
| Disc Dynasty | first@disc-dynasty.com | x89jd1s3g6e9pad | Active |
| Ace Makers | first@ace-makers.com | 20ezksjn4udk3pn | Active |
| Glide Masters | first@glide-masters.com | 61zqh3a8n89vgmr | Active |

## User Profile Structure

Each franchise owner has:
- **User Account**: Authentication credentials
- **User Profile**: Role and personal information
- **Franchise Link**: Connected via `franchiseeId` field

### Profile Fields
```typescript
{
  userId: string,           // Link to user account
  firstName: "Franchise",
  lastName: "Owner",
  email: string,            // first@franchise-slug.com
  role: "franchise_owner",
  availableRoles: ["franchise_owner"],
  status: "active"
}
```

### Franchise Fields
```typescript
{
  franchiseeId: string,           // Link to user account
  franchiseeName: string,         // "{Franchise Name} Owner"
  franchiseeEmail: string,        // first@franchise-slug.com
  franchiseePhone: string,        // Optional
  franchiseeCompany: string       // Optional
}
```

## Scripts

### Create Franchise Owners

```bash
npx tsx src/lib/migrations/create-franchise-owners.ts
```

**What it does:**
- Creates user account for each franchise
- Creates user profile with `franchise_owner` role
- Links user to franchise via `franchiseeId`
- Sets franchise owner name and email

**Output:**
```
✅ Franchise owner creation completed!

👥 Franchise Owners:

Hyzer Heroes
  Owner: Hyzer Heroes Owner
  Email: first@hyzer-heroes.com
  User ID: lu3qx8o92toa23x
```

## Usage in Your App

### Authenticate Franchise Owner

```typescript
import { pb } from '$lib/infra/pocketbase/pbClient';

async function loginFranchiseOwner(email: string, password: string) {
  const authData = await pb.collection('users').authWithPassword(email, password);
  
  // Get user profile
  const profiles = await pb.collection('user_profiles').getFullList({
    filter: `userId = "${authData.record.id}"`
  });
  
  if (profiles.length > 0 && profiles[0].role === 'franchise_owner') {
    return {
      user: authData.record,
      profile: profiles[0]
    };
  }
  
  throw new Error('Not a franchise owner');
}
```

### Get Franchise Owner's Franchises

```typescript
async function getOwnerFranchises(userId: string) {
  const franchises = await pb.collection('franchises').getFullList({
    filter: `franchiseeId = "${userId}"`,
    expand: 'malePro,femalePro,additionalPros'
  });
  
  return franchises;
}
```

### Check if User is Franchise Owner

```typescript
function isFranchiseOwner(profile: any): boolean {
  return profile.role === 'franchise_owner' || 
         profile.availableRoles?.includes('franchise_owner');
}
```

### Get Franchise with Owner Details

```typescript
const franchise = await pb.collection('franchises').getOne(franchiseId, {
  expand: 'franchiseeId,malePro,femalePro'
});

console.log('Owner:', franchise.franchiseeName);
console.log('Email:', franchise.franchiseeEmail);
console.log('User Profile:', franchise.expand?.franchiseeId);
```

## Svelte Components

### Franchise Owner Dashboard

```svelte
<script lang="ts">
  import { pb } from '$lib/infra/pocketbase/pbClient';
  import { onMount } from 'svelte';
  
  let user = pb.authStore.model;
  let franchises = [];
  
  onMount(async () => {
    if (user) {
      franchises = await pb.collection('franchises').getFullList({
        filter: `franchiseeId = "${user.id}"`,
        expand: 'malePro,femalePro'
      });
    }
  });
</script>

<div class="owner-dashboard">
  <h1>Welcome, Franchise Owner</h1>
  
  <div class="franchises">
    <h2>Your Franchises ({franchises.length})</h2>
    
    {#each franchises as franchise}
      <div class="franchise-card">
        <h3>{franchise.name}</h3>
        <p>{franchise.tagline}</p>
        
        <div class="team">
          <div>
            <strong>Male Pro:</strong>
            {franchise.expand?.malePro?.name || 'Not assigned'}
          </div>
          <div>
            <strong>Female Pro:</strong>
            {franchise.expand?.femalePro?.name || 'Not assigned'}
          </div>
        </div>
        
        <div class="stats">
          <div>
            <strong>Territory:</strong> {franchise.territory}
          </div>
          <div>
            <strong>Status:</strong> {franchise.status}
          </div>
          <div>
            <strong>Franchise Fee:</strong> ${franchise.franchiseFee?.toLocaleString()}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
```

### Login Form

```svelte
<script lang="ts">
  import { pb } from '$lib/infra/pocketbase/pbClient';
  import { goto } from '$app/navigation';
  
  let email = '';
  let password = '';
  let error = '';
  let loading = false;
  
  async function handleLogin() {
    loading = true;
    error = '';
    
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      
      // Get user profile
      const profiles = await pb.collection('user_profiles').getFullList({
        filter: `userId = "${authData.record.id}"`
      });
      
      if (profiles.length > 0 && profiles[0].role === 'franchise_owner') {
        goto('/franchise-owner/dashboard');
      } else {
        error = 'Not authorized as franchise owner';
        pb.authStore.clear();
      }
    } catch (err: any) {
      error = err.message || 'Login failed';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit|preventDefault={handleLogin}>
  <h2>Franchise Owner Login</h2>
  
  <input
    type="email"
    bind:value={email}
    placeholder="first@franchise-name.com"
    required
  />
  
  <input
    type="password"
    bind:value={password}
    placeholder="Password"
    required
  />
  
  {#if error}
    <p class="error">{error}</p>
  {/if}
  
  <button type="submit" disabled={loading}>
    {loading ? 'Logging in...' : 'Login'}
  </button>
</form>
```

### Protected Route

```typescript
// src/routes/franchise-owner/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  // Check if user is franchise owner
  const profile = await locals.pb.collection('user_profiles').getFirstListItem(
    `userId = "${locals.user.id}"`
  );
  
  if (profile.role !== 'franchise_owner') {
    throw redirect(303, '/unauthorized');
  }
  
  // Get user's franchises
  const franchises = await locals.pb.collection('franchises').getFullList({
    filter: `franchiseeId = "${locals.user.id}"`,
    expand: 'malePro,femalePro'
  });
  
  return {
    user: locals.user,
    profile,
    franchises
  };
};
```

## Permissions & Access Control

### Current Rules

Franchise owners can:
- ✅ View all franchises (authenticated users)
- ✅ View their own franchise details
- ❌ Create franchises (admin only)
- ❌ Update franchises (admin only)
- ❌ Delete franchises (admin only)

### Recommended Rules

Update franchise collection rules to allow owners to update their own franchises:

```javascript
// Update rule
@request.auth.id != "" && (
  @request.auth.role = "admin" || 
  franchiseeId = @request.auth.id
)
```

This allows:
- Admins to update any franchise
- Franchise owners to update only their own franchises

### Fields Franchise Owners Should Update

Allow franchise owners to update:
- Performance metrics
- Social media links
- Marketing materials
- Internal notes (their own)
- Contact information

Restrict from updating:
- Franchise fee
- Royalty percentages
- Status (admin only)
- Contract dates
- Territory assignments

## Password Management

### Change Password

```typescript
async function changePassword(oldPassword: string, newPassword: string) {
  const user = pb.authStore.model;
  
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  await pb.collection('users').update(user.id, {
    oldPassword,
    password: newPassword,
    passwordConfirm: newPassword
  });
}
```

### Reset Password

Implement password reset flow:
1. Request reset via email
2. Send reset token
3. Allow password change with token

## Security Best Practices

1. **Force Password Change**
   - Require password change on first login
   - Set password expiry (e.g., 90 days)

2. **Two-Factor Authentication**
   - Consider implementing 2FA for franchise owners
   - Especially for financial operations

3. **Session Management**
   - Set appropriate session timeouts
   - Log out inactive users

4. **Audit Logging**
   - Track franchise owner actions
   - Monitor sensitive operations
   - Keep audit trail for compliance

5. **Data Access**
   - Limit franchise owners to their own data
   - Implement row-level security
   - Validate all requests server-side

## Troubleshooting

### "Not authorized as franchise owner"
- Check user profile role is set to `franchise_owner`
- Verify `availableRoles` includes `franchise_owner`
- Ensure user is linked to a franchise

### "No franchises found"
- Check `franchiseeId` matches user ID
- Verify franchise record exists
- Check collection permissions

### "Login failed"
- Verify email format: `first@franchise-slug.com`
- Check password: default is `FLIGolf2024!`
- Ensure user account is active

## Future Enhancements

1. **Multi-Franchise Owners**
   - Allow one owner to manage multiple franchises
   - Implement franchise switching

2. **Team Management**
   - Allow owners to manage their team roster
   - Request pro player assignments

3. **Financial Dashboard**
   - Revenue tracking
   - Royalty calculations
   - Payment history

4. **Performance Analytics**
   - Fan engagement metrics
   - Social media analytics
   - Merchandise sales tracking

5. **Communication Tools**
   - Messaging with FLI Golf HQ
   - Announcements and updates
   - Support ticket system

## Related Files

- `src/lib/migrations/create-franchise-owners.ts` - Owner creation script
- `src/lib/migrations/create-franchises-collection.ts` - Collection setup
- `src/lib/migrations/seed-franchises.ts` - Franchise data seeding
- `docs/franchise-system.md` - Complete franchise documentation
