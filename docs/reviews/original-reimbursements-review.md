# FliHub Original reimbursement review for CTG

## Review context and verification limits

| Item | Reviewed context |
|---|---|
| Date | 2026-10-17 |
| Local branch | `share-specs-for-ctg` |
| Local commit | `3ff5c279f4a4a8f706cf8599a68d7479a852dead` |
| Reviewed app | **Local development environment**, <http://localhost:5173/> inside the Codespace |
| Codespace forwarding URL | <https://fluffy-enigma-qv66jp7jgq29q65-5173.app.github.dev/> |
| Reviewed screens | <http://localhost:5173/dashboard/reimbursements> and <http://localhost:5173/dashboard/reimbursements/admin> |
| Source scope | Original's claimant/admin screens, reimbursement APIs, validation/integrity helpers, import service, related approval/work-order/payment/file APIs, and checked-in schema references |
| Deployed version | Netlify deployment SHA remains unknown. The current runtime review is of the local dev server at the local commit above, not the deployment. |

**Local UI verification succeeded.** The dev server was restarted with the repository's `pnpm run dev` command on port 5173 for the consolidated walkthrough; the local login page returned HTTP 200. Playwright used `http://localhost:5173`, filled the login form using privately loaded demo configuration through the shared walkthrough config, and signed in normally. The local login POST returned HTTP **200** with a redirect action, reached `/dashboard`, and did not contain the invalid-credentials or cross-site-POST rejection messages. Both reimbursement views were accessible to this one demo account. No other accounts/roles or server-side denial cases were exercised; access to an admin-labelled view does not establish the account's precise role or prove mutation authorization.

**Earlier Netlify result is historical and separate.** The earlier attempt at `https://flihub.netlify.app/auth/login` returned HTTP 403 and stayed on `/auth/login`, without the exact invalid-password message. The dev server had not been running for that attempt. No conclusion about local authentication or password validity follows from that result; the local app did not reproduce it.

**Consolidated recording:** [reimbursements.mp4](../../walkthroughs/output/reimbursements/reimbursements.mp4), **115.48 seconds**, H.264 video with AAC narration, 1280 x 720, 3,269,025 bytes, verified with `ffprobe`. Ten speech clips were generated through the repository's existing narration tool, timed to completed UI actions, and assembled with burned-in captions. `ffmpeg` audio analysis confirmed non-silent output (mean -27.6 dB, peak -1.3 dB); this checks the audio signal, not subjective listening quality. Sample frames were inspected for framing and rendered credential masking, then the temporary check images were removed.

Reproducible sources follow the existing walkthrough conventions: [instructions](../../walkthroughs/reimbursements/walkthrough.md), [editable narration/captions](../../walkthroughs/reimbursements/script.md), and [Playwright recorder](../../scripts/walkthroughs/record-reimbursements.mjs). Generated video, captions, manifests and the [sanitized observations](../../walkthroughs/output/reimbursements/reimbursements.observations.json) are under the ignored `walkthroughs/output/reimbursements/` directory. The earlier **silent** 53.76-second VP9 recording (1440 x 1000, 7,668,296 bytes) was copied into that directory as [original-reimbursements-local.webm](../../walkthroughs/output/reimbursements/original-reimbursements-local.webm); its original session artifact was preserved. It is not the narrated deliverable.

The user explicitly confirmed that all visible account/claim/statement information is synthetic demonstration data before recording began. That is user-provided provenance, not an independent audit of the database. Recording started in a new browser context **after successful UI authentication**; session state was transferred only in process memory and never written to disk. Credential text was masked in the rendered document. No login/password entry, tokens, cookies or storage-state files were recorded/exported. Only generic walkthrough text, not application data or credentials, was sent through the existing speech-generation integration.

