# Imported CSV Archive Template

Purpose: keep a clean historical trail of every CSV applied through the import UI.

## Naming Convention

Use this filename format when archiving a file after a successful apply:

`<source-name>__imported_<YYYY-MM-DDTHH-mm-ssZ>.csv`

Example:

`sponsor-outreach-project-tasks__imported_2026-06-25T14-30-00Z.csv`

## Required Sidecar Metadata

For each archived CSV, create a matching metadata file:

`<same-base-name>.meta.md`

Example:

`sponsor-outreach-project-tasks__imported_2026-06-25T14-30-00Z.meta.md`

## Metadata Template

Copy and fill this block into the `.meta.md` file:

```md
# Import Archive Metadata

- Source CSV: sponsor-outreach-project-tasks.csv
- Archived CSV: sponsor-outreach-project-tasks__imported_YYYY-MM-DDTHH-mm-ssZ.csv
- Imported At (UTC): YYYY-MM-DDTHH:mm:ssZ
- Imported By: <name or handle>
- Import Endpoint: /api/import/project-tasks
- Target Project: <project name>
- Target Project ID: <project id>
- Mode: dry-run | apply
- Result: created=<n>, updated=<n>, skipped=<n>, failed=<n>
- Notes: <optional context>
```

## Quick Steps

1. Apply import in UI.
2. Copy source CSV into this folder using the naming convention.
3. Create the matching `.meta.md` file from the template.
4. Commit both files if you want the archive tracked in git.
