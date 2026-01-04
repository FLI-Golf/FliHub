# FliHub - Business OS for FLI Golf

A business operating system built with SvelteKit, PocketBase, and shadcn-svelte for managing projects, tasks, expenses, and team operations.

## Features

- **Project Management** - Track tournaments, events, activations, and campaigns with budget monitoring
- **Task Management** - Create and assign tasks to projects with priority levels and status tracking
- **Expense Tracking** - Record and approve expenses linked to projects
- **Team Management** - Manage team members across departments
- **Vendor Management** - Track vendor relationships and contacts
- **Dashboard** - Overview of projects, budgets, and key metrics

## Project Structure

```
src/
  lib/
    components/
      metrics/           # Metric cards, progress bars, status badges
      projects/          # Project modals and components
      tasks/             # Task modals and components
      vendors/           # Vendor components
      ui/                # shadcn-svelte UI components
    domain/              # Domain models and business logic
    infra/
      pocketbase/        # PocketBase client and repositories
    migrations/          # Database schema and migrations
  routes/
    auth/                # Authentication pages
    dashboard/           # Protected application pages
      projects/          # Project list and detail pages
      tasks/             # Task management
      expenses/          # Expense tracking
      managers/          # Team management
      vendors/           # Vendor management
    api/                 # API endpoints
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure PocketBase

Create a `.env` file based on `.env.example`:

```env
POCKETBASE_URL=https://pocketbase-production-6ab5.up.railway.app
POCKETBASE_ADMIN_EMAIL=your-admin-email@example.com
POCKETBASE_ADMIN_PASSWORD=your-admin-password
```

For local development, you can use `http://127.0.0.1:8090` if running PocketBase locally.

### 3. Database Setup

The application uses PocketBase with the following collections:

**Core Collections:**
- **projects** - Tournaments, events, activations, campaigns with budget tracking
- **tasks** - Project tasks with status, priority, hours, and due dates
- **expenses** - Financial tracking linked to projects with approval workflow
- **managers** - Team members across departments
- **vendors** - Vendor contacts and relationships
- **departments** - Organizational departments

**Strategic Planning Collections:**
- **business_objectives** - Strategic business goals
- **marketing_goals** - Marketing objectives and KPIs
- **campaigns** - Marketing campaigns
- **kpis** - Key performance indicators
- **swot_analysis** - SWOT analysis entries
- **broadcast_partners** - Broadcasting partnership details
- **brand_positioning** - Brand positioning strategies
- **digital_marketing_strategies** - Digital marketing plans
- **continuous_improvements** - Process improvement tracking
- **budgets** - Budget allocations

Schema definitions are in `src/lib/migrations/collections.ts`. Use the migration scripts to set up your database:

```bash
npm run migrate
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at the preview URL provided by your development environment.

## Data Models

### Projects
- **Name, Description, Type** - Tournament, Activation, Event, Campaign
- **Status** - Draft, Planned, In Progress, Completed, Cancelled
- **Dates** - Start date, end date, fiscal year
- **Budget** - Allocated budget, actual expenses, forecasted expenses
- **Relations** - Department, approved by, vendors
- **Approval** - Approval status and workflow

### Tasks
- **Title, Description** - Task details with rich text support
- **Project Relation** - Linked to specific projects
- **Status** - Todo, In Progress, Blocked, Completed, Cancelled
- **Priority** - Low, Medium, High, Urgent
- **Time Tracking** - Estimated hours, actual hours
- **Dates** - Start date, due date, completed date
- **Assignment** - Assigned to users, created by
- **Subtasks** - Checklist of subtasks (JSON)

### Expenses
- **Description, Amount, Category** - Expense details
- **Status** - Draft, Submitted, Approved, Rejected, Paid
- **Project Link** - Associated with projects
- **Dates** - Expense date, submission date
- **Approval** - Submitted by, approved by
- **Documentation** - Receipt URL, notes

### Managers
- **Name, Email, Phone** - Contact information
- **Department** - Publicist, Sales, Product Development, Finance, Marketing & PR, Technical, Production, Consultant, Operations, Apparel
- **Goals** - Department and personal goals (rich text)

### Vendors
- **Name, Email, Phone** - Vendor contact details
- **Type** - Vendor classification
- **Status** - Active, Inactive
- **Relations** - Linked to projects

## Authentication

FliHub uses PocketBase authentication. Configure admin credentials in `.env` and create user accounts through the PocketBase admin panel. All dashboard routes require authentication.

## Tech Stack

- **Frontend**: SvelteKit 2, Svelte 5
- **UI Components**: shadcn-svelte, Tailwind CSS
- **Backend**: PocketBase
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design tokens

## Development

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run check            # Type check
npm run check:watch      # Type check in watch mode
npm run migrate          # Run database migrations
npm run import-data      # Import data from CSV files
```

## Key Features

### Project Management
- Create and track projects (tournaments, events, activations, campaigns)
- Monitor budget vs actual expenses with visual progress bars
- Link vendors and departments to projects
- Track project status and approval workflow
- View project-specific tasks and expenses

### Task Management
- Create tasks linked to projects
- Set priority levels (low, medium, high, urgent)
- Track estimated vs actual hours
- Assign tasks to team members
- Monitor task status with visual badges
- Set due dates and track completion

### Expense Tracking
- Record expenses with categories
- Link expenses to projects
- Approval workflow (draft → submitted → approved → paid)
- Track who submitted and approved expenses
- Attach receipts and notes

### Team & Vendor Management
- Manage team members across departments
- Track vendor relationships
- Link vendors to specific projects
- Store contact information and notes
