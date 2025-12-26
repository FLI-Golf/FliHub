# Registration Debug Guide

## Issue
User registration creates a user but not a user_profile, and doesn't redirect to dashboard.

## Changes Made

### 1. Added Console Logging to Registration (`src/routes/auth/register/+page.server.ts`)
- Logs when registration starts
- Logs when user is created (with user ID)
- Logs when user_profile is created (with profile ID)
- Logs authentication status
- Logs detailed error information

### 2. Added Session Logging to Hooks (`src/hooks.server.ts`)
- Logs session state on every request
- Shows: URL, isValid, userId, email
- Logs auth refresh success/failure

## How to Debug

### Step 1: Check if user_profiles collection exists in PocketBase
1. Go to PocketBase Admin: https://pocketbase-production-6ab5.up.railway.app/_/
2. Check if `user_profiles` collection exists
3. If not, import: `json_data/user_profiles_import.json`

### Step 2: Try Registration Again
1. Open browser console (F12)
2. Go to registration page
3. Fill out the form and submit
4. Check the server logs for console output

### Expected Console Output (Success):
```
Starting registration for: test@example.com
User created: abc123xyz
User profile created: def456uvw
User authenticated: Token received
Auth store valid: true
Auth store model: abc123xyz
Session state: { url: '/dashboard', isValid: true, userId: 'abc123xyz', email: 'test@example.com' }
```

### Expected Console Output (Failure):
```
Starting registration for: test@example.com
User created: abc123xyz
Registration error: [error details]
PocketBase validation errors: { userId: { message: '...' } }
```

## Common Issues

### Issue 1: user_profiles collection doesn't exist
**Solution:** Import `json_data/user_profiles_import.json` into PocketBase

### Issue 2: userId field validation error
**Possible causes:**
- userId field not configured correctly in user_profiles collection
- userId should be a text field, not a relation
- Check that the field exists and accepts text values

### Issue 3: Redirect not working
**Possible causes:**
- Error being caught before redirect
- Auth not persisting in cookie
- Dashboard route requires authentication

### Issue 4: Permission denied
**Possible causes:**
- createRule on user_profiles collection too restrictive
- Should be: `@request.auth.id != ''` (any authenticated user can create)

## Verification Steps

1. **Check user was created:**
   - Go to PocketBase Admin → Collections → users
   - Verify new user exists

2. **Check user_profile was created:**
   - Go to PocketBase Admin → Collections → user_profiles
   - Verify profile exists with matching userId

3. **Check authentication:**
   - Look for "Auth store valid: true" in console
   - Check browser cookies for pb_auth

4. **Check redirect:**
   - Should see "Session state: { url: '/dashboard', ... }" in console
   - Browser should navigate to /dashboard

## Quick Fix Checklist

- [ ] Import user_profiles_import.json to PocketBase
- [ ] Verify createRule allows authenticated users
- [ ] Check userId field is text type (not relation)
- [ ] Verify status field has 'active' as valid option
- [ ] Verify role field has 'leader' as valid option
- [ ] Check dashboard route exists and is accessible
- [ ] Clear browser cookies and try again
- [ ] Check server logs for detailed error messages
