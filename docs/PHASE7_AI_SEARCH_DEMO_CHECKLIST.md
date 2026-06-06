# Phase 7 AI Search Demo Checklist

This checklist seeds queue rows that match the current dashboard panel in Media Assets.

## Preconditions

- `.env` contains working PocketBase admin credentials.
- `media_assets` has at least one record.
- The app is running with `npm run dev`.

## Seed Demo Data

Run the demo seed script:

```bash
npm run test:seed:media:phase7:demo
```

Optional dry run:

```bash
npm run test:seed:media:phase7:demo -- --dry-run
```

## Dashboard Checks

1. Open `/dashboard/media` and expand `AI Search and Approval`.
2. Click `Refresh Jobs`.
3. Confirm `metadata suggestion` shows at least one queued row.
4. Switch queue types and confirm each type shows one demo row.
5. Enter a keyword like `demo`, `sponsor`, or `player` and click `Search`.
6. Approve one row with the item-level `Approve` button.
7. Click `Approve Suggestions` to bulk-approve the remaining visible rows.
8. Click `Refresh Jobs` and confirm counts/statuses changed.

## Reset

To remove Phase 7 test data from the dashboard, use the panel's `Clear Test Data` button.