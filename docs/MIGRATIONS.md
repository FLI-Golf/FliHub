# Database Migrations

This document explains how to set up and migrate your PocketBase database for FliHub.

## Overview

FliHub uses PocketBase as its backend database. The migration system allows you to:

1. Create all required collections in PocketBase
2. Import data from CSV files
3. Update existing collections with schema changes

## Prerequisites

- PocketBase instance (local or production)
- Admin credentials for PocketBase
- Node.js and npm installed

## Collections

FliHub creates the following collections:

### Core Collections
- `managers` - Team members and their roles
- `tasks` - Business roadmap and task tracking
- `broadcast_partners` - Partnership analysis

### Marketing Collections
- `brand_positioning` - Brand identity and positioning
- `budgets` - Financial tracking
- `business_objectives` - High-level goals
- `campaigns` - Marketing campaigns
- `continuous_improvements` - Process improvements
- `digital_marketing_strategies` - Digital channel strategies
- `marketing_goals` - SMART marketing objectives
- `swot_analysis` - Strategic analysis
- `kpis` - Performance metrics

## Running Migrations

### 1. Create/Update Collections

This command creates all collections in your PocketBase instance:

```bash
npm run migrate -- \
  --url=https://your-pocketbase.com \
  --email=admin@example.com \
  --password=yourpassword
```

**Options**:
- `--url`: Your PocketBase URL
- `--email`: Admin email
- `--password`: Admin password
- `--dry-run`: Preview changes without applying them

**Dry Run Example**:
```bash
npm run migrate -- \
  --url=https://your-pocketbase.com \
  --email=admin@example.com \
  --password=yourpassword \
  --dry-run
```

### 2. Import CSV Data

After creating collections, import your CSV data:

```bash
npm run import-data -- \
  --url=https://your-pocketbase.com \
  --email=admin@example.com \
  --password=yourpassword \
  --dataDir=./static/csv_data
```

**Options**:
- `--url`: Your PocketBase URL
- `--email`: Admin email
- `--password`: Admin password
- `--dataDir`: Path to CSV files directory
- `--dry-run`: Preview import without creating records

**What Gets Imported**:
- `Managers.csv` → `managers` collection
- `Business Roadmap.csv` → `tasks` collection
- `FanNetApp_broadcast_partner.csv` → `broadcast_partners` collection

## Production Setup

### Step 1: Set Up PocketBase

**Option A: PocketHost (Recommended)**
1. Go to [pockethost.io](https://pockethost.io)
2. Create a new instance
3. Note your instance URL

**Option B: Self-Hosted**
1. Download PocketBase from [pocketbase.io](https://pocketbase.io)
2. Run: `./pocketbase serve --http=0.0.0.0:8090`
3. Access admin UI at `http://your-server:8090/_/`

### Step 2: Create Admin User

1. Access PocketBase admin UI
2. Create your admin account
3. Note the email and password

### Step 3: Update Environment Variables

Update `.env` with your production URL:

```env
POCKETBASE_URL=https://your-pocketbase-instance.com
POCKETBASE_ADMIN_EMAIL=your-admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password
```

### Step 4: Run Migrations

```bash
# Create collections
npm run migrate -- \
  --url=$POCKETBASE_URL \
  --email=$POCKETBASE_ADMIN_EMAIL \
  --password=$POCKETBASE_ADMIN_PASSWORD

# Import data
npm run import-data -- \
  --url=$POCKETBASE_URL \
  --email=$POCKETBASE_ADMIN_EMAIL \
  --password=$POCKETBASE_ADMIN_PASSWORD \
  --dataDir=./static/csv_data
```

## Collection Schema

Each collection includes:

### Standard Fields (Auto-generated)
- `id` - Unique identifier (UUID)
- `created` - Creation timestamp
- `updated` - Last update timestamp

### Access Rules
All collections use authenticated access:
- `listRule`: `@request.auth.id != ""`
- `viewRule`: `@request.auth.id != ""`
- `createRule`: `@request.auth.id != ""`
- `updateRule`: `@request.auth.id != ""`
- `deleteRule`: `@request.auth.id != ""`

This means users must be logged in to access any data.

## Validation

All data is validated using Zod schemas before import:

```typescript
import { ManagerSchema } from '$lib/domain/schemas';

// Validate before import
const result = ManagerSchema.safeParse(data);
if (result.success) {
  await pb.collection('managers').create(result.data);
}
```

Invalid records are skipped with a warning message.

## Troubleshooting

### Authentication Failed
- Verify your admin email and password
- Check that you're using admin credentials, not regular user credentials

### Collection Already Exists
- The migration script updates existing collections
- Use `--dry-run` to preview changes first

### Invalid Data
- Check CSV file format matches expected columns
- Review validation errors in console output
- Fix data and re-run import

### Connection Refused
- Verify PocketBase URL is correct
- Check that PocketBase is running
- Ensure firewall allows connections

## Manual Migration

If you prefer to create collections manually:

1. Access PocketBase admin UI
2. Go to Collections
3. Click "New Collection"
4. Use the schema definitions in `src/lib/migrations/collections.ts`

## Backup

Before running migrations on production:

```bash
# Backup PocketBase data directory
cp -r pb_data pb_data.backup
```

Or use PocketBase's built-in backup:
1. Go to Settings → Backups in admin UI
2. Create a backup
3. Download the backup file

## Next Steps

After successful migration:

1. Create user accounts in PocketBase admin
2. Test authentication in FliHub
3. Verify data appears in the application
4. Set up regular backups

## Support

For issues or questions:
- Check PocketBase docs: [pocketbase.io/docs](https://pocketbase.io/docs)
- Review Zod validation errors
- Check migration script logs
