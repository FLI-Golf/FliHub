/**
 * POST /api/sponsors/:id/purchase-order
 * Creates a Purchase Order for a contracted sponsor.
 * PO sits between "contracted" and payment — it formalises the commitment
 * before any money moves. Payments and eventually Work Orders are linked to it.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { RequestContext } from '$lib/infra/RequestContext';

function sponsorCode(name: string): string {
	return name
		.replace(/[^a-zA-Z\s]/g, '')
		.split(/\s+/)
		.filter(Boolean)
		.map((w: string) => w[0].toUpperCase())
		.join('')
		.slice(0, 6) || 'SP';
}

export const POST: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const body   = await request.json().catch(() => ({}));
	const adminPb = await getAdminPocketBase();

	const sponsor = await adminPb.collection('sponsors').getOne(params.id).catch(() => null);
	if (!sponsor) return json({ message: 'Sponsor not found' }, { status: 404 });

	if (!['contracted', 'active', 'renewed'].includes(sponsor.status)) {
		return json({ message: 'Sponsor must be contracted, active, or renewed to issue a PO' }, { status: 400 });
	}

	const amount = Number(body.amount ?? sponsor.annualCommitment ?? 0);
	if (!amount || amount <= 0) {
		return json({ message: 'amount is required and must be > 0' }, { status: 400 });
	}

	// Generate PO number: PO-SP{CODE}-{NNNN}
	const code = sponsorCode(sponsor.companyName);
	const existing = await adminPb.collection('sponsor_purchase_orders').getList(1, 1, {
		filter: `po_number ~ "PO-SP${code}-"`,
		sort:   '-po_number',
		fields: 'po_number',
	}).catch(() => ({ items: [] }));
	const lastNum = existing.items[0]?.po_number?.match(/(\d+)$/)?.[1];
	const seq     = lastNum ? parseInt(lastNum) + 1 : 1;
	const poNumber = `PO-SP${code}-${String(seq).padStart(4, '0')}`;

	try {
		const po = await adminPb.collection('sponsor_purchase_orders').create({
			po_number:    poNumber,
			sponsorId:    sponsor.id,
			amount,
			year:         body.year         ? Number(body.year) : new Date().getFullYear(),
			period_start: body.period_start ?? null,
			period_end:   body.period_end   ?? null,
			description:  body.description  || `Sponsorship agreement — ${sponsor.companyName} (${body.year ?? new Date().getFullYear()})`,
			terms:        body.terms        ?? '',
			deliverables: body.deliverables ?? '',
			dueDate:      body.dueDate      ?? null,
			status:       'draft',
			notes:        body.notes        ?? '',
			createdBy:    ctx.profile?.id   ?? null,
			assignedTo:   sponsor.assignedTo ?? null,
		});

		return json({ po, poNumber }, { status: 201 });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to create PO';
		return json({ message: msg }, { status: 500 });
	}
};
