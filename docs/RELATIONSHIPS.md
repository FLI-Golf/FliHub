# Collection Relationships

## Current Implementation

All collections currently use **text fields** for references instead of PocketBase relation fields.

### Why Text Fields?

1. **Simpler initial setup** - No need to create records in specific order
2. **Flexible data entry** - Can store names, IDs, or comma-separated lists
3. **CSV import friendly** - Direct mapping from CSV columns
4. **No referential integrity constraints** - Can reference items that don't exist yet

### Current Text Reference Fields

**tasks collection:**
- `managers` (text) - Comma-separated manager names or roles
- `departments` (text) - Department names

**expenses collection:**
- `submittedBy` (text) - Person name or ID
- `approvedBy` (text) - Person name or ID

## Future: Adding Relations

When the application grows, consider converting to relation fields:

### Potential Relations

```
tasks → managers (many-to-many)
  - Replace text field with relation field
  - Link tasks to actual manager records
  - Enable queries like "show all tasks for this manager"

expenses → people (many-to-one)
  - submittedBy → people.id
  - approvedBy → people.id
  - Track who submitted/approved each expense

projects → people (many-to-many)
  - Add team members relation
  - Link projects to participants

tasks → projects (many-to-one)
  - Link tasks to specific projects
  - Enable project-based task filtering
```

### Migration Strategy

When ready to add relations:

1. **Create new relation fields** alongside existing text fields
2. **Migrate data** - Parse text fields and create proper links
3. **Update application code** to use relation fields
4. **Test thoroughly** before removing text fields
5. **Remove old text fields** once migration is verified

### Example: Converting tasks.managers

**Current:**
```json
{
  "task": "Begin PR Strategy",
  "managers": "Publicist, Marketing Team"
}
```

**With Relations:**
```json
{
  "task": "Begin PR Strategy",
  "managers": ["manager_id_1", "manager_id_2"],
  "managersText": "Publicist, Marketing Team"  // Keep as backup
}
```

## Benefits of Relations

- **Data integrity** - Can't assign non-existent managers
- **Automatic updates** - Manager name changes reflect everywhere
- **Better queries** - Filter tasks by manager record
- **Cascading deletes** - Optional: remove tasks when manager deleted
- **Expand records** - Fetch full manager details with tasks

## Keeping Text Fields

For now, text fields are appropriate because:
- Simple data model
- Direct CSV import
- Flexible data entry
- No complex queries needed yet
- Easier to maintain

## Recommendation

**Current phase:** Keep text fields, focus on getting data in and application working.

**Next phase:** Add relations when you need:
- Manager dashboards
- Complex filtering
- Data integrity enforcement
- Automated workflows