The temporary Playwright contexts allowed the UI sign-in POST and blocked other browser-side mutation requests. The completed recording reported **0 non-login mutation requests** and **0 browser page errors**. Only section/detail expansion, modal opening/closing, navigation and a status filter were used; no claim data was entered or saved. No reimbursement records were created, edited, submitted, approved, rejected, paid, deleted, uploaded, seeded, or reset; no settings were changed. No direct PocketBase queries were performed. Server-internal authentication/session side effects were not audited. No receipt/statement file contents were opened. Browser contexts were closed after recording. No screenshots or page dumps were retained.

**Passing tests:** `pnpm run test:reimbursements` was rerun against the same local commit after the local walkthrough: **23 passed, 0 failed, 0 skipped, 0 cancelled**, exit code 0. These test date/matching/purpose helpers, archive planning/ID normalization and mocked import rollback. They do not verify live mutations, endpoint permission enforcement or accounting integration. The earlier test-discovery tool did not discover these files; the repository script runs them successfully. No build, migrations, live mutation tests or cross-repository parity checks were run.

### Locally demonstrated walkthrough

- Opened the claimant screen and observed the claim-cap panel, Pending Review, Approved (Unpaid), Total Paid Out and Total Claims summaries, New Claim, and Admin View.
- Expanded My Claims, the item finder and Bank Statement Vault. Populated demonstration tables exposed file/upload/action columns and item description/date/category/notes/WO#/receipt-count/amount/actions columns. File/receipt contents and record-changing actions were not invoked.
- Expanded a claimant claim header to display its detail. Opened the blank new-claim dialog, inspected field types/required attributes and save/cancel controls, then closed it without entering or submitting data. Description and amount were not HTML-required; title was required; amount input minimum/step were 0.01.
- Followed Admin View, observed Duplicate Audit and Business Purpose Review panels and the claims table (status, claimant, title, item count, amount, reference, actions), then expanded an admin claim detail.
- Approve and Reject buttons and Roll Up Selected were visible. An approved-status filter was applied, but no Mark Paid toggle/payment form was demonstrated with the available filtered records. Start Review and Force Submit were not visible in the sampled view. Their source implementations are not evidence that those controls were observed.
- No role switching, permission bypass, record mutation, validation submission, receipt upload/download, payment or external integration was performed.

## Executive findings

Original implements a database-backed reimbursement workflow with claims, line items, optional receipt attachments, a user-scoped bank-statement vault, administration, duplicate/business-purpose review, CSV import, and work-order/accounting handoffs. It is a useful workflow reference, **not a ready-made specification or proof of parity with FliHub-2 Shared**.

Priority consolidation concerns found in local source:

1. New-claim receipt inputs are not wired to either save handler.
2. Direct claim approval/payment and the shared quorum approval/work-order flow have different effects and controls.
3. Role-gated UI visibility is broader than server permission to review, pay, or edit settings; some endpoints lack the ownership checks present on adjacent endpoints.
4. Multi-record writes and read-modify-write totals can partially succeed or diverge.
5. Financial finalization is enforced inconsistently between ordinary editing, audited archival, and bulk deletion.
6. Department context exists, but the new-claim flow has no project selector or direct claim-project relationship in the inspected code.

These are source findings, not live reproductions. Demo values, current caps, role lists, matching heuristics, and suggestions in this report are implementation observations or proposals requiring CTG/product agreement.

## What the workflow does

### Main steps implemented in source

1. **Open claimant screen:** session authentication loads the user's profile; the server fetches that profile's claims, non-archived items, vendors, user-owned bank statements, configured cap, and a department/head information card. Eligible roles also receive administration navigation and summaries.
2. **Build a claim:** enter a title, one or more described positive-amount line items, and optional dates, category, vendor, notes, and receipt selections. The modal computes a total and remaining cap. There is no department/project selector here.
3. **Save or submit:** `POST /api/reimbursements` creates a draft and initial items. "Save & Submit" additionally PATCHes its status to `submitted`. An existing draft also offers "Submit for Review". This is not automatically a shared approval-queue record.
4. **Review:** the dedicated admin screen offers status transitions and notes, duplicate groups, business-purpose confirmation, bulk actions, and claim rollup. Separate `request-approval` and shared approvals APIs support an approval-queue/quorum route.
5. **Approve/pay/account:** direct claim PATCH can set approved/paid. The quorum route can create an open reimbursement work order; the work-order route records manually entered QuickBooks references, can mark the claim paid, and can create a reporting expense.
6. **Maintain evidence/history:** attach/remove receipts on existing items; upload/view/delete bank-statement PDFs; import reimbursement CSV rows through preview/classification and selected application. Audited item review supports keep/archive/restore and purpose confirmation, subject to schema availability.

