# Quick Setup - Copy & Paste Method

The fastest way to set up your collections is to use the PocketBase admin UI.

## Access Admin

URL: https://pocketbase-production-6ab5.up.railway.app/_/

Login: `ddinsmore8@gmail.com` / `MADcap(123)`

## Option 1: Import JSON (Recommended)

1. Go to **Settings** (gear icon) → **Import collections**
2. Download this file from the repo: `json_data/pocketbase-business-collections.json`
3. **IMPORTANT**: Before importing, go to Collections and **delete** the empty managers, tasks, and broadcast_partners collections
4. Upload the JSON file
5. Review and confirm import

## Option 2: Manual Field Addition

If import doesn't work, add fields manually to each existing collection:

### Managers Collection

Click on **managers** → **Fields** tab → Add these fields:

```
name (Text) - Required, Min: 1, Max: 255
department (Select) - Required, Values: Publicist, Sales, Product Development, Finance, Marketing and PR, Technical, Production, Consultant, Operations, Apparel
email (Email) - Optional
phone (Text) - Optional
goals (Editor) - Optional
```

### Tasks Collection

Click on **tasks** → **Fields** tab → Add these fields:

```
task (Text) - Required, Min: 1, Max: 500
subTasksChecklist (Editor) - Optional
managers (Text) - Optional
track (Select) - Optional, Values: Phase 1, Phase 2, Overall, Other
strategicGoal (Select) - Optional, Values: Company Growth, Brand Awareness, Revenue, Increase Revenue, Managerial Tasks, App, Legal Tasks
departments (Text) - Optional
quarters (Select) - Optional, Values: Q1, Q2, Q3, Q4
startDate (Date) - Optional
endDate (Date) - Optional
budget (Number) - Optional, Min: 0
income (Number) - Optional, Min: 0
status (Select) - Required, Values: In Progress, Scheduled, Completed, Cancelled
```

### Broadcast Partners Collection

Click on **broadcast_partners** → **Fields** tab → Add these fields:

```
point (Text) - Required
details (Editor) - Required
type (Select) - Required, Values: Key Point, Supporting Point, Risk, Opportunity
category (Select) - Required, Values: Broadcasting & Audience Growth, Viewer Engagement, Revenue Opportunities, Technology & Innovation, Brand Building, Operational Efficiency, Risk Management
importanceLevel (Select) - Required, Values: High, Medium, Low
tags (Text) - Optional
additionalNotes (Editor) - Optional
```

## Verify Setup

After adding fields, each collection should show the correct number of fields:
- managers: 5 fields
- tasks: 12 fields
- broadcast_partners: 7 fields

## Create User Account

1. Go to **Collections** → **users**
2. Click **New record**
3. Enter email and password
4. Click **Create**

## Test Login

Visit: https://5173--019b57cc-69bc-764f-8e22-461d03cb7e92.us-east-1-01.gitpod.dev

Login with your user credentials.

You should see the dashboard!
