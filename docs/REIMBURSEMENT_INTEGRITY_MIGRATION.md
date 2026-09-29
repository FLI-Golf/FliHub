# Reimbursement Integrity Migration

This migration adds metadata used by duplicate-resistant imports, business-purpose review, and recoverable administrative archival. It does not modify or delete reimbursement records.

## Review

Run the dry-run command first:

```bash
pnpm migrate:reimbursements:integrity
```

Expected changes:

- Add source transaction, import batch, bank statement, business-purpose, duplicate-review, and archive fields to `reimbursement_items`.
- Create the server-only `reimbursement_item_audit` collection.
- Add lookup indexes for source transaction IDs, import batches, archived items, and audit records.

## Apply

After reviewing the dry-run output and taking a current PocketBase backup:

```bash
pnpm migrate:reimbursements:integrity:apply
```

Do not backfill or shift historical transaction dates. Existing PocketBase values already contain the intended date; the one-day discrepancy was in browser presentation.

Do not archive suspected duplicates or confirm ATGPay transactions without administrator review of receipts, statements, and business purpose.