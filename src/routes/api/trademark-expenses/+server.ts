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

// GET /api/trademark-expenses?filingId=xxx&billingGroupId=xxx
export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx          = await RequestContext.from(locals, url);
	const filingId     = url.searchParams.get('filingId');
	const groupId      = url.searchParams.get('billingGroupId');

	const filters: string[] = [];
	if (filingId) filters.push(`filingId="${filingId}"`);
	if (groupId)  filters.push(`billingGroupId="${groupId}"`);

	try {
		const expenses = await ctx.pb.collection('trademark_expenses').getFullList({
			filter: filters.join(' && ') || '',
			sort:   '-created',
			expand: 'filingId,billingGroupId'
		});
		return json(expenses);
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};

// POST /api/trademark-expenses
export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	if (!body.expenseType) return json({ message: 'expenseType is required' }, { status: 400 });
	if (body.amount == null) return json({ message: 'amount is required' },    { status: 400 });

	try {
		const expense = await ctx.pb.collection('trademark_expenses').create({
			filingId:       body.filingId       || null,
			billingGroupId: body.billingGroupId || null,
			expenseType:    body.expenseType,
			amount:         Number(body.amount),
			status:         body.status         || 'pending',
			description:    body.description?.trim()   || '',
			invoiceNumber:  body.invoiceNumber?.trim()  || '',
			invoiceDate:    body.invoiceDate    || null,
			paidDate:       body.paidDate       || null,
			notes:          body.notes?.trim()  || ''
		});

		const expenseStatus = mapTrademarkStatusToExpense(expense.status);
		const centralExpense = await ctx.pb.collection('expenses').create({
			title:       `Trademark: ${expense.expenseType}`,
			description: expense.description || `Trademark ${expense.expenseType} expense`,
			amount:      Number(expense.amount) || 0,
			status:      expenseStatus,
			category:    mapTrademarkCategory(expense.expenseType),
			notes:       expense.notes || '',
			sourceType:  'trademark_expense',
			sourceId:    expense.id
		}).catch(() => null);

		if (expenseStatus === 'submitted' && centralExpense?.id) {
			await ensureExpenseApproval(
				ctx.pb,
				centralExpense.id,
				ctx.profile?.id ?? ctx.userId ?? null,
				Number(expense.amount) || 0
			);
		}

		return json(expense, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};
