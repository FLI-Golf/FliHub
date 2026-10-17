# Walkthrough Script: Add a Test Project

This is the editable source for the `add-test-project` walkthrough. Edit beats
below, then rebuild — narration, captions, and timing all derive from this
file. `beats.json`, captions, audio, and video are generated artifacts under
`walkthroughs/output/`; do not edit them by hand.

Fields per beat:

- `at` — optional fixed start time in seconds (used for the opening beat).
- `pause` — optional silence (seconds) after this beat's narration before the
  next beat starts. Defaults to 0.9s; the final beat's closing hold defaults
  to 3s.
- `action` — the recorder action to perform (see record-add-test-project.mjs).
- `caption` — text shown on screen AND the narration source. Brand spellings
  stay intact here; the spoken form is derived automatically (FliHub → "Fly
  Hub").

### Beat 1
- at: 0.4
- action: open-projects
- caption: From the Projects page in FliHub, an administrator can add a new project.

### Beat 2
- action: open-form
- caption: We'll create Test Project in the Executive department, with the Activation type.

### Beat 3
- action: fill-identity
- caption: We enter the name, choose the Executive department, and set the type to Activation.

### Beat 4
- action: fill-dates
- caption: The project starts October tenth, twenty twenty-six, and ends January tenth, twenty twenty-seven.

### Beat 5
- action: fill-budget
- caption: We set the budget to five thousand dollars, the forecasted amount to four thousand dollars, and the year to twenty twenty-seven.

### Beat 6
- action: review-form
- caption: We pause to review the completed form before saving.

### Beat 7
- action: save-project
- caption: After reviewing the details, we save the project.

### Beat 8
- action: verify-saved
- caption: After reloading, the saved project appears with the values we entered, ready for review.
