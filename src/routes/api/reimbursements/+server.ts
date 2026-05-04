import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// Generate next WO-NNN reference number
async function nextWorkOrderNumber(pb: any): Promise<string> {
	const existing = await pb.collection('reimbursement_claims')
		.getFullList({ fields: 'referenceNumber', sort: '-created' })
		.catch(() => []);

	let max = 0;
	for (const r of existing) {
		const match = (r.referenceNumber ?? '').match(/^WO-(\d+)$/);
		if (match) {
			const n = parseInt(match[1], 10);
			if (n > max) max = n;
		}
	}
	return `WO-${String(max + 1).padStart(3, '0')}`;
}

// POST /api/reimbursements — create a new claim (always starts as draft)
export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	if (!body.title?.trim()) return json({ message: 'Title is required' }, { status: 400 });

	try {
		const workOrder = await nextWorkOrderNumber(ctx.pb);

		const claim = await ctx.pb.collection('reimbursement_claims').create({
			title:           body.title.trim(),
			claimant:        ctx.profile?.id ?? body.claimant ?? null,
			status:          'draft',
			notes:           body.notes?.trim() || '',
			referenceNumber: workOrder,
		});

		// Create any initial items passed along with the claim
		const items = body.items ?? [];
		for (const item of items) {
			if (!item.description?.trim() || !item.amount) continue;
			await ctx.pb.collection('reimbursement_items').create({
				claim:       claim.id,
				description: item.description.trim(),
				amount:      Number(item.amount),
				date:        item.date        || null,
				category:    item.category    || 'other',
				vendor:      item.vendor?.trim()     || '',
				vendorId:    item.vendorId            || null,
				receiptUrl:  item.receiptUrl?.trim() || '',
				notes:       item.notes?.trim()      || ''
			});
		}

		// Recalculate total
		if (items.length) {
			const total = items.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
			await ctx.pb.collection('reimbursement_claims').update(claim.id, { totalAmount: total });
		}

		return json(claim, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
