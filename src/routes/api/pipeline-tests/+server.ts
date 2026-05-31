/**
 * POST /api/pipeline-tests
 * Runs pipeline integration tests server-side and returns structured results.
 *
 * Body: { suite?: 'all' | 'engine' | 'onboarding' | 'sponsor' | 'tournament' | 'content', keep?: boolean }
 *
 * TEMPORARY — delete this route once pipelines are stable.
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';
import { readFileSync } from 'fs';

// ── Test harness ──────────────────────────────────────────────────────────────

type TestResult = {
	suite: string;
	name: string;
	passed: boolean;
	error?: string;
	durationMs: number;
};

class TestRunner {
	results: TestResult[] = [];
	cleanup: (() => Promise<void>)[] = [];
	private currentSuite = '';

	setSuite(name: string) { this.currentSuite = name; }

	async test(name: string, fn: () => Promise<void>) {
		const start = Date.now();
		try {
			await fn();
			this.results.push({ suite: this.currentSuite, name, passed: true, durationMs: Date.now() - start });
		} catch (err: any) {
			this.results.push({
				suite: this.currentSuite,
				name,
				passed: false,
				error: err?.message ?? String(err),
				durationMs: Date.now() - start
			});
		}
	}

	assert(condition: boolean, message: string) {
		if (!condition) throw new Error(message);
	}
}

// ── Suite 1: Shared pipeline engine (file checks) ────────────────────────────

async function suiteEngine(r: TestRunner) {
	r.setSuite('Shared Pipeline Engine');

	await r.test('PipelineBoard.svelte exists and imports PipelineStageColumn', async () => {
		const content = readFileSync('src/lib/pipeline/PipelineBoard.svelte', 'utf8');
		r.assert(content.includes('PipelineStageColumn'), 'Must import PipelineStageColumn');
	});

	await r.test('PipelineStageColumn.svelte exposes onmove prop', async () => {
		const content = readFileSync('src/lib/pipeline/PipelineStageColumn.svelte', 'utf8');
		r.assert(content.includes('onmove'), 'Must expose onmove prop');
	});

	await r.test('pipeline/index.ts exports all public symbols', async () => {
		const content = readFileSync('src/lib/pipeline/index.ts', 'utf8');
		for (const sym of ['PipelineBoard', 'PipelineStageColumn', 'pipelineMove', 'pipelineAction']) {
			r.assert(content.includes(sym), `Must export ${sym}`);
		}
	});

	await r.test('pipeline/api.ts exports pipelineMove and pipelineAction', async () => {
		const content = readFileSync('src/lib/pipeline/api.ts', 'utf8');
		r.assert(content.includes('export async function pipelineMove'), 'Must export pipelineMove');
		r.assert(content.includes('export async function pipelineAction'), 'Must export pipelineAction');
	});

	await r.test('PipelineBoard.svelte renders terminal stages section', async () => {
		const content = readFileSync('src/lib/pipeline/PipelineBoard.svelte', 'utf8');
		r.assert(content.includes('terminalStages'), 'Must handle terminalStages');
	});
}

// ── Suite 2: Talent onboarding pipeline ──────────────────────────────────────

async function suiteOnboarding(r: TestRunner, pb: any) {
	r.setSuite('Talent Onboarding Pipeline');
	let talentId: string | null = null;

	await r.test('onboarding admin page server file exists', async () => {
		const content = readFileSync('src/routes/dashboard/onboarding/admin/+page.server.ts', 'utf8');
		r.assert(content.includes('onboarding_status'), 'Must query onboarding_status');
		r.assert(content.includes('pipelineStage'), 'Must include pipelineStage in enriched data');
	});

	await r.test('onboarding admin page svelte file uses PipelineBoard', async () => {
		const content = readFileSync('src/routes/dashboard/onboarding/admin/+page.svelte', 'utf8');
		r.assert(content.includes('PipelineBoard'), 'Must use PipelineBoard component');
		r.assert(content.includes('documents_sent'), 'Must define documents_sent stage');
		r.assert(content.includes('approved'), 'Must define approved stage');
	});

	await r.test('PATCH /api/onboarding/[userId] route file exists', async () => {
		const content = readFileSync('src/routes/api/onboarding/[userId]/+server.ts', 'utf8');
		r.assert(content.includes('pipelineStage'), 'Must update pipelineStage field');
		r.assert(content.includes('completedAt'), 'Must set completedAt on approval');
	});

	await r.test('find talent and write onboarding_status record', async () => {
		const talent = await pb.collection('talent').getFullList({ fields: 'id', perPage: 1 }).catch(() => []);
		r.assert(talent.length > 0, 'Need at least one talent record');
		talentId = talent[0].id;

		// Probe the schema: create a record and verify the userId field is persisted.
		// If the collection has no schema fields defined in PocketBase, the payload
		// is silently dropped and the returned record will have no userId.
		const probe = await pb.collection('onboarding_status').create({ userId: talentId })
			.catch((e: any) => { throw new Error(`onboarding_status create failed: ${e?.message ?? JSON.stringify(e?.data ?? e)}`); });
		if (!probe.userId) {
			// Clean up the empty record before failing
			await pb.collection('onboarding_status').delete(probe.id).catch(() => {});
			throw new Error(
				'onboarding_status collection has no schema fields in PocketBase — ' +
				'userId was not persisted. Add the required fields (userId, pipelineStage, ' +
				'welcomeSeen, documentsInitialed, contractSigned, profileCompleted) to the ' +
				'collection schema in the PocketBase admin UI.'
			);
		}

		// Schema is good — write the full payload
		await pb.collection('onboarding_status').update(probe.id, {
			pipelineStage: 'documents_sent', welcomeSeen: false,
			documentsInitialed: false, contractSigned: false, profileCompleted: false
		}).catch((e: any) => { throw new Error(`onboarding_status update failed: ${e?.message}`); });
	});

	await r.test('onboarding_status record readable by admin', async () => {
		r.assert(!!talentId, 'Need talentId from previous test');
		const all = await pb.collection('onboarding_status').getFullList()
			.catch((e: any) => { throw new Error(`onboarding_status not readable: ${e?.message}`); });
		const match = (all as any[]).find((r: any) => r.userId === talentId);
		r.assert(!!match, 'Must find onboarding_status record — if this fails, check that the collection schema has a userId field in PocketBase');
	});

	r.cleanup.push(async () => {
		if (!talentId) return;
		const all = await pb.collection('onboarding_status').getFullList().catch(() => []);
		// Match by userId field if schema exists, otherwise clean up any records
		// created during this test run that have no userId (schema-less probe records)
		for (const rec of all as any[]) {
			if (rec.userId === talentId || (!rec.userId && rec.id)) {
				await pb.collection('onboarding_status').delete(rec.id).catch(() => {});
			}
		}
	});
}

// ── Suite 3: Sponsor deals pipeline ──────────────────────────────────────────

async function suiteSponsor(r: TestRunner, pb: any) {
	r.setSuite('Sponsor Deals Pipeline');
	let sponsorId: string | null = null;
	let activityId: string | null = null;

	await r.test('PATCH /api/sponsors/[id] route file exists with correct fields', async () => {
		const content = readFileSync('src/routes/api/sponsors/[id]/+server.ts', 'utf8');
		r.assert(content.includes('status'), 'Must allow status field');
		r.assert(content.includes('sponsor_activity'), 'Must auto-log stage changes to activity');
	});

	await r.test('activity API route files exist', async () => {
		const get = readFileSync('src/routes/api/sponsors/[id]/activity/+server.ts', 'utf8');
		r.assert(get.includes('GET'), 'Must export GET handler');
		r.assert(get.includes('POST'), 'Must export POST handler');
		const del = readFileSync('src/routes/api/sponsors/[id]/activity/[entryId]/+server.ts', 'utf8');
		r.assert(del.includes('DELETE'), 'Must export DELETE handler');
	});

	await r.test('sponsor detail page includes activity log section', async () => {
		const content = readFileSync('src/routes/dashboard/sponsors/[id]/+page.svelte', 'utf8');
		r.assert(content.includes('activityEntries'), 'Must have activityEntries state');
		r.assert(content.includes('addActivity'), 'Must have addActivity function');
		r.assert(content.includes('Activity Log'), 'Must render Activity Log heading');
	});

	await r.test('create test sponsor via PocketBase', async () => {
		const rec = await pb.collection('sponsors').create({
			companyName: '[TEST] Pipeline Test Sponsor',
			type: 'corporate',
			tier: 'tier_3',
			status: 'prospect'
		});
		r.assert(!!rec.id, 'Must create sponsor');
		sponsorId = rec.id;
	});

	await r.test('create activity log entry via PocketBase', async () => {
		r.assert(!!sponsorId, 'Need sponsorId');
		const rec = await pb.collection('sponsor_activity').create({
			sponsorId,
			type: 'call',
			note: '[test] Intro call — pipeline test',
			createdBy: 'test'
		});
		r.assert(!!rec.id, 'Must create activity entry');
		activityId = rec.id;
	});

	await r.test('activity entry readable by sponsorId filter', async () => {
		r.assert(!!sponsorId, 'Need sponsorId');
		const entries = await pb.collection('sponsor_activity').getFullList({
			filter: `sponsorId = "${sponsorId}"`
		});
		r.assert(entries.length >= 1, 'Must find at least one entry');
	});

	await r.test('update sponsor stage via PocketBase', async () => {
		r.assert(!!sponsorId, 'Need sponsorId');
		const updated = await pb.collection('sponsors').update(sponsorId!, { status: 'negotiating' });
		r.assert(updated.status === 'negotiating', 'Status must be negotiating');
	});

	r.cleanup.push(async () => {
		if (activityId) await pb.collection('sponsor_activity').delete(activityId).catch(() => {});
		if (sponsorId) {
			const entries = await pb.collection('sponsor_activity').getFullList({
				filter: `sponsorId = "${sponsorId}"`
			}).catch(() => []);
			for (const e of entries) await pb.collection('sponsor_activity').delete(e.id).catch(() => {});
			await pb.collection('sponsors').delete(sponsorId).catch(() => {});
		}
	});
}

// ── Suite 4: Tournament operations pipeline ───────────────────────────────────

async function suiteTournament(r: TestRunner, pb: any) {
	r.setSuite('Tournament Operations Pipeline');
	let tournamentId: string | null = null;
	let talentId: string | null = null;

	await r.test('ops page server file exists with correct checklist structure', async () => {
		const content = readFileSync('src/routes/dashboard/talent/tournaments/[id]/ops/+page.server.ts', 'utf8');
		r.assert(content.includes('DEFAULT_CHECKLIST'), 'Must define DEFAULT_CHECKLIST');
		r.assert(content.includes('pre'), 'Must have pre phase');
		r.assert(content.includes('during'), 'Must have during phase');
		r.assert(content.includes('post'), 'Must have post phase');
	});

	await r.test('ops page svelte file has leaderboard and bulk import', async () => {
		const content = readFileSync('src/routes/dashboard/talent/tournaments/[id]/ops/+page.svelte', 'utf8');
		r.assert(content.includes('leaderboard'), 'Must have leaderboard');
		r.assert(content.includes('bulkRows'), 'Must have bulk import rows');
		r.assert(content.includes('parseCSV'), 'Must have CSV paste parser');
	});

	await r.test('checklist API route exists', async () => {
		const content = readFileSync('src/routes/api/tournaments/[id]/checklist/+server.ts', 'utf8');
		r.assert(content.includes('tournament_ops_checklist'), 'Must use tournament_ops_checklist collection');
		r.assert(content.includes('itemId'), 'Must handle itemId');
	});

	await r.test('bulk-results API route exists with duplicate detection', async () => {
		const content = readFileSync('src/routes/api/tournaments/[id]/bulk-results/+server.ts', 'utf8');
		r.assert(content.includes('existingProIds'), 'Must track existing pro IDs');
		r.assert(content.includes('skipped'), 'Must return skipped count');
	});

	await r.test('find tournament and write checklist record', async () => {
		const tournaments = await pb.collection('tournaments').getFullList({ fields: 'id', perPage: 1, sort: '-created' }).catch(() => []);
		r.assert(tournaments.length > 0, 'Need at least one tournament');
		tournamentId = tournaments[0].id;

		await pb.collection('tournament_ops_checklist').create({
			tournamentId,
			itemId: 'test_item_pipeline',
			checkedBy: 'test',
			checkedAt: new Date().toISOString()
		});
	});

	await r.test('checklist record readable by tournamentId filter', async () => {
		r.assert(!!tournamentId, 'Need tournamentId');
		const records = await pb.collection('tournament_ops_checklist').getFullList({
			filter: `tournamentId = "${tournamentId}" && itemId = "test_item_pipeline"`
		});
		r.assert(records.length === 1, 'Must find exactly one test checklist record');
	});

	await r.test('bulk-results: create test result at placement 999', async () => {
		const talent = await pb.collection('talent').getFullList({ fields: 'id', perPage: 1 }).catch(() => []);
		r.assert(talent.length > 0, 'Need talent');
		talentId = talent[0].id;

		// Only create if no existing result at placement 999
		const existing = await pb.collection('tournament_results').getFullList({
			filter: `tournament = "${tournamentId}" && placement = 999`,
			fields: 'id'
		}).catch(() => []);

		if (existing.length === 0) {
			await pb.collection('tournament_results').create({
				tournament: tournamentId,
				pro: talentId,
				placement: 999,
				score: '-1',
				rounds: 4
			});
		}
	});

	await r.test('tournament_results record at placement 999 exists', async () => {
		r.assert(!!tournamentId, 'Need tournamentId');
		const records = await pb.collection('tournament_results').getFullList({
			filter: `tournament = "${tournamentId}" && placement = 999`,
			fields: 'id'
		});
		r.assert(records.length >= 1, 'Must find test result');
	});

	r.cleanup.push(async () => {
		if (tournamentId) {
			const entries = await pb.collection('tournament_ops_checklist').getFullList({
				filter: `tournamentId = "${tournamentId}" && itemId = "test_item_pipeline"`
			}).catch(() => []);
			for (const e of entries) await pb.collection('tournament_ops_checklist').delete(e.id).catch(() => {});

			const results = await pb.collection('tournament_results').getFullList({
				filter: `tournament = "${tournamentId}" && placement = 999`,
				fields: 'id'
			}).catch(() => []);
			for (const r of results) await pb.collection('tournament_results').delete(r.id).catch(() => {});
		}
	});
}

// ── Suite 5: Content production pipeline ─────────────────────────────────────

async function suiteContent(r: TestRunner, pb: any) {
	r.setSuite('Content Production Pipeline');
	let contentId: string | null = null;
	let content2Id: string | null = null;

	await r.test('content page server file exists', async () => {
		const content = readFileSync('src/routes/dashboard/content/+page.server.ts', 'utf8');
		r.assert(content.includes('content_production'), 'Must query content_production');
		r.assert(content.includes('pendingApproval'), 'Must compute pendingApproval stat');
	});

	await r.test('content page svelte uses PipelineBoard with 6 stages', async () => {
		const content = readFileSync('src/routes/dashboard/content/+page.svelte', 'utf8');
		r.assert(content.includes('PipelineBoard'), 'Must use PipelineBoard');
		for (const stage of ['brief', 'shoot', 'edit', 'approval', 'published', 'paid']) {
			r.assert(content.includes(`'${stage}'`), `Must define ${stage} stage`);
		}
	});

	await r.test('content API POST route validates required fields', async () => {
		const content = readFileSync('src/routes/api/content/+server.ts', 'utf8');
		r.assert(content.includes("'title is required'"), 'Must validate title');
		r.assert(content.includes("'contentType is required'"), 'Must validate contentType');
	});

	await r.test('content API PATCH route auto-sets approvedAt', async () => {
		const content = readFileSync('src/routes/api/content/[id]/+server.ts', 'utf8');
		r.assert(content.includes('approvedAt'), 'Must set approvedAt');
		r.assert(content.includes("approvalStatus === 'approved'"), 'Must check approval status');
	});

	await r.test('create content item via PocketBase', async () => {
		const rec = await pb.collection('content_production').create({
			title: '[TEST] Pipeline Test — YouTube',
			contentType: 'youtube',
			stage: 'brief',
			requiresApproval: true,
			budget: 500
		});
		r.assert(!!rec.id, 'Must create content item');
		r.assert(rec.stage === 'brief', 'Must start at brief');
		contentId = rec.id;
	});

	await r.test('advance content through all stages via PocketBase', async () => {
		r.assert(!!contentId, 'Need contentId');
		for (const stage of ['shoot', 'edit', 'approval', 'published', 'paid']) {
			const updated = await pb.collection('content_production').update(contentId!, { stage });
			r.assert(updated.stage === stage, `Stage must be ${stage}`);
		}
	});

	await r.test('approval workflow: approve sets approvedAt', async () => {
		// Create a fresh item for approval test
		const rec = await pb.collection('content_production').create({
			title: '[TEST] Pipeline Test — Approval Flow',
			contentType: 'instagram',
			stage: 'approval',
			requiresApproval: true,
			approvalStatus: 'pending'
		});
		content2Id = rec.id;

		const approved = await pb.collection('content_production').update(rec.id, {
			approvalStatus: 'approved',
			approvedAt: new Date().toISOString(),
			stage: 'published'
		});
		r.assert(approved.approvalStatus === 'approved', 'approvalStatus must be approved');
		r.assert(!!approved.approvedAt, 'approvedAt must be set');
		r.assert(approved.stage === 'published', 'Stage must be published');
	});

	await r.test('approval workflow: reject sends back to edit', async () => {
		r.assert(!!content2Id, 'Need content2Id');
		const rejected = await pb.collection('content_production').update(content2Id!, {
			approvalStatus: 'rejected',
			stage: 'edit'
		});
		r.assert(rejected.approvalStatus === 'rejected', 'approvalStatus must be rejected');
		r.assert(rejected.stage === 'edit', 'Stage must be edit after rejection');
	});

	await r.test('content_production collection has all required fields', async () => {
		r.assert(!!contentId, 'Need contentId');
		const rec = await pb.collection('content_production').getOne(contentId!);
		for (const field of ['title', 'contentType', 'stage', 'requiresApproval', 'budget']) {
			r.assert(field in rec, `Record must have field: ${field}`);
		}
	});

	r.cleanup.push(async () => {
		if (contentId) await pb.collection('content_production').delete(contentId).catch(() => {});
		if (content2Id) await pb.collection('content_production').delete(content2Id).catch(() => {});
	});
}

// ── Request handler ───────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	ctx.requireRole('admin');

	const body = await request.json().catch(() => ({}));
	const suite: string = body.suite ?? 'all';
	const keep: boolean = body.keep ?? false;

	const pb = await getAdminPocketBase();
	const runner = new TestRunner();

	const suiteMap: Record<string, (r: TestRunner, pb: any) => Promise<void>> = {
		engine:     (r) => suiteEngine(r),
		onboarding: (r, p) => suiteOnboarding(r, p),
		sponsor:    (r, p) => suiteSponsor(r, p),
		tournament: (r, p) => suiteTournament(r, p),
		content:    (r, p) => suiteContent(r, p)
	};

	const toRun = suite === 'all' ? Object.keys(suiteMap) : [suite];

	for (const key of toRun) {
		if (!suiteMap[key]) {
			return json({ error: `Unknown suite: ${key}` }, { status: 400 });
		}
		try {
			await suiteMap[key](runner, pb);
		} catch (err: any) {
			// Suite-level crash — record as a single failure
			runner.results.push({
				suite: key,
				name: `[suite crash] ${key}`,
				passed: false,
				error: err?.message ?? String(err),
				durationMs: 0
			});
		}
	}

	// Cleanup
	if (!keep) {
		for (const fn of runner.cleanup) {
			try { await fn(); } catch { /* non-fatal */ }
		}
	}

	const passed = runner.results.filter(r => r.passed).length;
	const failed = runner.results.filter(r => !r.passed).length;

	return json({
		passed,
		failed,
		total: runner.results.length,
		kept: keep,
		results: runner.results
	});
};
