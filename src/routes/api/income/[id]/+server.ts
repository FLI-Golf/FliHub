/**
 * PATCH /api/income/[id] — advance an income record through the pipeline.
 *
 * Body fields (all optional):
 *   status          — new pipeline stage: invoiced | scheduled | received | reconciled
 *   invoiceNumber   — QuickBooks invoice / memo reference number
 *   workOrderNumber — internal WO reference (e.g. WO-MKTG-0012)
 *   receivedDate    — ISO date string, stamped automatically when status → received
 *   reconciledDate  — ISO date string, stamped automatically when status → reconciled
 *   notes           — free-form notes
 *   sourceType      — 'sponsor_payment' | 'franchise_fee' | 'license' | 'broadcast' | 'other'
 *
 * The route writes to whichever collection owns the record:
 *   sponsor_payment  → sponsor_payments collection (also syncs sponsor.totalPaid)
 *   franchise_fee    → franchise_deals collection  (also syncs deal.totalPaidToDate)
 *   other            → payments collection (direction: incoming)
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

const STAGE_ORDER = ['invoiced', 'scheduled', 'received', 'reconciled'] as const;
type Stage = typeof STAGE_ORDER[number];

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const { pb } = ctx;
	const body = await request.json().catch(() => ({})) as Record<string, any>;

	const { sourceType = 'sponsor_payment' } = body;
	const newStatus: Stage | undefined = body.status;

	// Auto-stamp dates on stage transitions
	const now = new Date().toISOString();
	const extraFields: Record<string, any> = {};
	if (newStatus === 'received'    && !body.receivedDate)   extraFields.receivedDate   = now;
	if (newStatus === 'reconciled'  && !body.reconciledDate) extraFields.reconciledDate = now;

	try {
		if (sourceType === 'sponsor_payment') {
			// ── sponsor_payments ──────────────────────────────────────────────
			const existing = await pb.collection('sponsor_payments')
				.getOne(params.id, { fields: 'id,sponsor,amount,status' });

			const wasReceived = existing.status === 'received';
			const nowReceived = newStatus === 'received';

			const record = await pb.collection('sponsor_payments').update(params.id, {
				...(newStatus              !== undefined && { status:          newStatus }),
				...(body.invoiceNumber     !== undefined && { invoiceNumber:   body.invoiceNumber }),
				...(body.workOrderNumber   !== undefined && { workOrderNumber: body.workOrderNumber }),
				...(body.receivedDate      !== undefined && { receivedDate:    body.receivedDate || null }),
				...(body.notes             !== undefined && { notes:           body.notes }),
				...extraFields,
			});

			// Sync sponsor.totalPaid on received transition
			if (!wasReceived && nowReceived) {
				const sponsor = await pb.collection('sponsors')
					.getOne(existing.sponsor, { fields: 'id,totalPaid' }).catch(() => null);
				if (sponsor) {
					await pb.collection('sponsors').update(existing.sponsor, {
						totalPaid: (sponsor.totalPaid || 0) + (existing.amount || 0)
					});
				}
			} else if (wasReceived && newStatus && newStatus !== 'received') {
				const sponsor = await pb.collection('sponsors')
					.getOne(existing.sponsor, { fields: 'id,totalPaid' }).catch(() => null);
				if (sponsor) {
					await pb.collection('sponsors').update(existing.sponsor, {
						totalPaid: Math.max(0, (sponsor.totalPaid || 0) - existing.amount)
					});
				}
			}

			return json(record);

		} else if (sourceType === 'franchise_fee') {
			// ── franchise_deals milestone ─────────────────────────────────────
			const existing = await pb.collection('franchise_deals')
				.getOne(params.id, { fields: 'id,totalPaidToDate,totalFranchiseValue,status' });

			const wasReceived = existing.status === 'received';
			const nowReceived = newStatus === 'received';

			const record = await pb.collection('franchise_deals').update(params.id, {
				...(newStatus              !== undefined && { status:            newStatus }),
				...(body.invoiceNumber     !== undefined && { invoiceNumber:     body.invoiceNumber }),
				...(body.workOrderNumber   !== undefined && { workOrderNumber:   body.workOrderNumber }),
				...(body.receivedDate      !== undefined && { receivedDate:      body.receivedDate || null }),
				...(body.reconciledDate    !== undefined && { reconciledDate:    body.reconciledDate || null }),
				...(body.notes             !== undefined && { notes:             body.notes }),
				...extraFields,
			});

			// Sync totalPaidToDate when a milestone is received
			if (!wasReceived && nowReceived && body.milestoneAmount) {
				await pb.collection('franchise_deals').update(params.id, {
					totalPaidToDate: (existing.totalPaidToDate || 0) + Number(body.milestoneAmount)
				});
			}

			return json(record);

		} else {
			// ── generic payments collection (direction: incoming) ─────────────
			const record = await pb.collection('payments').update(params.id, {
				...(newStatus              !== undefined && { status:          newStatus }),
				...(body.invoiceNumber     !== undefined && { invoiceNumber:   body.invoiceNumber }),
				...(body.workOrderNumber   !== undefined && { workOrderNumber: body.workOrderNumber }),
				...(body.receivedDate      !== undefined && { receivedDate:    body.receivedDate || null }),
				...(body.reconciledDate    !== undefined && { reconciledDate:  body.reconciledDate || null }),
				...(body.notes             !== undefined && { notes:           body.notes }),
				...extraFields,
			});
			return json(record);
		}

	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to update income record';
		return json({ message: msg }, { status: 500 });
	}
};
