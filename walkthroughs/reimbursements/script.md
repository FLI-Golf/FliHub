# Walkthrough Script: Read-only Reimbursement Review

Editable captions and narration source for `reimbursements`. Actions are
implemented in `scripts/walkthroughs/record-reimbursements.mjs`. Generated timing,
audio, captions and video belong in `walkthroughs/output/reimbursements/`.
Only synthetic demonstration data may appear. No records are changed.

### Beat 1
- at: 0.4
- action: open-claimant
- caption: This is a read-only review of reimbursements in the local FliHub development app.

### Beat 2
- action: show-summary
- caption: The claimant view shows a configured claim cap and review, approval, payment, and claim summaries.

### Beat 3
- action: show-vault
- caption: The Bank Statement Vault lists demonstration files. We do not open, upload, or delete any documents.

### Beat 4
- action: show-items
- caption: The item finder displays dates, categories, notes, work order references, receipt counts, and amounts.

### Beat 5
- action: show-claim
- caption: Expanding a claim reveals its line items and review context, without submitting or editing it.

### Beat 6
- action: show-new-claim
- caption: The blank new-claim form has a title, item descriptions and amounts, optional vendor and receipt fields, and save controls. We close it without saving.

### Beat 7
- action: show-admin
- caption: This demo account can open the admin view, including duplicate and business-purpose review panels. Access does not prove permission to perform every action.

### Beat 8
- action: show-admin-detail
- caption: The admin claim detail exposes review controls. We inspect the view without approving, rejecting, paying, or changing settings.

### Beat 9
- action: show-payment-filter
- caption: The approved-status filter is available. A payment form is not demonstrated when there are no matching claims.

### Beat 10
- action: finish
- caption: This review demonstrates screen access, not payment execution, receipt persistence, or other-role authorization. Those checks remain separate.
