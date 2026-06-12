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

function toIsoDate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
	const d = new Date(date);
	d.setUTCMonth(d.getUTCMonth() + months);
	return d;
}

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

	const paymentParts = Number(body.paymentParts ?? 1);
	if (!Number.isInteger(paymentParts) || paymentParts < 1 || paymentParts > 6) {
		return json({ message: 'paymentParts must be an integer between 1 and 6' }, { status: 400 });
	}

	const poYear = body.year ? Number(body.year) : new Date().getFullYear();

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
		const sentDate = toIsoDate(new Date());
		const po = await adminPb.collection('sponsor_purchase_orders').create({
			po_number:    poNumber,
			sponsorId:    sponsor.id,
			amount,
			year:         poYear,
			period_start: body.period_start ?? null,
			period_end:   body.period_end   ?? null,
			description:  body.description  || `Sponsorship agreement — ${sponsor.companyName} (${poYear})`,
			terms:        body.terms        ?? '',
			deliverables: body.deliverables ?? '',
			dueDate:      body.dueDate      ?? null,
			status:       'sent',
			sentDate,
			notes:        body.notes        ?? '',
			createdBy:    ctx.profile?.id   ?? null,
			assignedTo:   sponsor.assignedTo ?? null,
		});

		const totalCents = Math.round(amount * 100);
		const baseCents = Math.floor(totalCents / paymentParts);
		const remainder = totalCents - baseCents * paymentParts;
		const scheduleStart = new Date(Date.UTC(poYear, 0, 15));

		for (let i = 0; i < paymentParts; i++) {
			const partCents = baseCents + (i < remainder ? 1 : 0);
			const partAmount = partCents / 100;
			const monthOffset = Math.round((i * 12) / paymentParts);
			const dueDate = paymentParts === 1
				? (body.dueDate ?? null)
				: toIsoDate(addMonths(scheduleStart, monthOffset));

			await adminPb.collection('sponsor_payments').create({
				sponsor:       sponsor.id,
				poId:          po.id,
				amount:        partAmount,
				paymentType:   paymentParts === 1 ? 'annual_fee' : 'installment',
				status:        'invoiced',
				dueDate,
				year:          poYear,
				invoiceNumber: paymentParts === 1 ? po.po_number : `${po.po_number}-${String(i + 1).padStart(2, '0')}`,
				notes:         paymentParts === 1 ? (body.notes ?? '') : `Installment ${i + 1} of ${paymentParts}`,
				recordedBy:    ctx.profile?.id ?? null,
			});
		}

		return json({ po, poNumber, paymentParts }, { status: 201 });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to create PO';
		return json({ message: msg }, { status: 500 });
	}
};
