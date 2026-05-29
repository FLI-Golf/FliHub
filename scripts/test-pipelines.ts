/**
 * Pipeline integration tests — CLI runner.
 *
 * Tests every API route added in the pipeline work:
 *   1. Shared pipeline helpers (smoke)
 *   2. Talent onboarding pipeline  (PATCH /api/onboarding/[userId])
 *   3. Sponsor deals pipeline      (PATCH /api/sponsors/[id], activity log)
 *   4. Tournament ops pipeline     (checklist toggle, bulk result import)
 *   5. Content production pipeline (CRUD + stage moves + approval flow)
 *
 * All test data is tagged and cleaned up after the run.
 *
 * Run:
 *   npx tsx scripts/test-pipelines.ts
 *   npx tsx scripts/test-pipelines.ts --keep   # skip cleanup (inspect data)
 *   npx tsx scripts/test-pipelines.ts --suite content  # run one suite only
 *
 * NOTE: This script is intentionally temporary. Delete it once the pipelines
 * are stable and the team is comfortable with the behaviour.
 */

import * as dotenv from 'dotenv';
dotenv.config();
import PocketBase from 'pocketbase';

// ── Config ────────────────────────────────────────────────────────────────────

const PB_URL = (process.env.POCKETBASE_URL ?? 'https://pocketbase-production-6ab5.up.railway.app').replace(/\/$/, '');
const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
const KEEP = process.argv.includes('--keep');
const SUITE = process.argv.find(a => a.startsWith('--suite='))?.split('=')[1] ?? 'all';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

// ── Test harness ──────────────────────────────────────────────────────────────

type TestResult = { name: string; passed: boolean; error?: string; durationMs: number };
const results: TestResult[] = [];
const cleanup: (() => Promise<void>)[] = [];

async function test(name: string, fn: () => Promise<void>) {
	const start = Date.now();
	try {
		await fn();
		results.push({ name, passed: true, durationMs: Date.now() - start });
		console.log(`  ✅ ${name} (${Date.now() - start}ms)`);
	} catch (err: any) {
		const msg = err?.message ?? String(err);
		results.push({ name, passed: false, error: msg, durationMs: Date.now() - start });
		console.log(`  ❌ ${name}\n     ${msg}`);
	}
}

function suite(name: string) {
	console.log(`\n${'─'.repeat(60)}`);
	console.log(`  ${name}`);
	console.log('─'.repeat(60));
}

function assert(condition: boolean, message: string) {
	if (!condition) throw new Error(message);
}

function assertOk(res: Response, label: string) {
	if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function auth() {
	await pb.collection('_superusers').authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
}

// Helper: call the app's API (requires the dev server to be running)
async function api(method: string, path: string, body?: unknown): Promise<{ res: Response; data: any }> {
	const res = await fetch(`${APP_URL}${path}`, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined
	});
	const data = await res.json().catch(() => ({}));
	return { res, data };
}

// ── Suite 1: Shared pipeline engine (smoke) ───────────────────────────────────

async function runSharedEngine() {
	suite('1 · Shared Pipeline Engine');

	await test('PipelineBoard component file exists', async () => {
		const { readFileSync } = await import('fs');
		const content = readFileSync('src/lib/pipeline/PipelineBoard.svelte', 'utf8');
		assert(content.includes('PipelineStageColumn'), 'PipelineBoard must import PipelineStageColumn');
	});

	await test('PipelineStageColumn component file exists', async () => {
		const { readFileSync } = await import('fs');
		const content = readFileSync('src/lib/pipeline/PipelineStageColumn.svelte', 'utf8');
		assert(content.includes('onmove'), 'PipelineStageColumn must expose onmove prop');
	});

	await test('pipeline/index.ts exports all public symbols', async () => {
		const { readFileSync } = await import('fs');
		const content = readFileSync('src/lib/pipeline/index.ts', 'utf8');
		for (const sym of ['PipelineBoard', 'PipelineStageColumn', 'pipelineMove', 'pipelineAction']) {
			assert(content.includes(sym), `index.ts must export ${sym}`);
		}
	});

	await test('pipeline/api.ts pipelineMove function defined', async () => {
		const { readFileSync } = await import('fs');
		const content = readFileSync('src/lib/pipeline/api.ts', 'utf8');
		assert(content.includes('export async function pipelineMove'), 'pipelineMove must be exported');
		assert(content.includes('export async function pipelineAction'), 'pipelineAction must be exported');
	});
}

