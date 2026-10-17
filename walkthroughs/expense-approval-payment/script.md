# Walkthrough Script: Expense Approval and Payment Pipeline

This is the editable source for the `expense-approval-payment` walkthrough.
Edit beats below, then rebuild — narration, captions, and timing all derive
from this file. `beats.json`, captions, audio, and video are generated
artifacts under `walkthroughs/output/`; do not edit them by hand.

Fields per beat:

- `at` — optional fixed start time in seconds (used for the opening beat).
- `pause` — optional silence (seconds) after this beat's narration before the
  next beat starts. Defaults to 0.9s; the final beat's closing hold defaults
  to 3s.
- `action` — the recorder action to perform (see record-expense-approval-payment.mjs).
- `caption` — text shown on screen AND the narration source. Brand spellings
  stay intact here; the spoken form is derived automatically (FliHub → "Fly
  Hub"). Add `- say:` only when the spoken form must differ from the caption.

### Beat 1
- at: 0.4
- action: open-expenses
- caption: In FliHub, an administrator logs a new expense from the Expenses page.

### Beat 2
- action: open-form
- caption: We open the Add Expense form.

### Beat 3
- action: fill-core
- caption: We describe it as a demo expense pipeline and set the amount to two hundred fifty dollars.
- say: We describe it as a demo expense pipeline, and set the amount to two hundred fifty dollars.

### Beat 4
- action: fill-submit
- caption: We choose the Marketing category and set the status to Submitted.
- say: We choose the Marketing category and set the status to Submitted, which sends it for approval.

### Beat 5
- action: save-expense
- caption: Saving the expense automatically creates a pending approval request.

### Beat 6
- action: show-approval
- caption: In Approvals, the new request appears as pending review.

### Beat 7
- action: approve
- caption: The reviewer approves it, and approval automatically generates a linked work order.

### Beat 8
- action: show-work-order
- caption: On Work Orders, the approved expense now has a work order ready for payment.

### Beat 9
- action: record-payment
- caption: The accountant selects the Event Operations Account and records a simulated payment with reference DEMO-CHECK-001. This records the payment; no money is transferred.
- say: The accountant selects the Event Operations Account and records a simulated payment with reference demo check zero zero one. This records the payment. No money is transferred.

### Beat 10
- action: verify-final
- caption: The expense, approval, work order, and payment are now linked and marked complete.
