# FliHub Documentation

Welcome to the FliHub documentation. This directory contains comprehensive guides for developers and administrators.

## Documentation Index

### Getting Started
- [Main README](../README.md) - Project overview and quick start
- [Migrations Guide](./MIGRATIONS.md) - Database setup and data import
- [Domain Models](./DOMAIN_MODELS.md) - Complete data model reference

### Architecture

**4-Layer Clean Architecture**:

```
┌─────────────────────────────────────┐
│         UI Layer (Svelte)           │
│  Components, Pages, Forms, Tables   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Application Layer (Use Cases)    │
│   Business Workflows, Orchestration │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     Domain Layer (Business Logic)   │
│  Entities, Value Objects, Schemas   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Data Layer (Repositories)        │
│    PocketBase Integration, CRUD     │
└─────────────────────────────────────┘
```

### Key Concepts

#### Type Safety
- **TypeScript** for compile-time type checking
- **Zod** for runtime validation
- Type inference from schemas

#### Validation Flow
```typescript
// 1. Define schema
const ManagerSchema = z.object({
  name: z.string().min(1),
  department: z.enum([...])
});

// 2. Infer types
type ManagerInput = z.infer<typeof ManagerSchema>;

// 3. Validate at runtime
const result = ManagerSchema.safeParse(data);
```

#### Domain-Driven Design
- Entities encapsulate business logic
- Value objects are immutable
- Repositories handle persistence
- Use cases orchestrate workflows

### Project Structure

```
src/
├── lib/
│   ├── domain/
│   │   ├── base/              # Base classes (Entity, ValueObject, Result)
│   │   ├── modules/           # Domain entities
│   │   │   ├── people/        # Person, Manager
│   │   │   ├── projects/      # Project, Task
│   │   │   └── money/         # Expense
│   │   └── schemas/           # Zod validation schemas
│   ├── app/
│   │   └── usecases/          # Business workflows
│   ├── infra/
│   │   └── pocketbase/        # Database layer
│   │       ├── pbClient.ts    # PocketBase client
│   │       └── repositories/  # Data access
│   ├── components/            # UI components
│   │   ├── ui/                # shadcn-svelte components
│   │   └── flihub-sidebar.svelte
│   ├── migrations/            # Database migrations
│   │   ├── collections.ts     # Collection schemas
│   │   ├── migrate.ts         # Migration script
│   │   └── import-data.ts     # Data import script
│   └── utils/                 # Utilities
├── routes/                    # SvelteKit routes
│   ├── auth/                  # Authentication
│   └── dashboard/             # Protected pages
├── static/
│   └── csv_data/              # Sample data
└── docs/                      # Documentation
```

### Data Models

FliHub manages several types of data:

**Core Business**:
- Managers (team members)
- Tasks (roadmap items)
- People (contacts, sponsors, pros)
- Projects (tournaments, events)
- Expenses (financial tracking)

**Marketing**:
- Brand Positioning
- Budgets
- Business Objectives
- Campaigns
- Digital Marketing Strategies
- Marketing Goals
- SWOT Analysis
- KPIs

**Partnerships**:
- Broadcast Partners (analysis points)

See [Domain Models](./DOMAIN_MODELS.md) for complete reference.

### Development Workflow

#### 1. Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Access at http://localhost:5173
```

#### 2. Database Setup

```bash
# Create collections
npm run migrate -- \
  --url=http://localhost:8090 \
  --email=admin@example.com \
  --password=password

# Import data
npm run import-data -- \
  --url=http://localhost:8090 \
  --email=admin@example.com \
  --password=password \
  --dataDir=./static/csv_data
```

#### 3. Adding New Features

**Add a new domain model**:
1. Create Zod schema in `src/lib/domain/schemas/`
2. Add collection definition in `src/lib/migrations/collections.ts`
3. Create entity class in `src/lib/domain/modules/`
4. Create repository in `src/lib/infra/pocketbase/repositories/`
5. Add UI routes in `src/routes/dashboard/`

**Add a new use case**:
1. Create file in `src/lib/app/usecases/`
2. Import domain entities and repositories
3. Implement business logic
4. Call from UI components

### Technology Stack

**Frontend**:
- SvelteKit 2 (framework)
- Svelte 5 (UI library)
- TypeScript (type safety)
- Tailwind CSS v4 (styling)
- shadcn-svelte (UI components)
- Lucide (icons)

**Backend**:
- PocketBase (database + auth)
- Zod (validation)
- csv-parse (data import)

**Development**:
- Vite (build tool)
- tsx (TypeScript execution)
- svelte-check (type checking)

### Environment Variables

```env
# PocketBase Configuration
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-password
```

### Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Type Checking
npm run check            # Check types
npm run check:watch      # Watch mode

# Database
npm run migrate          # Run migrations
npm run import-data      # Import CSV data
```

### Best Practices

#### Validation
- Always validate user input with Zod
- Use type inference for TypeScript types
- Handle validation errors gracefully

#### Error Handling
- Use Result type for operations that can fail
- Provide meaningful error messages
- Log errors for debugging

#### Code Organization
- Keep domain logic in domain layer
- Use repositories for all database access
- Put UI logic in components
- Orchestrate in use cases

#### Testing
- Validate schemas with test data
- Test domain logic independently
- Mock repositories in tests

### Deployment

#### Production Checklist
- [ ] Set up production PocketBase instance
- [ ] Update environment variables
- [ ] Run migrations
- [ ] Import data
- [ ] Create user accounts
- [ ] Test authentication
- [ ] Set up backups
- [ ] Configure SSL/HTTPS
- [ ] Set up monitoring

#### Hosting Options
- **PocketHost**: Managed PocketBase hosting
- **Railway**: Deploy PocketBase + SvelteKit
- **Vercel/Netlify**: SvelteKit frontend
- **Self-hosted**: VPS with Docker

### Support

**Documentation**:
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [PocketBase Docs](https://pocketbase.io/docs)
- [Zod Docs](https://zod.dev)
- [shadcn-svelte](https://shadcn-svelte.com)

**Community**:
- GitHub Issues
- Discord (if available)
- Email support

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

### License

ISC License - See LICENSE file for details

---

**Last Updated**: December 2024
**Version**: 1.0.0