// ── Suite 2: Talent onboarding pipeline ──────────────────────────────────────

async function runOnboarding() {
	suite('2 · Talent Onboarding Pipeline');

	// Find a real talent record to use as test subject
	let talentId: string;

	await test('find a talent record to test with', async () => {
		const records = await pb.collection('talent').getFullList({ fields: 'id,name', perPage: 1 });
		assert(records.length > 0, 'Need at least one talent record');
		talentId = records[0].id;
		console.log(`     using talent: ${records[0].name} (${talentId})`);
	});

	await test('PATCH /api/onboarding/[userId] — move to documents_sent', async () => {
		const { res, data } = await api('PATCH', `/api/onboarding/${talentId!}`, {
			stage: 'documents_sent'
		});
		assertOk(res, 'PATCH onboarding stage');
		assert(data.ok === true, 'Response must have ok:true');
	});

	await test('PATCH /api/onboarding/[userId] — move to approved with notes', async () => {
		const { res, data } = await api('PATCH', `/api/onboarding/${talentId!}`, {
			stage: 'approved',
			notes: '[test] auto-approved by pipeline test'
		});
		assertOk(res, 'PATCH onboarding approve');
		assert(data.ok === true, 'Response must have ok:true');
	});

	await test('onboarding_status record has completedAt set after approval', async () => {
		const records = await pb.collection('onboarding_status').getFullList({
			filter: `userId = "${talentId!}"`
		});
		assert(records.length > 0, 'onboarding_status record must exist');
		assert(!!records[0].completedAt, 'completedAt must be set after approval');
	});

	await test('PATCH /api/onboarding/[userId] — move to rejected', async () => {
		const { res, data } = await api('PATCH', `/api/onboarding/${talentId!}`, {
			stage: 'rejected'
		});
		assertOk(res, 'PATCH onboarding reject');
		assert(data.ok === true, 'Response must have ok:true');
	});

	// Reset back to invited so we don't leave test state
	cleanup.push(async () => {
		if (!talentId) return;
		const records = await pb.collection('onboarding_status').getFullList({
			filter: `userId = "${talentId}"`
		}).catch(() => []);
		for (const r of records) {
			await pb.collection('onboarding_status').delete(r.id).catch(() => {});
		}
	});
}

// ── Suite 3: Sponsor deals pipeline ──────────────────────────────────────────

async function runSponsorPipeline() {
	suite('3 · Sponsor Deals Pipeline');

	let sponsorId: string;
	let activityId: string;

	await test('create a test sponsor', async () => {
		const { res, data } = await api('POST', '/api/sponsors', {
			companyName: '[TEST] Pipeline Test Sponsor',
			type: 'corporate',
			tier: 'tier_3',
			status: 'prospect'
		});
		assertOk(res, 'POST /api/sponsors');
		assert(data.id, 'Response must include id');
		sponsorId = data.id;
	});

	await test('PATCH /api/sponsors/[id] — move stage to outreach', async () => {
		const { res, data } = await api('PATCH', `/api/sponsors/${sponsorId!}`, {
			status: 'outreach'
		});
		assertOk(res, 'PATCH sponsor stage');
		assert(data.status === 'outreach', 'status must be outreach');
	});

	await test('PATCH /api/sponsors/[id] — move stage to negotiating', async () => {
		const { res, data } = await api('PATCH', `/api/sponsors/${sponsorId!}`, {
			status: 'negotiating',
			dealProbability: 65
		});
		assertOk(res, 'PATCH sponsor negotiating');
		assert(data.status === 'negotiating', 'status must be negotiating');
	});

	await test('POST /api/sponsors/[id]/activity — log a call', async () => {
		const { res, data } = await api('POST', `/api/sponsors/${sponsorId!}/activity`, {
			type: 'call',
			note: '[test] Intro call completed, strong interest'
		});
		assertOk(res, 'POST activity');
		assert(data.id, 'Activity entry must have id');
		activityId = data.id;
	});

	await test('GET /api/sponsors/[id]/activity — returns entries', async () => {
		const { res, data } = await api('GET', `/api/sponsors/${sponsorId!}/activity`);
		assertOk(res, 'GET activity');
		assert(Array.isArray(data), 'Must return array');
		assert(data.length >= 1, 'Must have at least one entry');
	});

	await test('POST /api/sponsors/[id]/activity — log a stage_change note', async () => {
		const { res, data } = await api('POST', `/api/sponsors/${sponsorId!}/activity`, {
			type: 'stage_change',
			note: '[test] Moved to contracted'
		});
		assertOk(res, 'POST stage_change activity');
		assert(data.id, 'Must have id');
	});

	await test('DELETE /api/sponsors/[id]/activity/[entryId] — remove entry', async () => {
		const { res } = await api('DELETE', `/api/sponsors/${sponsorId!}/activity/${activityId!}`);
		assertOk(res, 'DELETE activity entry');
	});

	await test('PATCH /api/sponsors/[id] — update notes field', async () => {
		const { res, data } = await api('PATCH', `/api/sponsors/${sponsorId!}`, {
			notes: '[test] Updated via pipeline test'
		});
		assertOk(res, 'PATCH sponsor notes');
		assert(data.notes?.includes('[test]'), 'notes must be updated');
	});

	cleanup.push(async () => {
		if (!sponsorId) return;
		// Delete activity entries
		const entries = await pb.collection('sponsor_activity').getFullList({
			filter: `sponsorId = "${sponsorId}"`
		}).catch(() => []);
		for (const e of entries) await pb.collection('sponsor_activity').delete(e.id).catch(() => {});
		// Delete sponsor
		await pb.collection('sponsors').delete(sponsorId).catch(() => {});
	});
}

