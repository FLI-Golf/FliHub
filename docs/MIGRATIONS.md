# Database Migrations

This document explains how to set up and migrate your PocketBase database for FliHub.

## Overview

FliHub uses PocketBase as its backend database. The migration system provides:

1. Collection schema definitions with all fields
2. Validation tools to verify import files
3. Import instructions for PocketBase admin UI

## Prerequisites

- PocketBase instance (local or production)
- Admin access to PocketBase UI
- Node.js and npm installed

## Collections

FliHub includes the following collections:

### User Management
- `user_profiles` - User roles and profile information (9 fields)
  - Roles: leader, admin, vendor, pro, franchise_owner
  - Links to PocketBase users collection

### Business Collections
- `managers` - Team members and departments (5 fields)
- `tasks` - Business roadmap and task tracking (12 fields)
- `broadcast_partners` - Partnership analysis (7 fields)
- `people` - Contacts, sponsors, partners, players (8 fields)
- `projects` - Tournaments, events, campaigns (8 fields)
- `expenses` - Financial tracking and approvals (9 fields)

## Import Process

### Option 1: JSON Import (Recommended)

1. **Validate the import file:**
   ```bash
   npx tsx scripts/prepare-import.ts
   ```

2. **Access PocketBase Admin UI:**
   - URL: `https://pocketbase-production-6ab5.up.railway.app/_/`
   - Login with your admin credentials

3. **Delete existing empty collections:**
   - Go to Collections
   - Delete: managers, tasks, broadcast_partners, people, projects, expenses

4. **Import collections:**
   - Go to Settings → Import collections
   - Upload: `json_data/pocketbase-import-no-relations.json`
   - Review the preview
   - Confirm import

### Option 2: Manual Field Addition

If JSON import fails, add fields manually to each collection.
See `docs/MANUAL_COLLECTION_SETUP.md` for detailed field definitions.

## Validation

The validation script checks:
- All collections have required fields
- Field IDs are present
- Field types are valid
- System ID field exists

Run validation anytime:
```bash
npx tsx scripts/prepare-import.ts
```

## Troubleshooting Import

### Import Preview Shows Errors
- Ensure all empty collections are deleted first
- Check that field IDs don't conflict with existing fields
- Verify JSON structure matches PocketBase format

### Collections Not Appearing
- Refresh the admin UI
- Check browser console for errors
- Verify you have admin permissions

### Fields Missing After Import
- Re-run the import (it should update existing collections)
- Check the import preview for warnings
- Use manual field addition as fallback

## Environment Setup

Update `.env` with your PocketBase URL:

```env
POCKETBASE_URL=https://pocketbase-production-6ab5.up.railway.app
POCKETBASE_ADMIN_EMAIL=your-admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-password
```

## Collection Schema

Each collection includes:

### Standard Fields (Auto-generated)
- `id` - Unique identifier (15-character alphanumeric)
- `created` - Creation timestamp
- `updated` - Last update timestamp

### Access Rules
All collections require authentication:
- `listRule`: `@request.auth.id != ""`
- `viewRule`: `@request.auth.id != ""`
- `createRule`: `@request.auth.id != ""`
- `updateRule`: `@request.auth.id != ""`
- `deleteRule`: `@request.auth.id != ""`

Users must be logged in to access any data.

## Data Validation

All domain models use Zod schemas for validation:

```typescript
import { ManagerSchema } from '$lib/domain/schemas';

const result = ManagerSchema.safeParse(data);
if (result.success) {
  // Data is valid
  await pb.collection('managers').create(result.data);
}
```

See `docs/DOMAIN_MODELS.md` for complete schema definitions.

## Next Steps

After successful import:

1. Create user accounts in PocketBase admin UI
2. Test authentication in FliHub application
3. Verify collections and data appear correctly
4. Set up regular backups in PocketBase settings