No external transfer of money, QuickBooks API synchronization, tax assessment, or compliance certification was verified. UI claims about "Tax-Exempt Reimbursements", CPA review, or IRS treatment are labels/instructions, not validated legal or accounting conclusions.

## Feature evidence table

Legend: **UI observed** = actual Playwright result; **source inspected** = local implementation; **unverified** = not established in this review.

| Feature | UI-observed behavior | Source-inspected behavior | Unverified / qualification |
|---|---|---|---|
| Authentication | Local login POST 200, redirect action, authenticated dashboard and both reimbursement screens reached. Earlier Netlify POST 403 is separate. | Login authenticates PocketBase `users`, then looks up `user_profiles` for role routing. | Exact demo role and other-role denials not tested; Netlify rejection cause unresolved. |
| Summaries | Claimant cap and all four summary labels visible. Admin screen loaded its summary/audit UI. | Pending counts submitted + under-review; money summaries sum stored claim totals; admin pipeline includes status counts and money summaries. | Display is demonstrated, underlying arithmetic/completeness not independently reconciled. No specific demo amounts are requirements. |
| Claim list/detail | My Claims expanded; a claimant detail and an admin detail opened; populated item tables rendered. | Header title/count/date/reference/total/status; detail pipeline, line items, notes/reference/payment context; draft-specific submit/delete. | Not every conditional/status variant observed; no edits/deletes performed. |
| Statuses | Admin status filter was used with approved then reset; not all status examples observed. | `draft`, `submitted`, `under_review`, `approved`, `paid`, `rejected`; admin calls submitted "Pending". | State transitions not exercised; filter options are not proof each status has records. |
| Search/filter/sort | Item finder/table and admin claims/filter UI observed; approved-status filter used. | Item text search and column sorting; admin title/claimant/reference search, status/claimant filters and sorting. | Search, all sort keys, all filters and large-data correctness not exhaustively exercised. |
| Claim cap | Cap panel and blank-dialog total summary visible; no edit attempted. | Setting with fallback **1500**; checks across create/submit/recalc/items/restore/rollup/import. | Boundary rejection not tested live; displayed configuration is not approved policy. |
| New claim | Blank modal opened/closed; title required, description/amount fields, optional date/category/vendor/manual vendor/notes/receipts; Add Another Item, Cancel and both save buttons observed. | Manual handlers validate title/positive described lines and cap; amount min/step 0.01. | No field entry, validation submission or persistence performed. |
| Receipt handling | Multiple-file picker observed with JPEG/PNG/WebP/HEIC/PDF accept list; item receipt-count column visible. No files selected/opened. | Existing-item upload/remove APIs; new-form save handlers omit receipt files. | Source wiring defect not reproduced by submission; actual file limits/protection remain unverified. |
| Department/project | New-claim input inventory showed no department/project selector; contact links were detected on claimant page without retaining their values. | Default department lookup/head card and API-supplied department; no direct claim-project relation. | Department-specific eligibility, project allocation, budget reservation and routing not verified. |
| Review/approve/reject | Admin view/detail, Approve and Reject visible but not clicked; Start Review/Force Submit not visible in sample. | Direct PATCH differs from separate request-approval/quorum path. | No reviewer mutation, quorum or permission denial tested. |
| Payment/accounting | No Mark Paid/payment form demonstrated in sampled approved-status view; no payment action invoked. | Source has reference/method/date controls, direct paid effects, shared WO/QB/accounting effects. | Controls/effects remain source-only where not observed; external payment and QB synchronization unverified. |
| Duplicate/purpose review | Duplicate Audit and Business Purpose Review panels visible; no decisions invoked. | Matching/purpose heuristics, keep/archive/restore/reason/audit snapshots; schema guard. | No decision persistence or migration guard exercised live; not proof of tax/business purpose. |
| Bank statements | Vault expanded and populated file/uploaded/action columns observed. No PDF opened, upload selected or delete invoked. | Own-user upload/view/delete; PDF validation; base collection one PDF/10 MiB. | File access authorization, content and size enforcement not tested; no parsing/reconciliation established. |
| CSV import | Not demonstrated; outside recorded screens. | Separate Import screen and admin/leader preview/apply branch with duplicate classification/grouping/rollback. | Preview/apply and CSV export not exercised. |
| Export | No dedicated reimbursement export observed in this walkthrough. | No dedicated CSV/PDF claim export found in inspected claimant/admin/API paths. | Uploaded statement retrieval is not claim export; no Shared parity claimed. |
| Tests | Not a UI result. | Existing local reimbursement test script passes all 23 tests. | Covers date/matching/purpose helpers, archive planning/ID normalization and mocked import rollback; not full API/state-machine/auth/UI coverage. |

