/**
 * PATCH  /api/scoreboards/[id] — update fields or advance pipeline stage
 * DELETE /api/scoreboards/[id] — delete (admin only)
 *
 * Stage transition side-effects:
 *   → approval     : creates/submits a linked expense and approval request
 *   → procurement  : ensures linked expense remains on approval pipeline (no direct WO)
 *   → cancelled    : marks any open approval as rejected
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

const ALLOWED = [
	'name','location','displayType','stage','widthFt','heightFt',
	'vendorName','quotedCost','approvedBudget','actualCost',
	'installDate','warrantyExpiry','description','notes'
];

export const PATCH: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => ({}));

	const patch: Record<string, any> = {};
	for (const key of ALLOWED) {
		if (key in body) patch[key] = body[key];
	}
	if (!Object.keys(patch).length) return json({ message: 'Nothing to update' }, { status: 400 });

	try {
		const current = await ctx.pb.collection('scoreboards').getOne(params.id);
		const newStage: string | undefined = patch.stage;

		const amount = Number(current.approvedBudget ?? patch.approvedBudget ?? current.quotedCost ?? patch.quotedCost ?? 0) || 0;
		const ensureSubmittedExpense = async () => {
			const existingById = current.expenseId
				? await ctx.pb.collection('expenses').getOne(current.expenseId).catch(() => null)
				: null;
			const existingBySource = existingById
				? existingById
				: await ctx.pb.collection('expenses').getFirstListItem(
					`sourceType = \"scoreboard\" && sourceId = \"${params.id}\"`
				).catch(() => null);

			const expensePayload = {
				title:       `Scoreboard: ${current.name}`,
				description: current.description ?? '',
				amount,
				status:      'submitted',
				category:    'capital_equipment',
				notes:       `Scoreboard procurement. Location: ${current.location ?? '—'}`,
				sourceType:  'scoreboard',
				sourceId:    params.id
			};

			if (existingBySource) {
				const updatedExpense = await ctx.pb.collection('expenses').update(existingBySource.id, expensePayload);
				patch.expenseId = updatedExpense.id;
				return updatedExpense;
			}

			const createdExpense = await ctx.pb.collection('expenses').create(expensePayload);
			patch.expenseId = createdExpense.id;
			return createdExpense;
		};

		const ensurePendingApproval = async (expenseId: string) => {
			const existingApproval = await ctx.pb.collection('approvals').getFirstListItem(
				`entityType = \"expense\" && entityId = \"${expenseId}\" && status = \"pending\"`
			).catch(() => null);
			if (existingApproval) {
				patch.approvalId = existingApproval.id;
				return existingApproval;
			}

			const createdApproval = await ctx.pb.collection('approvals').create({
				entityType:    'expense',
				entityId:      expenseId,
				status:        'pending',
				requestedBy:   ctx.userId,
				requestedDate: new Date().toISOString(),
				amount,
				comments:      `Scoreboard procurement: ${current.name}`
			}).catch(() => null);
			if (createdApproval) patch.approvalId = createdApproval.id;
			return createdApproval;
		};

		// ── approval: create/submit expense and pending approval ───────────────
		if (newStage === 'approval' && current.stage !== 'approval') {
			const expense = await ensureSubmittedExpense();
			await ensurePendingApproval(expense.id);
		}

		// ── procurement: keep pipeline on expense approval path ─────────────────
		if (newStage === 'procurement' && current.stage !== 'procurement') {
			const expense = await ensureSubmittedExpense();
			await ensurePendingApproval(expense.id);
			if ('workOrderId' in patch) delete patch.workOrderId;
		}

		// ── cancelled: reject any open approval ───────────────────────────────
		if (newStage === 'cancelled' && current.approvalId) {
			await ctx.pb.collection('approvals').update(current.approvalId, {
				status: 'rejected',
				reviewedDate: new Date().toISOString()
			}).catch(() => {});
		}

		const updated = await ctx.pb.collection('scoreboards').update(params.id, patch);
		return json(updated);
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	ctx.requireRole('admin');
	try {
		await ctx.pb.collection('scoreboards').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};
