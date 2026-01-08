# Franchise Owners - Setup Complete ✅

## What Was Created

### 12 Franchise Owner Accounts
Each franchise now has a dedicated owner account with:
- ✅ User account (authentication)
- ✅ User profile (role: `franchise_owner`)
- ✅ Linked to franchise via `franchiseeId`

## Credentials

### Email Pattern
```
first@{franchise-slug}.com
```

### Default Password
```
FLIGolf2024!
```

⚠️ **Important**: Owners should change this on first login

## Complete Owner List

| Franchise | Email | Password | User ID |
|-----------|-------|----------|---------|
| Hyzer Heroes | first@hyzer-heroes.com | FLIGolf2024! | lu3qx8o92toa23x |
| Huk-a-Mania | first@huk-a-mania.com | FLIGolf2024! | 21jeeo8nim3c2zt |
| Flight Squad | first@flight-squad.com | FLIGolf2024! | muuvz5oev0zqg1m |
| Birdie Storm | first@birdie-storm.com | FLIGolf2024! | 9ghlmffwp8st63p |
| Chain Breakers | first@chain-breakers.com | FLIGolf2024! | 55lz01no7wluqd8 |
| Disc Jesters | first@disc-jesters.com | FLIGolf2024! | 24hmronf2nv6mxq |
| Midas Touch | first@midas-touch.com | FLIGolf2024! | an7evhehuaecdxm |
| Chain Seekers | first@chain-seekers.com | FLIGolf2024! | 5hqpsu9ex2z9qeo |
| Fairway Bombers | first@fairway-bombers.com | FLIGolf2024! | 2jvpcqpxae212h1 |
| Disc Dynasty | first@disc-dynasty.com | FLIGolf2024! | x89jd1s3g6e9pad |
| Ace Makers | first@ace-makers.com | FLIGolf2024! | 20ezksjn4udk3pn |
| Glide Masters | first@glide-masters.com | FLIGolf2024! | 61zqh3a8n89vgmr |

## Test Login

You can test any franchise owner login:

```typescript
import { pb } from '$lib/infra/pocketbase/pbClient';

const authData = await pb.collection('users').authWithPassword(
  'first@hyzer-heroes.com',
  'FLIGolf2024!'
);

// Get their franchises
const franchises = await pb.collection('franchises').getFullList({
  filter: `franchiseeId = "${authData.record.id}"`,
  expand: 'malePro,femalePro'
});

console.log('Owned franchises:', franchises);
```

## Data Structure

### User Account
```json
{
  "id": "lu3qx8o92toa23x",
  "email": "first@hyzer-heroes.com",
  "emailVisibility": true
}
```

### User Profile
```json
{
  "userId": "lu3qx8o92toa23x",
  "firstName": "Franchise",
  "lastName": "Owner",
  "email": "first@hyzer-heroes.com",
  "role": "franchise_owner",
  "availableRoles": ["franchise_owner"],
  "status": "active"
}
```

### Franchise Link
```json
{
  "franchiseeId": "lu3qx8o92toa23x",
  "franchiseeName": "Hyzer Heroes Owner",
  "franchiseeEmail": "first@hyzer-heroes.com"
}
```

## Complete Franchise Data Example

**Hyzer Heroes** with full owner and team data:

```json
{
  "id": "franchise_id",
  "name": "Hyzer Heroes",
  "slug": "hyzer-heroes",
  "tagline": "Masters of the Fade",
  "territory": "Northeast United States",
  "primaryColor": "#1E40AF",
  "secondaryColor": "#FBBF24",
  "status": "available",
  "franchiseFee": 250000,
  "royaltyPercentage": 6,
  "marketingFeePercentage": 2,
  
  // Owner Information
  "franchiseeId": "lu3qx8o92toa23x",
  "franchiseeName": "Hyzer Heroes Owner",
  "franchiseeEmail": "first@hyzer-heroes.com",
  
  // Team Roster
  "malePro": "niklas_anttila_id",
  "femalePro": "holyn_handley_id",
  
  // Expanded Relations
  "expand": {
    "franchiseeId": {
      "id": "lu3qx8o92toa23x",
      "email": "first@hyzer-heroes.com",
      "role": "franchise_owner"
    },
    "malePro": {
      "name": "Niklas Anttila",
      "gender": "male"
    },
    "femalePro": {
      "name": "Holyn Handley",
      "gender": "female"
    }
  }
}
```

