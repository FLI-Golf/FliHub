# Walkthrough Script: Content Pipeline

Editable caption/narration source for `content-pipeline`. The recorder reads
counts from the loaded UI; no example totals are baked into this script.
Use confirmed synthetic demonstration records only.

### Beat 1
- action: show-navigation
- caption: Choose Content Pipeline from the sidebar. This local FliHub view tracks content from brief to payment, without proving that money has been transferred.

### Beat 2
- action: show-summary
- caption: The loaded totals appear here: Total, Brief, Shoot, Edit, Approval, Published, and Paid. These counts come from the existing records, not a fixed example.

### Beat 3
- action: show-approval-indicator
- caption: The approval-waiting banner counts items requiring approval with a pending decision. That count is distinct from the number of cards in the Approval stage.

### Beat 4
- action: show-board-start
- caption: The board groups content into stage columns. Cards show a title, description preview, content type, and available department, budget, date, and approval tags.

### Beat 5
- action: show-board-end
- caption: Scroll sideways to see Approval, Published, and Paid. We do not drag cards or use their move controls. Paid is a tracked label, not evidence of a bank transfer.

### Beat 6
- action: show-detail
- caption: Selecting an existing card opens its detail panel. We inspect the loaded fields and linked task section without editing content or opening published links.

### Beat 7
- action: show-review-detail
- caption: An item awaiting approval can expose Approve and Reject controls. Source code would publish on approval or return the item to Edit on rejection. Neither action is demonstrated.

### Beat 8
- action: show-published-detail
- caption: This published-stage item shows a budget and due date, but no published link or actual cost. Its stage label alone does not verify publication or payment.

### Beat 9
- action: show-form-top
- caption: New Content opens a blank form with title, content type, due date, department, related project, and description. We do not enter or submit data.

### Beat 10
- action: show-form-bottom
- caption: Budget, notes, and an approval checkbox complete the form. We cancel without saving.

### Beat 11
- action: finish
- caption: Inspection only: no changes, approvals, publishing, payments, seeds, or resets. Other roles remain untested.