## New-claim validation and persistence

Starting points: [claimant screen](../../src/routes/dashboard/reimbursements/+page.svelte), [create API](../../src/routes/api/reimbursements/+server.ts), [schema](../../src/lib/domain/schemas/reimbursement.schema.ts).

- Title is marked required and trimmed by UI/API. UI save handlers require at least one line with trimmed description and positive numeric amount, and discard other rows from the payload.
- Amount input has `min="0.01"` and `step="0.01"`. Description/amount carry asterisks but not HTML `required`; footer buttons call handlers outside the form, so the manual handler checks, not native form validation alone, matter.
- Categories are travel, meals, equipment, software, marketing, legal, office, other. Default category is other. Date is optional; server normalizes valid date/timestamp inputs to `YYYY-MM-DD` and rejects supplied invalid dates.
- Vendor may be a relation (`vendorId`) or free text. When vendors exist, a dropdown plus manual-entry fallback is rendered. Choosing a relation clears free-text vendor.
- Claimant is normally the current `user_profiles.id`, distinct from the PocketBase auth user ID. Admin/leader API callers can supply another claimant. The claim department is caller-supplied or a name-based lookup, not enforced as one fixed department despite the source comment saying "Always link".
- `POST` creates a draft claim, then creates initial items sequentially and updates its total. It returns the original created claim object rather than reloading the final total. No transaction or full rollback protects this initial-create sequence.
- Cap checks sum JavaScript numeric amounts. The create endpoint does not parse the Zod claim/item schemas: it only partially validates input and skips initial rows with missing description/falsy amount. It does not mirror all UI positive/finite amount, category, length, or minimum-item constraints. Separate add-item API has stronger positive amount and draft checks; edit-item does not have an equivalent explicit positive/finite amount check.
- Zod length/minimum declarations are useful intent, not proof all endpoints enforce them. Deployed PocketBase validation was not inspected.
- **Receipt wiring defect:** both new-form save handlers serialize `receipts: undefined` and neither calls the upload helper after creation. Selecting a receipt in this modal does not upload it through these handlers. Existing-item attachment is a separate functioning source path, not a tested workaround.
- "Save & Submit" creates first, then PATCHes `submitted` without checking that PATCH response's success before closing/resetting the modal. A failed submission can leave a saved draft while appearing complete.

## Data relationships and implementation paths

There is no dedicated reimbursement repository class in the inspected [PocketBase repositories directory](../../src/lib/infra/pocketbase/repositories). Page loaders, APIs, and server helpers use `pb.collection(...)` directly.

