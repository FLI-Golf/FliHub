# CI Check Re-Blocking Plan

## Goal
Return `pnpm run check` to a blocking CI gate in controlled phases while avoiding workflow instability.

## Current Status (2026-06-14)
- `pnpm exec tsc --noEmit` is now clean (exit 0).
- Full `pnpm run check` still cannot complete in this container because the process is terminated externally (exit 143).
- CI currently treats the check step as non-blocking.

## Phase 1 (Completed)
- Fixed high-impact type-check failures across shared UI exports, role typing, schemas, API null safety, and server-load typing.
- Validation command:
  - `pnpm exec tsc --noEmit --pretty false`

## Phase 2 (Svelte Check Stabilization)
- Run `svelte-check` in CI (or larger runner) and capture top failing files.
- Prioritize fixes in this order:
  1. Runtime-risk errors (nullability, invalid props, action handlers).
  2. Svelte 5 runes migration errors (`state_referenced_locally`, invalid reactive patterns).
  3. Actual type errors in route loads/actions.
  4. High-noise warnings only after errors are near zero.
- Deliverable: `pnpm run check` exits 0 in CI environment.

## Phase 3 (Gate Hardening)
- Keep current check step but remove `continue-on-error: true` once Phase 2 is stable.
- Keep `test:auth-guards` and `build` as hard gates.
- Optional intermediate step:
  - Add a temporary PR label/workflow input to bypass blocking checks for emergency hotfixes only.

## Phase 4 (Quality Ratchet)
- Enforce “no new check debt” policy:
  - Any new warnings/errors introduced by PR are blocked.
- Add weekly debt cleanup targets for legacy warning clusters.
- Track counts over time in CI summary output.

## Suggested Execution Commands
- Type baseline:
  - `pnpm exec tsc --noEmit --pretty false`
- Full check:
  - `pnpm run check`
- Security guard regression:
  - `pnpm run test:auth-guards`
- Production build:
  - `pnpm run build`
