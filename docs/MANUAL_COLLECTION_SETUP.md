# Manual Collection Setup Guide

The PocketBase SDK has an issue creating collections with fields via the API. Follow these steps to manually create the collections in the admin UI.

## Access PocketBase Admin

URL: https://pocketbase-production-6ab5.up.railway.app/_/

Login:
- Email: `ddinsmore8@gmail.com`
- Password: `MADcap(123)`

## Step 1: Delete Empty Collections

1. Go to **Collections**
2. Delete these empty collections (click ⋮ → Delete):
   - managers
   - tasks
   - broadcast_partners

## Step 2: Create Managers Collection

1. Click **New Collection** → **Base collection**
2. Name: `managers`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| name | Text | ✓ | Min: 1, Max: 255 |
| department | Select | ✓ | Values: Publicist, Sales, Product Development, Finance, Marketing and PR, Technical, Production, Consultant, Operations, Apparel |
| email | Email | ✗ | - |
| phone | Text | ✗ | - |
| goals | Editor | ✗ | - |

4. **API Rules** tab:
   - List: `@request.auth.id != ''`
   - View: `@request.auth.id != ''`
   - Create: `@request.auth.id != ''`
   - Update: `@request.auth.id != ''`
   - Delete: `@request.auth.id != ''`

5. Click **Create**

## Step 3: Create Tasks Collection

1. Click **New Collection** → **Base collection**
2. Name: `tasks`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| task | Text | ✓ | Min: 1, Max: 500 |
| subTasksChecklist | Editor | ✗ | - |
| managers | Text | ✗ | - |
| track | Select | ✗ | Values: Phase 1, Phase 2, Overall, Other |
| strategicGoal | Select | ✗ | Values: Company Growth, Brand Awareness, Revenue, Increase Revenue, Managerial Tasks, App, Legal Tasks |
| departments | Text | ✗ | - |
| quarters | Select | ✗ | Values: Q1, Q2, Q3, Q4 |
| startDate | Date | ✗ | - |
| endDate | Date | ✗ | - |
| budget | Number | ✗ | Min: 0 |
| income | Number | ✗ | Min: 0 |
| status | Select | ✓ | Values: In Progress, Scheduled, Completed, Cancelled |

4. **API Rules** tab: (same as managers)
5. Click **Create**

## Step 3: Create Broadcast Partners Collection

1. Click **New Collection** → **Base collection**
2. Name: `broadcast_partners`
3. Add fields:

| Field Name | Type | Required | Options |
|------------|------|----------|---------|
| point | Text | ✓ | - |
| details | Editor | ✓ | - |
| type | Select | ✓ | Values: Key Point, Supporting Point, Risk, Opportunity |
| category | Select | ✓ | Values: Broadcasting & Audience Growth, Viewer Engagement, Revenue Opportunities, Technology & Innovation, Brand Building, Operational Efficiency, Risk Management |
| importanceLevel | Select | ✓ | Values: High, Medium, Low |
| tags | Text | ✗ | - |
| additionalNotes | Editor | ✗ | - |

4. **API Rules** tab: (same as managers)
5. Click **Create**

## Step 4: Create User Account

1. Go to **Collections** → **users**
2. Click **New record**
3. Fill in:
   - Email: your email
   - Password: your password
   - Name: your name (optional)
4. Click **Create**

## Step 5: Test in FliHub

1. Go to: https://5173--019b57cc-69bc-764f-8e22-461d03cb7e92.us-east-1-01.gitpod.dev
2. Login with your user credentials
3. You should see the dashboard

## Done!

Your PocketBase database is now ready to use with FliHub.