| Collection / model | Relationships and responsibilities found in source |
|---|---|
| `users` / `user_profiles` | Login identity vs operational profile. Claimant points to profile; statement `user` points to auth user. Profile role controls application checks. |
| `reimbursement_claims` | Header title/status/claimant/department/notes/review notes; stored `totalAmount`; reference/WO/payment fields; historical flag used by import/rollup. |
| `reimbursement_items` | `claim` parent; amount/description/date/category/vendor text and `vendorId`; notes/receipt URL/files; source transaction/import batch/bank-statement relation; purpose/duplicate/archive metadata. |
| `departments` | Default department name lookup, head information, and `department_actual_expenses` update in direct paid flow. No direct claim-project allocation found. |
| `bank_statements` | Auth user relation plus PDF file in base collection definition. Optional item evidence relation added by integrity migration. Vault upload alone does not attach a statement to an item. |
| `settings` | Claim cap and shared approval quorum; missing/invalid cap falls back to current default. Settings are not per-organization in the inspected lookup. |
| `approvals` | Reimbursements reuse `entityType='expense'`, `entityId=claim.id`; fallback lookup distinguishes claims from ordinary expenses. This is not a typed reimbursement relation. |
| `work_orders` / `expenses` / `bank_accounts` | WO `claimId`, `source='reimbursement'`, amount, QB/accounting metadata. Work-order updates can create paid reporting expense and deduct internal account allocation; these are separate persisted effects. |
| `reimbursement_item_audit` | Text item/claim identifiers, action, actor profile, timestamp, reason, snapshot. Migration defines server-only rules; record updates use compensating rollback attempts. |

Relevant files:

- Claimant UI/load: [page](../../src/routes/dashboard/reimbursements/+page.svelte), [loader](../../src/routes/dashboard/reimbursements/+page.server.ts).
- Admin UI/load: [page](../../src/routes/dashboard/reimbursements/admin/+page.svelte), [loader](../../src/routes/dashboard/reimbursements/admin/+page.server.ts).
- Claim APIs: [create](../../src/routes/api/reimbursements/+server.ts), [update/delete](../../src/routes/api/reimbursements/[id]/+server.ts), [request approval](../../src/routes/api/reimbursements/[id]/request-approval/+server.ts).
- Item APIs: [add](../../src/routes/api/reimbursements/[id]/items/+server.ts), [edit/delete](../../src/routes/api/reimbursements/[id]/items/[itemId]/+server.ts), [receipts](../../src/routes/api/reimbursements/[id]/items/[itemId]/receipts/+server.ts).
- Administration: [single-item review](../../src/routes/api/reimbursements/items/[itemId]/review/+server.ts), [bulk review](../../src/routes/api/reimbursements/items/bulk-review/+server.ts), [bulk delete](../../src/routes/api/reimbursements/items/bulk-delete/+server.ts), [rollup](../../src/routes/api/reimbursements/rollup/+server.ts).
- Supporting services: [integrity helpers](../../src/lib/domain/reimbursements/integrity.ts), [review helpers](../../src/lib/server/reimbursements/review.ts), [import service](../../src/lib/server/reimbursements/import.ts).
- Import interface: [Import screen](../../src/routes/dashboard/import/+page.svelte), [import API](../../src/routes/api/import/+server.ts).
- Accounting: [approve API](../../src/routes/api/approvals/approve/+server.ts), [reject API](../../src/routes/api/approvals/reject/+server.ts), [WO update API](../../src/routes/api/work-orders/[id]/+server.ts), [Work Orders screen](../../src/routes/dashboard/work-orders/+page.svelte).
- Evidence/settings/auth: [bank statement API](../../src/routes/api/bank-statements/+server.ts), [file proxy](../../src/routes/api/pb-file/[...path]/+server.ts), [settings API](../../src/routes/api/settings/+server.ts), [RequestContext](../../src/lib/infra/RequestContext.ts), [login action](../../src/routes/auth/login/+page.server.ts).
- Schema references: [reimbursement Zod schema](../../src/lib/domain/schemas/reimbursement.schema.ts), [bank statement Zod schema](../../src/lib/domain/schemas/bank-statement.schema.ts), [base collection definitions](../../src/lib/migrations/collections.ts), [integrity migration](../../scripts/migrate-reimbursement-integrity.ts), [migration documentation](../REIMBURSEMENT_INTEGRITY_MIGRATION.md). No migration was executed. These sources are not an authoritative snapshot of deployed claim/item collections or file rules.

