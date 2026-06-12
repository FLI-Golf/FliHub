import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

function mapTrademarkCategory(expenseType: string): string {
	const normalized = String(expenseType || '').toLowerCase();
	if (normalized.includes('filing') || normalized.includes('registration')) return 'Legal';
	if (normalized.includes('renewal') || normalized.includes('maintenance')) return 'Legal';
	if (normalized.includes('research') || normalized.includes('search')) return 'Legal';
	if (normalized.includes('watch') || normalized.includes('monitor')) return 'Legal';
	return 'Legal';
}

function mapTrademarkStatusToExpense(status: string): string {
	const normalized = String(status || '').toLowerCase();
	if (normalized === 'submitted') return 'submitted';
	if (normalized === 'approved') return 'approved';
	if (normalized === 'paid') return 'paid';
	if (normalized === 'rejected') return 'rejected';
	return 'draft';
}

async function ensureExpenseApproval(pb: any, expenseId: string, requestedBy: string | null, amount: number) {
	if (!expenseId) return;
	const existing = await pb.collection('approvals').getFullList({
		filter: `entityType = \"expense\" && entityId = \"${expenseId}\" && status = \"pending\"`
	}).catch(() => []);
	if ((existing as any[]).length > 0) return;

	await pb.collection('approvals').create({
		entityType: 'expense',
		entityId: expenseId,
		status: 'pending',
		requestedBy: requestedBy ?? null,
		requestedDate: new Date().toISOString(),
		amount: amount || 0,
		comments: '<p>Trademark expense submitted for approval.</p>'
	}).catch(() => null);
}

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	const allowed = ['expenseType','amount','status','description','invoiceNumber','invoiceDate','paidDate','notes','filingId','billingGroupId'];
	const patch: Record<string, unknown> = {};
	for (const key of allowed) {
		if (key in body) patch[key] = body[key];
	}

	try {
		const current = await ctx.pb.collection('trademark_expenses').getOne(params.id);
		const updated = await ctx.pb.collection('trademark_expenses').update(params.id, patch);

		const centralPatch = {
			title:       `Trademark: ${String(updated.expenseType ?? current.expenseType ?? '').trim() || 'Expense'}`,
			description: String(updated.description ?? current.description ?? '').trim(),
			amount:      Number(updated.amount ?? current.amount ?? 0) || 0,
			status:      mapTrademarkStatusToExpense(String(updated.status ?? current.status ?? 'draft')),
			category:    mapTrademarkCategory(String(updated.expenseType ?? current.expenseType ?? '')),
			notes:       String(updated.notes ?? current.notes ?? '').trim(),
			sourceType:  'trademark_expense',
			sourceId:    params.id
		};

		const existingCentral = await ctx.pb.collection('expenses').getFirstListItem(
			`sourceType = \"trademark_expense\" && sourceId = \"${params.id}\"`
		).catch(() => null);

		if (existingCentral) {
			await ctx.pb.collection('expenses').update(existingCentral.id, centralPatch).catch(() => null);
			if (centralPatch.status === 'submitted') {
				await ensureExpenseApproval(
					ctx.pb,
					existingCentral.id,
					ctx.profile?.id ?? ctx.userId ?? null,
					centralPatch.amount
				);
			}
		} else {
			const createdCentral = await ctx.pb.collection('expenses').create(centralPatch).catch(() => null);
			if (centralPatch.status === 'submitted' && createdCentral?.id) {
				await ensureExpenseApproval(
					ctx.pb,
					createdCentral.id,
					ctx.profile?.id ?? ctx.userId ?? null,
					centralPatch.amount
				);
			}
		}

		return json(updated);
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (ctx.role !== 'admin') return json({ message: 'Forbidden' }, { status: 403 });
	try {
		await ctx.pb.collection('trademark_expenses').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};
