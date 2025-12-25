# FliHub - Business OS for FLI Golf

A scalable business operating system built with SvelteKit, PocketBase, and shadcn-svelte.

## Architecture

FliHub follows a clean 4-layer architecture:

1. **UI Layer** - Svelte components with shadcn-svelte
2. **Application Layer** - Use-cases and business workflows
3. **Domain Layer** - Business logic and rules
4. **Data Layer** - PocketBase repositories

## Project Structure

```
src/
  lib/
    domain/
      base/              # Entity, ValueObject, Result
      modules/
        people/          # Person, Manager classes
        projects/        # Project, Task classes
        money/           # Expense class
    app/
      usecases/          # Business workflows
    infra/
      pocketbase/        # PocketBase client and repositories
    stores/              # Svelte stores
    ui/                  # Shared UI components
  routes/
    auth/                # Authentication
    dashboard/           # Protected application pages
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure PocketBase

Update `.env` with your PocketBase instance URL:

```env
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=ddinsmore8@gmail.com
POCKETBASE_ADMIN_PASSWORD=MADcap(123)
```

### 3. Import PocketBase Schema

1. Start your PocketBase instance
2. Go to PocketBase Admin UI (usually http://127.0.0.1:8090/_/)
3. Navigate to Settings > Import collections
4. Import `pocketbase-schema.json`

This will create the following collections:
- **managers** - Team members and their departments
- **tasks** - Business roadmap tasks with checklists
- **people** - Contacts, sponsors, partners, pros, players
- **projects** - Tournaments, events, campaigns
- **expenses** - Financial tracking

### 4. Import Sample Data

CSV files are located in `static/csv_data/`:
- `Managers.csv` - Team members
- `Business Roadmap.csv` - Tasks and roadmap

You can import these manually through PocketBase admin or use the import utilities (coming soon).

### 5. Run Development Server

```bash
npm run dev
```

Visit the preview URL to access FliHub.

## Domain Models

### Managers
- Name, Department, Email, Phone, Goals
- Departments: Publicist, Sales, Product Development, Finance, Marketing & PR, Technical, Production, Consultant, Operations, Apparel

### Tasks
- Task name, Sub-tasks checklist, Assigned managers
- Track (Phase 1, Phase 2, Overall, Other)
- Strategic Goal (Company Growth, Brand Awareness, Revenue, etc.)
- Departments, Quarters, Start/End dates
- Budget and Income tracking
- Status (In Progress, Scheduled, Completed, Cancelled)

### People
- First/Last name, Email, Phone
- Type (Contact, Sponsor, Partner, Pro, Player, Staff)
- Status (Active, Inactive, Pending)
- Organization, Notes

### Projects
- Name, Description, Type (Tournament, Activation, Event, Campaign)
- Status (Draft, Planned, In Progress, Completed, Cancelled)
- Start/End dates, Budget, Owner
- Notes

### Expenses
- Description, Amount, Category
- Status workflow: Draft → Submitted → Approved → Paid
- Date, Project link, Receipt URL
- Submitted by, Approved by, Notes

## Authentication

Default admin credentials are in `.env`. Create user accounts through PocketBase admin panel.

## Tech Stack

- **Frontend**: SvelteKit 2, Svelte 5
- **UI Components**: shadcn-svelte, Tailwind CSS
- **Backend**: PocketBase
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design tokens

## Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type check
```

## Next Steps

1. Set up production PocketBase instance
2. Import CSV data into collections
3. Build CRUD interfaces for each module
4. Add use-case workflows
5. Implement role-based access control
6. Add data visualization and reporting