## Permissions: UI visibility versus server checks

The checks below are **source-inspected**. Local UI sign-in and claimant/admin screen access were demonstrated for one demo account, but no role switching, mutation authorization or denial case was tested live.

- `RequestContext.from` requires a valid auth session, retrieves the profile, and uses a superuser-authenticated PocketBase client. Vendor users are redirected out of dashboard context. `fromApi` returns null for unauthenticated calls but does not apply that vendor redirect. Parent layouts/menu controls are additional UI/navigation surfaces, not a substitute for endpoint checks.
- `RequestContext.role` falls back to `leader` when profile lookup yields null. Some callers use `profile?.role` instead, so missing-profile behavior differs. Shared should explicitly decide fail-closed behavior.
- Both reimbursement loaders call the broad set `admin`, `leader`, `marketing_lead`, `sales`, `franchise_owner`, `pro`, `broadcaster`, `league_owner` "admin" for screen access. Only admin/leader get all claims; other admitted roles are claimant-scoped in these loaders. The admin UI's approve/pay controls are not equivalent to authorization to use them.
- Claim PATCH requires owner or admin/leader; non-admin owners may update only drafts and cannot set review/approved/paid/rejected statuses. Add-item checks owner/admin and draft; edit-item checks owner/admin and finalized/draft restrictions.
- Settings PATCH, request-approval, review actions, bulk review/delete, imports, and WO update explicitly restrict to admin/leader. Rollup admits a broader list but enforces self-ownership for non-global admins and one claimant across selected claims.
- **Inconsistent checks:** draft claim DELETE verifies draft status but does not check claimant ownership or admin/leader role. Receipt POST/DELETE authenticate, then update by item ID without checking claim ownership, supplied parent claim, or finalized status. Those are gaps relative to adjacent endpoints; no live probing was performed.
- File proxy GET has no local auth/ownership check and sets public caching; actual PocketBase file protection and deployment behavior were not verified. Bank statement DELETE does verify the auth user owns every selected statement before deleting.
- No organization-ID constraint or organization-based tenancy boundary was found in these claim/item/statement access paths. Department membership is not checked as a reimbursement access boundary.

## Calculations, persistence, and integrations

- **Totals:** most normal create/edit/submit/review paths sum active, non-archived items. Currency presentation is USD. JavaScript numbers, read-modify-write totals, and separate record updates are used rather than a uniform integer-money/transaction abstraction. Single-item delete and bulk delete recalculate without the active-only filter used by review helpers.
- **Duplicate review:** claimant + normalized date + cent-rounded amount establish grouping candidates; normalized vendor/description/source IDs/context classify exact/potential matches. Business-purpose patterns flag payment/transfer-like descriptions; they are heuristics, not evidence of compliance. Keep/archive/restore decisions require an actor/reason and attempt an audit snapshot.
- **Approval routes differ:** direct admin PATCH can approve without creating an approval quorum record or open WO. `request-approval` creates/deduplicates a pending expense-type approval and sets under-review; it does not enforce a full starting-state transition matrix. Shared approval uses configurable quorum/default 2 and creates/stamps the reimbursement WO at quorum. The reviewed dedicated admin screen calls direct PATCH, not `request-approval`.
- **References differ:** new claims receive sequential `WO-NNN` derived from existing claim references; quorum approval prefers a claim-ID suffix with collision fallbacks; direct paid PATCH accepts a supplied reference. These are competing conventions, not approved identifiers.
- **Payment routes differ:** direct paid PATCH first updates the claim, then creates/stamps a paid WO and increments department actual expenses. Repeating the paid request can increment department actuals again; existing WO detection does not guard that increment. Some failures return `_woWarnings` after the paid state is already persisted.
- **WO route:** manual QB transaction/check/account fields are stored; `qb_entered_by` is derived from the authenticated profile. First unpaid-to-paid transition can deduct internal bank allocation; paid WO can synchronize claim status/actor/date; a QB transaction entry can create a paid reporting expense if no linked expense exists. Failures may be logged or returned as warnings after other writes succeed. This is not proof of an external QuickBooks connector or actual funds transfer.
- **Imports:** preview parses positive amounts with at most two decimals and valid dates, resolves claimant/vendor/department, classifies duplicates, and checks grouped limits. Requested imported approved/paid status is normalized to under-review. Apply creates grouped claims/items and attempts rollback of created records on error; one mocked rollback case is tested.
- **Rollup:** at least two same-claimant, non-finalized claims are re-bucketed under the cap, potentially splitting an item; creates under-review claims, moves/clones items, deletes old claims. No encompassing transaction was found. Split clones copy selected item fields but not receipt files or all integrity metadata. It also takes department from the first selected claim rather than requiring a common department.
- **Bank statements:** vault is file storage/retrieval, not reconciliation. The richer Zod institution/account/period schema is not used by the simple upload API/base definition inspected. No claim export or bank ingestion was inferred from those names.