// ── Suite 4: Tournament operations pipeline ───────────────────────────────────

async function runTournamentOps() {
	suite('4 · Tournament Operations Pipeline');

	let tournamentId: string;
	let talentId: string;
	let resultId: string;

	await test('find a tournament to test with', async () => {
		const records = await pb.collection('tournaments').getFullList({
			fields: 'id,name',
			perPage: 1,
			sort: '-created'
		});
		assert(records.length > 0, 'Need at least one tournament');
		tournamentId = records[0].id;
		console.log(`     using tournament: ${records[0].name} (${tournamentId})`);
	});

	await test('find a talent record for bulk import', async () => {
		const records = await pb.collection('talent').getFullList({
			fields: 'id,name',
			perPage: 1
		});
		assert(records.length > 0, 'Need at least one talent record');
		talentId = records[0].id;
	});

	await test('POST /api/tournaments/[id]/checklist — check pre-event item', async () => {
		const { res, data } = await api('POST', `/api/tournaments/${tournamentId!}/checklist`, {
			itemId: 'venue_confirmed',
			checked: true
		});
		assertOk(res, 'POST checklist check');
		assert(data.ok === true, 'Must return ok:true');
	});

	await test('POST /api/tournaments/[id]/checklist — idempotent re-check', async () => {
		const { res, data } = await api('POST', `/api/tournaments/${tournamentId!}/checklist`, {
			itemId: 'venue_confirmed',
			checked: true
		});
		assertOk(res, 'POST checklist re-check');
		assert(data.ok === true, 'Must return ok:true on re-check');
	});

	await test('POST /api/tournaments/[id]/checklist — uncheck item', async () => {
		const { res, data } = await api('POST', `/api/tournaments/${tournamentId!}/checklist`, {
			itemId: 'venue_confirmed',
			checked: false
		});
		assertOk(res, 'POST checklist uncheck');
		assert(data.ok === true, 'Must return ok:true on uncheck');
	});

	await test('checklist record deleted after uncheck', async () => {
		const records = await pb.collection('tournament_ops_checklist').getFullList({
			filter: `tournamentId = "${tournamentId!}" && itemId = "venue_confirmed"`
		}).catch(() => []);
		assert(records.length === 0, 'Record must be deleted after uncheck');
	});

	await test('POST /api/tournaments/[id]/bulk-results — import one result', async () => {
		// First check if this talent already has a result — skip if so
		const existing = await pb.collection('tournament_results').getFullList({
			filter: `tournament = "${tournamentId!}" && pro = "${talentId!}"`,
			fields: 'id'
		}).catch(() => []);

		if (existing.length > 0) {
			console.log('     (talent already has result — skipping create, testing skip logic)');
		}

		const { res, data } = await api('POST', `/api/tournaments/${tournamentId!}/bulk-results`, {
			results: [{ proId: talentId!, placement: 99, score: '-1', rounds: 4 }]
		});
		assertOk(res, 'POST bulk-results');
		assert(typeof data.created === 'number', 'Must return created count');
		assert(typeof data.skipped === 'number', 'Must return skipped count');

		if (existing.length === 0) {
			assert(data.created === 1, `Expected 1 created, got ${data.created}`);
			resultId = (await pb.collection('tournament_results').getFullList({
				filter: `tournament = "${tournamentId!}" && pro = "${talentId!}" && placement = 99`,
				fields: 'id'
			}))[0]?.id;
		} else {
			assert(data.skipped === 1, `Expected 1 skipped, got ${data.skipped}`);
		}
	});

	await test('POST /api/tournaments/[id]/bulk-results — rejects empty array', async () => {
		const { res } = await api('POST', `/api/tournaments/${tournamentId!}/bulk-results`, {
			results: []
		});
		assert(res.status === 400, `Expected 400, got ${res.status}`);
	});

	await test('POST /api/tournaments/[id]/bulk-results — skips duplicate pro', async () => {
		const { res, data } = await api('POST', `/api/tournaments/${tournamentId!}/bulk-results`, {
			results: [{ proId: talentId!, placement: 98 }]
		});
		assertOk(res, 'POST bulk-results duplicate');
		assert(data.skipped >= 1, 'Duplicate pro must be skipped');
	});

	cleanup.push(async () => {
		// Remove checklist entries for this tournament created by tests
		const entries = await pb.collection('tournament_ops_checklist').getFullList({
			filter: `tournamentId = "${tournamentId}"`
		}).catch(() => []);
		for (const e of entries) await pb.collection('tournament_ops_checklist').delete(e.id).catch(() => {});

		// Remove the test result (placement 99)
		if (resultId) {
			await pb.collection('tournament_results').delete(resultId).catch(() => {});
		} else {
			const r = await pb.collection('tournament_results').getFullList({
				filter: `tournament = "${tournamentId}" && placement = 99`,
				fields: 'id'
			}).catch(() => []);
			for (const e of r) await pb.collection('tournament_results').delete(e.id).catch(() => {});
		}
	});
}

