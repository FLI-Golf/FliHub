# Review: Original FliHub — Expense Approval and Payment Pipeline

**Walkthrough:** `expense-approval-payment`
**Video:** `walkthroughs/output/expense-approval-payment/expense-approval-payment.mp4` (67.0s, 1280×720, narrated + captioned)
**Branch/commit reviewed:** `share-specs-for-ctg` (working tree; walkthrough scripts uncommitted per instructions)

## Scope

End-to-end demonstration of the expense approval and payment pipeline for CTG,
driven entirely through the application UI on the local dev server
(`http://localhost:5173`). No real bank account is connected. One demonstration
expense was created, approved, and recorded as a simulated payment.

## Demonstrated steps

1. **Log expense** — `/dashboard/expenses` → "Add Expense" opens the edit
   modal. Entered description `DEMO — Expense Pipeline`, amount `250`, date
   `2026-10-17`, category `Marketing`, status `Submitted`.
2. **Approval request** — setting status to `Submitted` auto-creates a pending
   approval. See [POST /api/expenses](src/routes/api/expenses/+server.ts):
   on `status === 'submitted'` it inserts an `approvals` record
   (`entityType='expense'`, `status='pending'`).
3. **Approve** — `/dashboard/approvals`, pending card → **Approve**. The quorum
   setting is `1`, so a single approver completes it. See
   [POST /api/approvals/approve](src/routes/api/approvals/approve/+server.ts).
   Approval of a plain expense **auto-creates a work order** (`WO-GEN-XXXX`)
   and marks the expense `approved`. No separate accountant "create work order"
   step exists — it is automatic.
4. **Record simulated payment** — `/dashboard/work-orders` → the work order's
   **Record in QB** → QuickBooks entry panel. Selected the **Event Operations
   Account** (unlocks the payout fields), entered QB Transaction ID
   `DEMO-CHECK-001`, clicked **Generate Payment & Save QB Entry**. See
   [PATCH /api/work-orders/[id]](src/routes/api/work-orders/[id]/+server.ts),
   which sets the work order `paid`, deducts the bank-account allocation, and
   appends an audit stamp. This records a simulated payment; no money moves.

## Roles

A single admin account (`DEMO_USER`, Dustin Dinsmore, role `admin`) performed
all steps. The approval quorum is `1`, so the same account both submitted and
approved. No role-switching was required or used.

## Record relationships

| Record | ID | Identifiers |
|---|---|---|
| Expense | `o38j0hcm9txrs6t` | status `approved`, amount `250`, `work_order_number=WO-GEN-fede` |
| Approval | `wduqfmj1god7d19` | status `approved`, `entityType=expense`, `entityId=o38j0hcm9txrs6t`, votes 1/1 |
| Work order | `qia2qmmbqcnfede` | `WO-GEN-fede`, status `paid`, source `expense`, `expenseId=o38j0hcm9txrs6t` |
| Payment (simulated) | on work order | `qb_transaction_id=DEMO-CHECK-001`, `qb_account=1040 - Event Operations Account` |

Chain: expense → approval (entityId) → work order (expenseId) → payment
(qb fields on the work order). The work-order number `WO-GEN-fede` is stamped
back onto the expense.

## Relevant code paths

- Expense create + auto-approval: [src/routes/api/expenses/+server.ts](src/routes/api/expenses/+server.ts)
- Approval + auto work-order creation: [src/routes/api/approvals/approve/+server.ts](src/routes/api/approvals/approve/+server.ts)
- Work-order QB/payment entry + bank deduction: [src/routes/api/work-orders/[id]/+server.ts](src/routes/api/work-orders/[id]/+server.ts)
- UI: [expenses](src/routes/dashboard/expenses/+page.svelte), [approvals](src/routes/dashboard/approvals/+page.svelte), [work-orders](src/routes/dashboard/work-orders/+page.svelte)

## Gaps

- **Expense status does not reach `paid`.** Recording the payment in the QB
  panel marks the **work order** `paid` and deducts the bank account, but the
  linked **expense** record stays `approved` (its `paidDate` is null). The
  `paid` status is not propagated back to the expense. Documented as-is; no
  code changed.
- **Approvals card title is generic.** The approvals list does not expand the
  expense relation, so the card shows "expense Approval" rather than the
  expense description. The demo card is identifiable by amount/status/comment.
- No external QuickBooks sync was initiated (by design); the QB transaction ID
  is a fictional reference.

## Cleanup

The demonstration records are left in place for review. Identifiers to remove:

- Expense `o38j0hcm9txrs6t`
- Approval `wduqfmj1god7d19`
- Work order `qia2qmmbqcnfede`

## Reproduce

```bash
pnpm run dev
node scripts/walkthroughs/narrate.mjs expense-approval-payment
node scripts/walkthroughs/record-expense-approval-payment.mjs
node scripts/walkthroughs/assemble.mjs expense-approval-payment
```

The recorder is idempotent: if `DEMO — Expense Pipeline` already exists it
reuses it rather than creating a duplicate.