## Scripts

### Create Owners (Already Run)
```bash
npx tsx src/lib/migrations/create-franchise-owners.ts
```

**What it did:**
- Created 12 user accounts
- Created 12 user profiles with `franchise_owner` role
- Linked each user to their franchise
- Set franchise owner name and email

## Usage Examples

### Get Franchise with Owner
```typescript
const franchise = await pb.collection('franchises').getOne(franchiseId, {
  expand: 'franchiseeId,malePro,femalePro'
});

console.log('Owner:', franchise.franchiseeName);
console.log('Email:', franchise.franchiseeEmail);
console.log('Male Pro:', franchise.expand?.malePro?.name);
console.log('Female Pro:', franchise.expand?.femalePro?.name);
```

### Get Owner's Franchises
```typescript
const franchises = await pb.collection('franchises').getFullList({
  filter: `franchiseeId = "${userId}"`,
  expand: 'malePro,femalePro'
});
```

### Check if User is Owner
```typescript
const profile = await pb.collection('user_profiles').getFirstListItem(
  `userId = "${userId}"`
);

const isOwner = profile.role === 'franchise_owner';
```

## Access Control

### Current Permissions
- ✅ Franchise owners can view all franchises
- ✅ Franchise owners can view their own data
- ❌ Only admins can create/update/delete franchises

### Recommended Updates
Allow franchise owners to update their own franchises:

```javascript
// franchises collection updateRule
@request.auth.id != "" && (
  @request.auth.role = "admin" || 
  franchiseeId = @request.auth.id
)
```

## Next Steps

### Immediate
1. **Build owner dashboard**
   - Login page
   - Franchise overview
   - Team roster display
   - Performance metrics

2. **Implement authentication**
   - Login flow
   - Password change
   - Session management

3. **Create owner routes**
   - `/franchise-owner/login`
   - `/franchise-owner/dashboard`
   - `/franchise-owner/franchise/{id}`

### Short-term
1. **Force password change**
   - Require change on first login
   - Implement password policy

2. **Add owner features**
   - Update contact information
   - Upload marketing materials
   - View performance data

3. **Communication tools**
   - Messaging with HQ
   - Announcements
   - Support tickets

### Long-term
1. **Financial dashboard**
   - Revenue tracking
   - Royalty calculations
   - Payment history

2. **Team management**
   - Request pro assignments
   - Manage additional roster

3. **Analytics**
   - Fan engagement
   - Social media metrics
   - Merchandise sales

## Security Notes

1. **Password Security**
   - Default password is temporary
   - Enforce strong password policy
   - Implement password expiry

2. **Session Management**
   - Set appropriate timeouts
   - Implement auto-logout
   - Track active sessions

3. **Data Access**
   - Owners only see their franchises
   - Validate all requests server-side
   - Implement audit logging

4. **Two-Factor Authentication**
   - Consider 2FA for financial operations
   - SMS or authenticator app
   - Backup codes

## Troubleshooting

### Login Issues
- Verify email format: `first@franchise-slug.com`
- Check password: `FLIGolf2024!`
- Ensure account is active

### No Franchises Shown
- Check `franchiseeId` matches user ID
- Verify franchise exists
- Check collection permissions

### Role Issues
- Verify profile role is `franchise_owner`
- Check `availableRoles` includes `franchise_owner`
- Ensure profile is linked to user

## Documentation

📚 **Complete documentation:**
- `docs/franchise-owners.md` - Full owner management guide
- `docs/franchise-system.md` - Complete franchise system
- `FRANCHISE_SETUP_SUMMARY.md` - Quick reference

## Summary

✅ **12 franchise owner accounts created**
✅ **All linked to their franchises**
✅ **Ready for authentication and dashboard development**
✅ **Complete with user profiles and roles**

**Total Users Created:**
- 12 franchise owners
- 23 pros (from earlier migration)
- Plus existing admin/leader accounts

**Next**: Build the franchise owner dashboard and authentication flow!
