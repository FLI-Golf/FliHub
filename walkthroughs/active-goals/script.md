# Walkthrough Script: Active Goals

Editable caption/narration source for `active-goals`. Actions are implemented in
`scripts/walkthroughs/record-active-goals.mjs`. Generated artifacts belong under
`walkthroughs/output/active-goals/`. Use synthetic demonstration data only.

### Beat 1
- at: 0.4
- action: show-navigation
- caption: In the local FliHub app, choose Active Goals from the sidebar. This is a marketing goal dashboard, separate from projects and individual tasks.

### Beat 2
- action: open-active-goals
- caption: Active Goals is a daily meeting view. It shows goals whose status is In Progress, with a link to all marketing goals.

### Beat 3
- action: show-summary
- caption: The overview summarizes active goals, open tasks, tasks needing approval, and approved spend. These are demonstration figures, not approved product rules.

### Beat 4
- action: show-goal-card
- caption: A goal card shows its name, description, status, priority, target metric, and current progress. It also summarizes due dates, task workload, and costs.

### Beat 5
- action: show-task-list
- caption: Expand the task list to inspect work supporting this goal. Report and expense controls are visible where available, but we do not generate reports or log expenses.

### Beat 6
- action: open-goal
- caption: View opens the existing goal's detail page. Here we can read its category, deadline, current value, target, and progress without updating the goal.

### Beat 7
- action: show-task-detail
- caption: Tasks are related records, not the goal itself. Expanding a task shows its details and any available linked records. We do not move or delete tasks.

### Beat 8
- action: show-task-form
- caption: Add Task opens a form for a title, description, priority, due date, estimated cost, progress contribution, and notes. We cancel without entering or saving anything.

### Beat 9
- action: show-all-goals
- caption: Back to Goals opens the broader Marketing Goals list. The active view has no search or status filter; this link provides navigation beyond in-progress goals.

### Beat 10
- action: finish
- caption: This read-only tour demonstrates inspection only. Updates, expenses, approvals, and other-role permissions remain untested.