## Gaps, defects, and questions for CTG

| Source finding / limit | Consolidation question or recommendation |
|---|---|
| Earlier Netlify login returned 403; local login now succeeds and walkthrough is recorded at the stated local SHA. | Investigate deployment separately if needed; do not carry its rejection forward as a local-app blocker. Other-role/negative permission verification still requires separate scope. |
| Modal receipt picker is disconnected from save. | Define whether evidence is optional/required at each stage; implement and test post-create upload or atomic multipart create with explicit partial-failure recovery in Shared. |
| Save & Submit and admin actions do not consistently inspect failed response bodies; paid-workflow warnings can go unnoticed. | Specify visible success/error/partial-success states and never discard unsaved input on an unsuccessful operation. |
| Direct review/paid flow and quorum/WO flow coexist. | Choose one canonical state machine, reviewer quorum policy, payment handoff, accounting authority, and retry/idempotency contract. Existing defaults are not approved policy. |
| Draft DELETE, receipt mutation, file retrieval, and missing-profile behavior differ from neighboring guarded paths. | Establish a server-side action/ownership/tenant matrix, including finalized evidence, attachments, and fail-closed identity resolution. Verify deployed PB/file rules separately. |
| Bulk delete permits permanent deletion even for finalized claims, unlike audited archive/restore restrictions. It can remove the empty claim and related WOs. | Decide retention, recoverability, correction/reversal and audit requirements before reusing this action; it is not equivalent to archival. |
| Ordinary create, payment, rollup, approval, and some audit writes can partially succeed; some compensating rollback failures are swallowed. | Define transactions or recoverable operation records, concurrency handling, and reconciliation for totals, evidence and accounting. |
| Cap checks/positive-amount checks differ between APIs; no complete transition matrix; direct approval can bypass quorum. | Put shared input/status/policy validation in the API layer and test invalid direct API requests, not just buttons. |
| UI "submitted" date is claim creation time; instructions imply immediate under-review and reference-on-payment, while source creates submitted and assigns WO on draft creation. | Align labels/instructions with timestamps and canonical lifecycle. Do not promote prototype text into requirements. |
| Item finder reads `workOrderReference`; accounting writes `work_order_number`. | Standardize identifier field mapping across item list, search, claim detail and work orders; no deployed field alias was verified. |
| Existing department lookup, broad admin labels, no claim-project selector or organization constraint. | Confirm charging department/project, permitted allocation changes, delegated reviewers and organization isolation. HUB-014 may supply context but not the whole feature. |
| No reimbursement export identified; no tax compliance or external QB sync verified. | Decide whether claim export, bookkeeping integration, compliance review and bank reconciliation are in scope; require separate acceptance evidence. |

## Reusable examples for comparison with FliHub-2 Shared

These are synthetic acceptance/workflow examples, not actions taken against live data. FliHub-2 source/API behavior was not inspected, so **no parity is claimed**.

