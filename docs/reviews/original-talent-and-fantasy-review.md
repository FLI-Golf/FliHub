# FliHub Original: talent and fantasy workflow review

## Review context

- **Reviewed branch:** `docs/feature-walkthroughs`
- **Commit:** `a43a16df1760e00a078033c71338f224825b55be`
- **Review date:** 2026-10-16
- **Scope:** FAN-001 League configuration, FAN-002 Pro pool and draft, HUB-005 Talent profiles
- **Verification limitations:** Read-only source inspection on the checked-out branch. No application was started, no PocketBase instance was queried, and no tests were run. The source describes intended collection setup, but this review does not verify deployed collection definitions or live records. The repository has no evident fantasy-draft test suite. No credentials, personal records, or database contents are reproduced here.

## Executive summary

FliHub Original contributes useful Talent profile fields, Talent CRUD/listing patterns, and PocketBase-backed tournament-result and payment references. Its current fantasy surface does **not** implement fantasy leagues, participants, a Pro pool, drafts, rosters, or fantasy scoring. The `/dashboard/fantasy-gaming` page is a static 2027–2031 revenue forecast, not a playable demo of those workflows. The `league` model and route found here concern FLI Golf franchise/licensing operations.

For FliHub-2, retain these as references rather than treating them as approved requirements: a Pro/Talent profile data vocabulary, the distinction between an account/user profile and a Talent record, and existing league-owner terminology. Keep FliHub-2 Shared as the default direction; do not copy Original's financial/franchise League schema into fantasy league configuration without product decisions.

## FAN-001 — League configuration

| Review area | Finding | Classification |
|---|---|---|
| League creation/configuration | No fantasy league create/edit workflow was found. `LeagueSchema` contains generic fields such as `name`, `season`, dates, `prizePool`, `format`, and `rules`, but the bulk of the model describes franchises, revenues, expenses, and league financial metrics. The `/dashboard/league/[slug]` loader fetches franchises, deals, opportunities, sponsors, and expenses. | Implemented league model is franchise/operations oriented; fantasy configuration is missing. |
| League ownership | Code terminology includes `league_owner`, `leagueOwner`, and a separate `owner` relation to `users` in the legacy PocketBase league-collection setup. The Zod `leagueOwner` field is only an optional string; it is not a membership model. | Role and owner references exist; fantasy ownership behavior is not implemented. |
| Membership, invitations, capacity | No fantasy league-member or invitation workflow, join flow, participant limit, or seat-count validation was found. `totalTeams` and `totalPlayers` in the generic Zod model are just optional numeric fields. | Missing. |
| Mock/demo | The Fantasy & Gaming route contains hard-coded annual user, revenue, viewer, and bettor assumptions. It has year-selection and visualization UI but no persisted league state or gameplay actions. | Mock/forecast UI, not implemented workflow. |
| Permissions and organization | `league_owner` exists as an application profile role. The Fantasy & Gaming navigation item is marked for `admin`; no fantasy-specific owner authorization or tenant boundary was found. The legacy `league` collection setup describes authenticated reads, admin creation/deletion, and admin-or-`league_owner` updates, but it is a franchise-branded league record, not fantasy access control. | General role infrastructure exists; fantasy-specific permissions and organization scoping are missing. Live PocketBase rules were not checked. |

## FAN-002 — Pro pool and draft

| Review area | Finding | Classification |
|---|---|---|
| Pro eligibility and pool | Pro/Talent records have `status`, `gender`, and profile attributes; there is no draft eligibility field, pool builder, league-specific availability, or pool-selection workflow. Status values differ between source definitions: the `pros` collection definition lists `active`, `inactive`, and `retired`; `ProSchema` additionally lists `primary_pro` and `reserve_pro`. | Pro records exist; fantasy eligibility and pool selection are missing. |
| Draft order and roster rules | No draft-order model, snake/round behavior, roster-size or position constraints, duplicate-pick handling, or associated validation was found. | Missing. |
| Picks, timers, completion | No draft pick persistence, turn ownership, timer/expiration, auto-pick, pause/resume, or completion behavior was found. | Missing. |
| Stored rosters | No draft-to-roster persistence or relation between a fantasy owner/participant and selected Pros was found. The `franchises` collection has its own Pro slots; these are not fantasy rosters. | Missing. |
| Scoring connection | `tournament_results` are used to derive Pro placements, earnings, and tournament counts. Those existing stats/payout paths do not create fantasy points or aggregate scores for participant rosters. | Tournament results and payouts are implemented separately; fantasy scoring is missing. |
| Verification | Static source inspection only. No draft workflow or feature-specific tests were found; no running app or PocketBase instance was verified. | Behavior not runtime- or test-verified. |