// ── Suite 5: Content production pipeline ─────────────────────────────────────

async function runContentPipeline() {
	suite('5 · Content Production Pipeline');

	let contentId: string;

	await test('POST /api/content — create a content item', async () => {
		const { res, data } = await api('POST', '/api/content', {
			title: '[TEST] Pipeline Test — YouTube Episode',
			contentType: 'youtube',
			description: 'Auto-generated by pipeline test script',
			budget: 500,
			requiresApproval: true
		});
		assertOk(res, 'POST /api/content');
		assert(data.id, 'Must return id');
		assert(data.stage === 'brief', 'New item must start at brief stage');
		contentId = data.id;
	});

	await test('PATCH /api/content/[id] — move to shoot', async () => {
		const { res, data } = await api('PATCH', `/api/content/${contentId!}`, {
			stage: 'shoot'
		});
		assertOk(res, 'PATCH content shoot');
		assert(data.stage === 'shoot', 'Stage must be shoot');
	});

	await test('PATCH /api/content/[id] — move to edit', async () => {
		const { res, data } = await api('PATCH', `/api/content/${contentId!}`, {
			stage: 'edit',
			actualCost: 450
		});
		assertOk(res, 'PATCH content edit');
		assert(data.stage === 'edit', 'Stage must be edit');
		assert(data.actualCost === 450, 'actualCost must be saved');
	});

	await test('PATCH /api/content/[id] — move to approval, sets approvalStatus=pending', async () => {
		const { res, data } = await api('PATCH', `/api/content/${contentId!}`, {
			stage: 'approval',
			approvalStatus: 'pending'
		});
		assertOk(res, 'PATCH content approval');
		assert(data.stage === 'approval', 'Stage must be approval');
		assert(data.approvalStatus === 'pending', 'approvalStatus must be pending');
	});

	await test('PATCH /api/content/[id] — approve: sets approvedAt, moves to published', async () => {
		const { res, data } = await api('PATCH', `/api/content/${contentId!}`, {
			stage: 'published',
			approvalStatus: 'approved'
		});
		assertOk(res, 'PATCH content approve');
		assert(data.stage === 'published', 'Stage must be published');
		assert(data.approvalStatus === 'approved', 'approvalStatus must be approved');
		assert(!!data.approvedAt, 'approvedAt must be set');
	});

	await test('PATCH /api/content/[id] — move to paid', async () => {
		const { res, data } = await api('PATCH', `/api/content/${contentId!}`, {
			stage: 'paid',
			paymentStatus: 'paid'
		});
		assertOk(res, 'PATCH content paid');
		assert(data.stage === 'paid', 'Stage must be paid');
		assert(data.paymentStatus === 'paid', 'paymentStatus must be paid');
	});

	await test('PATCH /api/content/[id] — reject flow: sets approvalStatus=rejected, back to edit', async () => {
		// Create a second item to test rejection
		const { data: item2 } = await api('POST', '/api/content', {
			title: '[TEST] Pipeline Test — Rejection Flow',
			contentType: 'instagram',
			requiresApproval: true
		});
		assert(item2.id, 'Must create second item');

		await api('PATCH', `/api/content/${item2.id}`, { stage: 'approval', approvalStatus: 'pending' });
		const { res, data } = await api('PATCH', `/api/content/${item2.id}`, {
			stage: 'edit',
			approvalStatus: 'rejected'
		});
		assertOk(res, 'PATCH content reject');
		assert(data.stage === 'edit', 'Rejected item must go back to edit');
		assert(data.approvalStatus === 'rejected', 'approvalStatus must be rejected');

		// Clean up second item
		cleanup.push(async () => {
			await pb.collection('content_production').delete(item2.id).catch(() => {});
		});
	});

	await test('PATCH /api/content/[id] — rejects empty patch body', async () => {
		const { res } = await api('PATCH', `/api/content/${contentId!}`, {});
		assert(res.status === 400, `Expected 400, got ${res.status}`);
	});

	await test('GET /api/content — returns array including test item', async () => {
		const { res, data } = await api('GET', '/api/content');
		assertOk(res, 'GET /api/content');
		assert(Array.isArray(data), 'Must return array');
		assert(data.some((i: any) => i.id === contentId), 'Must include created item');
	});

	cleanup.push(async () => {
		if (!contentId) return;
		await pb.collection('content_production').delete(contentId).catch(() => {});
	});
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
	console.log('\n╔══════════════════════════════════════════════════════════╗');
	console.log('║         FliHub Pipeline Integration Tests                ║');
	console.log('╚══════════════════════════════════════════════════════════╝');
	console.log(`  PocketBase: ${PB_URL}`);
	console.log(`  App:        ${APP_URL}`);
	console.log(`  Suite:      ${SUITE}`);
	console.log(`  Keep data:  ${KEEP}`);

	// Verify dev server is reachable
	try {
		const ping = await fetch(`${APP_URL}/dashboard`, { method: 'HEAD' }).catch(() => null);
		if (!ping) throw new Error('no response');
	} catch {
		console.error(`\n⚠️  Cannot reach app at ${APP_URL}`);
		console.error('   Start the dev server first: npm run dev\n');
		process.exit(1);
	}

	await auth();
	console.log(`\n  ✓ Authenticated to PocketBase\n`);

	const suiteMap: Record<string, () => Promise<void>> = {
		engine:     runSharedEngine,
		onboarding: runOnboarding,
		sponsor:    runSponsorPipeline,
		tournament: runTournamentOps,
		content:    runContentPipeline
	};

	if (SUITE === 'all') {
		for (const fn of Object.values(suiteMap)) await fn();
	} else if (suiteMap[SUITE]) {
		await suiteMap[SUITE]();
	} else {
		console.error(`Unknown suite: ${SUITE}. Valid: ${Object.keys(suiteMap).join(', ')}, all`);
		process.exit(1);
	}

	// ── Cleanup ───────────────────────────────────────────────────────────────
	if (!KEEP && cleanup.length > 0) {
		console.log('\n─── Cleanup ───────────────────────────────────────────────');
		for (const fn of cleanup) {
			try { await fn(); } catch (e: any) { console.warn(`  cleanup warning: ${e.message}`); }
		}
		console.log('  ✓ Test data removed');
	} else if (KEEP) {
		console.log('\n  ℹ️  --keep flag set — test data left in database');
	}

	// ── Summary ───────────────────────────────────────────────────────────────
	const passed = results.filter(r => r.passed).length;
	const failed = results.filter(r => !r.passed).length;
	const totalMs = results.reduce((s, r) => s + r.durationMs, 0);

	console.log('\n╔══════════════════════════════════════════════════════════╗');
	console.log(`║  Results: ${passed} passed, ${failed} failed  (${totalMs}ms total)${' '.repeat(Math.max(0, 28 - String(passed + failed).length - String(totalMs).length))}║`);
	console.log('╚══════════════════════════════════════════════════════════╝\n');

	if (failed > 0) {
		console.log('Failed tests:');
		for (const r of results.filter(r => !r.passed)) {
			console.log(`  ❌ ${r.name}`);
			console.log(`     ${r.error}`);
		}
		console.log('');
		process.exit(1);
	}
}

main().catch(err => {
	console.error('\nFatal error:', err);
	process.exit(1);
});