1. **Draft with evidence:** claimant enters a title and two ordinary business items with optional date/vendor/category. Save draft; add evidence; reopen and confirm active-item total. Compare frontend payloads, API validation, stored relations, upload ownership and recovery if attachment upload fails.
2. **Cap boundary:** for configured cap `C`, allow total `C`, reject `C + 0.01` on create/add/edit/submit/restore/import. Confirm the same policy and money precision across all paths; do not hard-code Original's current default as the product rule.
3. **Owner/reviewer separation:** own claimant can build/submit draft; another claimant cannot read/mutate evidence or delete it; authorized reviewer can review within the correct organization. Compare API denial cases independently of hidden navigation/actions.
4. **Duplicate import:** repeated source ID is exact; next billing-period date is not duplicate; similar vendor/amount/date with different context requires human review. Preview must not create records. Apply must preserve evidence links, expose overrides and recover from partial failure.
5. **Purpose confirmation:** ambiguous transfer/payment description blocks approval/payment until an authorized actor supplies evidence-backed confirmation and reason. This confirms workflow review, not tax deductibility.
6. **Approval to payment:** a submission enters the chosen queue; reviewers satisfy the chosen approval policy; exactly one WO/accounting handoff results. Repeating approve/mark-paid/QB entry must not duplicate an expense, deduct account allocation twice, or double-increment department spend.
7. **Corrections and rollup:** audit/archive a duplicate with a survivor retained; recalculate active totals; restore only within cap. If rollup is retained, preserve receipts, statement/source metadata, audit references and department/project allocation across split/moved items.
8. **Bank vault/export:** verify own-user PDF access separately from claim evidence; do not equate a saved statement with reconciliation. If export is required, define fields, redaction, permission and format rather than reusing arbitrary file retrieval.

## Requirement mapping recommendations

Do not assign a new requirement ID automatically or edit the register based on this review.

- **HUB-014:** use only as a candidate dependency/reference for department/project context, ownership of budgets, and navigation relationships after CTG confirms its actual scope. It does not by itself specify claim capture, evidence, approvals, reimbursement payment, bank statements or accounting.
- **Claim capture and lifecycle:** propose wording for authenticated claimants to maintain owned drafts and submit itemized claims with explicit validation, timestamps, notes, active-item totals and configured limits.
- **Evidence and provenance:** separately specify receipt handling, access/retention, bank-statement links, import provenance, and recovery from upload/import failure.
- **Review and permissions:** specify who may read/review/approve/reject/pay/correct within which organization and lifecycle; define quorum, purpose/duplicate review and auditable reasons as explicit product decisions.
- **Payment/accounting:** specify one authoritative approved-to-paid handoff, work-order references, manual versus external QB integration, idempotency and reconciliation.
- **Reporting/export:** decide if summaries, exports, statement vault and reconciliation belong in existing requirements or need separately approved scope. Do not infer export, legal compliance, tax treatment or cross-repository feature parity.
- **Verification:** a read-only local demo-account walkthrough is now recorded. Compare these examples with Shared's actual implementation/API layer; separately verify other-role denials, payment states, upload/persistence, validation boundaries and accounting under approved non-production test conditions. Keep observations, source findings and proposals distinct.

## Changed-file and safety summary

Repository changes for this review:

- This report.
- [Walkthrough index](../../walkthroughs/README.md): purpose, prerequisites, rerun commands and output location.
- [Reimbursement walkthrough instructions](../../walkthroughs/reimbursements/walkthrough.md) and [caption/narration source](../../walkthroughs/reimbursements/script.md).
- [Read-only recorder](../../scripts/walkthroughs/record-reimbursements.mjs): shared configuration/source loading, UI sign-in before capture, in-memory authentication, rendered credential masking, request guard, action timing and sanitized observations.

Generated recordings/audio/captions/manifests remain ignored, not staged. Application code, requirement register, dependency manifests, schemas and reimbursement data were not modified. No commit, push, or PR was created for this review. No credentials or authentication state are included.