## HUB-005 — Talent profiles

| Review area | Finding | Classification |
|---|---|---|
| Core profile | `Pro`/Talent is a first-class data record with name, nickname, status, gender, ranking, country/residence, biography, image, sponsor and career information, tournament count, records, personal/background fields, social links, travel details, and contract data. `ProSchema` validates a subset of this model; PocketBase collection definitions and migration scripts provide the persistence setup. | Implemented profile model and management UI. |
| Categories | The restructuring migration adds a multi-select `talentType`, with hard-coded choices `player`, `broadcaster`, `commentator`, and `analyst`. The add-Talent screen additionally offers `manager`; the Talent list type includes those five. A CSV-import screen documents other values (`coach`, `caddie`, `ambassador`). `broadcaster_profiles` is also a separate profile collection. | Partial, inconsistent category support; not configurable through product-facing type administration. “Extras” was not found as a category. |
| Profile relationships | The migration renames the `pros` collection to `talent` and adds `talentReference` and `broadcasterReference` relations on `user_profiles`. In parallel, `broadcaster_profiles` contains a separate broadcaster profile schema. | Implemented reference patterns; the unified Talent and separate broadcaster models overlap. |
| User vs selected Talent | Application identities are PocketBase users with a `user_profiles` record and a role. `talentReference`/`broadcasterReference` point from a user profile to a Talent profile. This is a useful precedent for keeping the account selecting a Pro distinct from the selected Pro. There is no fantasy participant entity or league-scoped selection relation in this branch. | Identity/profile distinction exists; fantasy selection relationship is missing. |
| Profile operations and stats | `/dashboard/talent` loads `talent` and `broadcaster_profiles`; Talent create/edit/detail routes use PocketBase records. The list/detail views derive tournament placement and earnings statistics from `tournament_results`. These are operational Talent-management flows, not fantasy selection/scoring. | Implemented, but no fantasy use verified. |
| Permissions and organizations | Roles include `admin`, `leader`, `pro`, `broadcaster`, `league_owner`, and others. The migration's collection rules for `pros`/`broadcaster_profiles` allow authenticated CRUD. Server-side `RequestContext` authenticates the session, loads the profile, and obtains an admin-authenticated PocketBase client; role checks require explicit application-level guards. The profile/list pages use `RequestContext`, but this does not define fantasy owner/participant access or organization boundaries. | General authentication and roles exist; fantasy-specific authorization/tenancy is missing. |

## Terminology and integration considerations

| Intended FliHub-2 terminology | FliHub Original terminology/evidence | Integration note |
|---|---|---|
| **Talent** is the umbrella for Pros, Broadcasters, Extras, and configurable types. | Unified collection/model uses `talent` and `talentType`; the type vocabulary is hard-coded and inconsistent. A standalone `broadcaster_profiles` collection also exists. Pro and broadcaster are application roles as well as profile categories. | Treat “configurable types” and “Extras” as product requirements, not capabilities inherited from Original. Decide whether all Talent share one profile and how specialized fields are represented. |
| **League owners** configure and manage fantasy leagues. | Application role: `league_owner`; model field: `leagueOwner`; legacy league collection field: `owner`. The league route/schema are franchise/licensing/financial operations. | Specify fantasy ownership and authority explicitly; do not assume the existing league owner role or owner relation scopes fantasy access. |
| **Fantasy owners/participants** join leagues and select Pros. | No fantasy participant type, membership relation, invitation, or join workflow was found. | Model the participant/account relation to a league independently from the selected Talent relation. |
| **Selected Pros** are distinct from the users making selections. | `user_profiles` can refer to a Talent profile through `talentReference`; a Pro/Talent is not itself the selecting account. | Preserve separate user/participant and Pro identities in FliHub-2; represent a pick as a relation between the participant/roster, league/draft, and selected Pro. |
| **Pro eligibility** is defined by league rules. | Original's Pro status values are operational labels (`active`, `inactive`, `retired`, `primary_pro`, `reserve_pro`) and are not tied to draft eligibility. | Define eligibility and pool inclusion as product rules; don't reuse status values as inferred draft policy. |

## PocketBase references and starting paths

These are source definitions and migration code, not proof of the live PocketBase schema:

