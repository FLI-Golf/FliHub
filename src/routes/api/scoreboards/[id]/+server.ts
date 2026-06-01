/**
 * PATCH  /api/scoreboards/[id] — update fields or advance pipeline stage
 * DELETE /api/scoreboards/[id] — delete (admin only)
 *
 * Stage transition side-effects:
 *   → approval     : creates an approvals record
 *   → procurement  : resolves approval; creates expense + work order
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

		// ── approval: auto-create approval record ─────────────────────────────
		if (newStage === 'approval' && current.stage !== 'approval') {
			const approval = await ctx.pb.collection('approvals').create({
				entityType:    'expense',
				entityId:      params.id,
				status:        'pending',
				requestedBy:   ctx.userId,
				requestedDate: new Date().toISOString(),
				amount:        current.quotedCost ?? patch.quotedCost ?? 0,
				comments:      `Scoreboard procurement: ${current.name}`
			}).catch(() => null);
			if (approval) patch.approvalId = approval.id;
		}

		// ── procurement: resolve approval + create expense + work order ───────
		if (newStage === 'procurement' && current.stage !== 'procurement') {
			// Resolve approval
			if (current.approvalId) {
				await ctx.pb.collection('approvals').update(current.approvalId, {
					status:       'approved',
					approver:     ctx.userId,
					reviewedDate: new Date().toISOString()
				}).catch(() => {});
			}

			// Create expense
			const expense = await ctx.pb.collection('expenses').create({
				title:       `Scoreboard: ${current.name}`,
				description: current.description ?? '',
				amount:      current.approvedBudget ?? current.quotedCost ?? 0,
				status:      'draft',
				category:    'capital_equipment',
				notes:       `Scoreboard procurement. Location: ${current.location ?? '—'}`,
				sourceType:  'scoreboard',
				sourceId:    params.id
			}).catch(() => null);
			if (expense) patch.expenseId = expense.id;

			// Create work order
			const wo = await ctx.pb.collection('work_orders').create({
				title:         `Install Scoreboard: ${current.name}`,
				description:   current.description ?? '',
				status:        'pending',
				priority:      'high',
				estimatedCost: current.approvedBudget ?? current.quotedCost ?? 0,
				sourceType:    'scoreboard',
				sourceId:      params.id,
				expenseId:     expense?.id ?? null,
				notes:         `Location: ${current.location ?? '—'}. Vendor: ${current.vendorName ?? '—'}`
			}).catch(() => null);
			if (wo) patch.workOrderId = wo.id;
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