- [`src/lib/migrations/collections.ts`](../../src/lib/migrations/collections.ts) — source definition for `pros` and many operational collections. `pros` has Pro profile fields and authenticated CRUD rules in this definition.
- [`src/lib/migrations/talent-management-restructure.ts`](../../src/lib/migrations/talent-management-restructure.ts) — migration that adds `talentType`, renames `pros` to `talent`, creates `broadcaster_profiles`, and adds user-profile relation fields. It contains hard-coded type choices. This historical migration also contains inline admin authentication material; values are intentionally omitted, and the script should not be executed or redistributed as-is.
- [`src/lib/migrations/create-league-collection.ts`](../../src/lib/migrations/create-league-collection.ts) — legacy `league` PocketBase collection setup with league branding, license/financial-owner fields, and role rules. This is not a fantasy-league schema. Do not execute it as part of this review.
- [`src/lib/domain/schemas/pro.schema.ts`](../../src/lib/domain/schemas/pro.schema.ts), [`src/lib/domain/models/Pro.ts`](../../src/lib/domain/models/Pro.ts) — typed Pro entity and validation schema.
- [`src/lib/domain/schemas/league.schema.ts`](../../src/lib/domain/schemas/league.schema.ts) — broad league/franchise finance schema.
- [`src/lib/domain/schemas/user-profile.schema.ts`](../../src/lib/domain/schemas/user-profile.schema.ts), [`src/lib/infra/RequestContext.ts`](../../src/lib/infra/RequestContext.ts) — application roles, profile identity, and request authentication context. The relation fields are added by migration rather than represented in the Zod schema.
- [`src/routes/dashboard/talent/+page.server.ts`](../../src/routes/dashboard/talent/+page.server.ts), [`src/routes/dashboard/talent/new/+page.server.ts`](../../src/routes/dashboard/talent/new/+page.server.ts), [`src/routes/dashboard/talent/new/+page.svelte`](../../src/routes/dashboard/talent/new/+page.svelte), [`src/routes/dashboard/talent/[id]/+page.server.ts`](../../src/routes/dashboard/talent/[id]/+page.server.ts) — Talent listing, creation, category choices, and detail/stat calculations.
- [`src/lib/infra/pocketbase/repositories/TournamentResultRepo.ts`](../../src/lib/infra/pocketbase/repositories/TournamentResultRepo.ts), [`src/lib/domain/models/TournamentResult.ts`](../../src/lib/domain/models/TournamentResult.ts) — tournament-result access and Pro result data; no fantasy roster scoring link.
- [`src/routes/dashboard/fantasy-gaming/+page.svelte`](../../src/routes/dashboard/fantasy-gaming/+page.svelte), [`src/routes/dashboard/fantasy-gaming/+page.server.ts`](../../src/routes/dashboard/fantasy-gaming/+page.server.ts) — the static revenue forecast page and its empty server load.
- [`docs/PRO_MANAGEMENT_SYSTEM.md`](../PRO_MANAGEMENT_SYSTEM.md), [`docs/MANAGE_PROS_FEATURE.md`](../MANAGE_PROS_FEATURE.md), [`docs/TERMINOLOGY_CONSISTENCY.md`](../TERMINOLOGY_CONSISTENCY.md) — helpful historical references; read as documentation, not as verification of current deployed behavior.

No fantasy league membership, invitation, draft, pick, roster, or fantasy scoring collection definitions were found in the reviewed source. The live PocketBase schema may differ from these files.

## Suggested requirement wording for FliHub-2

These are proposed statements of intended behavior, not claims about FliHub Original or approved product rules:

1. **Talent profiles:** “The system shall maintain Talent profiles for Pros, Broadcasters, Extras, and administrator-configurable Talent types. A Talent profile is distinct from a user account. Types and type-specific profile fields shall be configurable without treating the current Original type lists as fixed product policy.”
2. **Fantasy league configuration:** “A league owner shall be able to create and manage a fantasy league with its configured season, participation rules, capacity, and lifecycle. The product specification shall define which settings are configurable and which roles may change them.”
3. **Membership and invitations:** “A fantasy owner/participant shall be able to join an eligible league, including through an invitation where enabled. Membership, invitation state, capacity enforcement, and ownership shall be represented and authorized independently of Pro/Talent records.”
4. **Pro pool and picks:** “Each fantasy league shall expose a league-eligible Pro pool. A draft pick shall record the league/draft, selecting participant, pick order, selected Pro, and pick time; validation shall prevent invalid turns, duplicate or ineligible selections, and roster-rule violations.”
5. **Draft lifecycle:** “The product shall define draft order, roster constraints, pick deadline behavior, pause/resume and completion semantics. These are policy decisions; the current Original branch provides no draft rules to adopt.”
6. **Roster and scoring:** “Accepted picks shall persist into the participant's league roster while retaining the selecting participant and selected Pro as separate identities. Fantasy scoring shall derive from explicitly defined event/result inputs and scoring rules; the existing tournament placement/earnings calculations are not fantasy scoring.”
7. **Access boundaries:** “League reads and mutations shall be authorized by authenticated identity, role, league membership/ownership, and organization boundary as specified. UI navigation visibility alone shall not be treated as authorization.”
