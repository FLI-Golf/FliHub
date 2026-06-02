/**
 * /dashboard/income — Income Received Pipeline
 *
 * Aggregates all expected incoming revenue into a single pipeline view:
 *   - sponsor_payments  (from sponsors collection)
 *   - franchise_deals   (milestone payments from franchise pipeline)
 *   - payments          (direction: incoming — licensing, broadcast, other)
 *
 * Each record is normalised into a common IncomeRecord shape so the
 * PipelineBoard can render them uniformly regardless of source.
 *
 * Pipeline stages: invoiced → scheduled → received → reconciled
 */
import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export interface IncomeRecord {
	id:              string;
	sourceType:      'sponsor_payment' | 'franchise_fee' | 'license' | 'broadcast' | 'ticket_sale' | 'other';
	sourceName:      string;   // sponsor name, franchise lead name, etc.
	description:     string;   // payment type / period label
	amount:          number;
	status:          string;   // invoiced | scheduled | received | reconciled
	dueDate:         string;
	receivedDate:    string;
	reconciledDate:  string;
	invoiceNumber:   string;   // QuickBooks memo reference
	workOrderNumber: string;   // internal WO reference
	notes:           string;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		const [sponsorPayments, franchiseDeals, incomingPayments, sponsors, ticketSales] = await Promise.all([
			pb.collection('sponsor_payments').getFullList({
				sort: 'dueDate',
				expand: 'sponsor',
			}).catch(() => []),

			pb.collection('franchise_deals').getFullList({
				sort: '-created',
				expand: 'lead',
				fields: 'id,status,totalFranchiseValue,totalPaidToDate,depositPaid,invoiceNumber,workOrderNumber,receivedDate,reconciledDate,notes,expand,created',
			}).catch(() => []),

			pb.collection('payments').getFullList({
				filter: "direction = 'incoming'",
				sort: '-created',
				expand: 'sponsor,franchise',
			}).catch(() => []),

			pb.collection('sponsors').getFullList({
				fields: 'id,companyName,tier,annualCommitment,totalPaid',
			}).catch(() => []),

			pb.collection('ticket_sales').getFullList({
				sort: 'eventDate',
			}).catch(() => []),
		]);

		const records: IncomeRecord[] = [];

		// ── Sponsor payments ──────────────────────────────────────────────────
		for (const sp of sponsorPayments as any[]) {
			const sponsorName = sp.expand?.sponsor?.companyName
				?? (sponsors as any[]).find(s => s.id === sp.sponsor)?.companyName
				?? 'Unknown Sponsor';

			// Map sponsor_payment status to pipeline stage
			const stageMap: Record<string, string> = {
				pending:   'invoiced',
				invoiced:  'invoiced',
				scheduled: 'scheduled',
				received:  'received',
				reconciled:'reconciled',
				overdue:   'invoiced',
			};

			records.push({
				id:              sp.id,
				sourceType:      'sponsor_payment',
				sourceName:      sponsorName,
				description:     sp.paymentType ? `${sp.paymentType.replace(/_/g, ' ')} payment` : 'Sponsor payment',
				amount:          sp.amount ?? 0,
				status:          stageMap[sp.status] ?? 'invoiced',
				dueDate:         sp.dueDate ?? '',
				receivedDate:    sp.receivedDate ?? '',
				reconciledDate:  sp.reconciledDate ?? '',
				invoiceNumber:   sp.invoiceNumber ?? '',
				workOrderNumber: sp.workOrderNumber ?? '',
				notes:           sp.notes ?? '',
			});
		}

		// ── Franchise deal milestones ─────────────────────────────────────────
		// Each deal is treated as a single income record representing the
		// outstanding balance (totalFranchiseValue - totalPaidToDate).
		for (const deal of franchiseDeals as any[]) {
			const leadName = deal.expand?.lead
				? `${deal.expand.lead.firstName ?? ''} ${deal.expand.lead.lastName ?? ''}`.trim()
				: 'Franchise Prospect';

			const outstanding = (deal.totalFranchiseValue ?? 0) - (deal.totalPaidToDate ?? 0);
			if (outstanding <= 0 && deal.status === 'reconciled') continue; // fully paid & reconciled

			const stageMap: Record<string, string> = {
				pending:    'invoiced',
				invoiced:   'invoiced',
				scheduled:  'scheduled',
				received:   'received',
				reconciled: 'reconciled',
				active:     'scheduled',
				closed:     'received',
			};

			records.push({
				id:              deal.id,
				sourceType:      'franchise_fee',
				sourceName:      leadName,
				description:     `Franchise fee — $${(deal.totalFranchiseValue ?? 0).toLocaleString()} total`,
				amount:          outstanding > 0 ? outstanding : deal.totalFranchiseValue ?? 0,
				status:          stageMap[deal.status] ?? 'invoiced',
				dueDate:         '',
				receivedDate:    deal.receivedDate ?? '',
				reconciledDate:  deal.reconciledDate ?? '',
				invoiceNumber:   deal.invoiceNumber ?? '',
				workOrderNumber: deal.workOrderNumber ?? '',
				notes:           deal.notes ?? '',
			});
		}

		// ── Generic incoming payments ─────────────────────────────────────────
		for (const pmt of incomingPayments as any[]) {
			// Skip sponsor payments already captured above
			if (pmt.type === 'sponsor_payment') continue;

			const sourceTypeMap: Record<string, IncomeRecord['sourceType']> = {
				franchise_fee: 'franchise_fee',
				license:       'license',
				broadcast:     'broadcast',
			};

			const stageMap: Record<string, string> = {
				pending_approval: 'invoiced',
				approved:         'scheduled',
				scheduled:        'scheduled',
				received:         'received',
				reconciled:       'reconciled',
			};

			const sourceName = pmt.expand?.sponsor?.companyName
				?? pmt.expand?.franchise?.name
				?? pmt.description
				?? 'Income';

			records.push({
				id:              pmt.id,
				sourceType:      sourceTypeMap[pmt.type] ?? 'other',
				sourceName,
				description:     pmt.description ?? pmt.type ?? 'Incoming payment',
				amount:          pmt.amount ?? 0,
				status:          stageMap[pmt.status] ?? 'invoiced',
				dueDate:         pmt.dueDate ?? '',
				receivedDate:    pmt.receivedDate ?? '',
				reconciledDate:  pmt.reconciledDate ?? '',
				invoiceNumber:   pmt.invoiceNumber ?? '',
				workOrderNumber: pmt.workOrderNumber ?? '',
				notes:           pmt.notes ?? '',
			});
		}

		// ── Ticket sales ─────────────────────────────────────────────────────
		for (const ts of ticketSales as any[]) {
			const stageMap: Record<string, string> = {
				projected:  'invoiced',
				on_sale:    'invoiced',
				sold_out:   'scheduled',
				completed:  'received',
				reconciled: 'reconciled',
				cancelled:  'invoiced',
			};
			records.push({
				id:              ts.id,
				sourceType:      'ticket_sale',
				sourceName:      ts.eventName,
				description:     `${(ts.ticketType ?? 'ticket').replace(/_/g, ' ')} — ${ts.quantity ?? 0} tickets @ $${ts.pricePerTicket ?? 0}`,
				amount:          ts.netRevenue ?? ts.grossRevenue ?? ((ts.quantity ?? 0) * (ts.pricePerTicket ?? 0)),
				status:          stageMap[ts.status] ?? 'invoiced',
				dueDate:         ts.eventDate ?? '',
				receivedDate:    ts.receivedDate ?? '',
				reconciledDate:  ts.reconciledDate ?? '',
				invoiceNumber:   ts.invoiceNumber ?? '',
				workOrderNumber: '',
				notes:           ts.notes ?? '',
			});
		}

		// ── Summary metrics ───────────────────────────────────────────────────
		const totalExpected    = records.reduce((s, r) => s + r.amount, 0);
		const totalReceived    = records.filter(r => ['received','reconciled'].includes(r.status)).reduce((s, r) => s + r.amount, 0);
		const totalReconciled  = records.filter(r => r.status === 'reconciled').reduce((s, r) => s + r.amount, 0);
		const totalScheduled   = records.filter(r => r.status === 'scheduled').reduce((s, r) => s + r.amount, 0);
		const totalInvoiced    = records.filter(r => r.status === 'invoiced').reduce((s, r) => s + r.amount, 0);
		const missingQBRef     = records.filter(r => ['received','reconciled'].includes(r.status) && !r.invoiceNumber).length;

		const byStage = {
			invoiced:   records.filter(r => r.status === 'invoiced'),
			scheduled:  records.filter(r => r.status === 'scheduled'),
			received:   records.filter(r => r.status === 'received'),
			reconciled: records.filter(r => r.status === 'reconciled'),
		};

		return {
			records,
			byStage,
			metrics: {
				totalExpected,
				totalReceived,
				totalReconciled,
				totalScheduled,
				totalInvoiced,
				missingQBRef,
				count: records.length,
			},
		};

	} catch (err: any) {
		console.error('income load error:', err?.message ?? err);
		return {
			records: [],
			byStage: { invoiced: [], scheduled: [], received: [], reconciled: [] },
			metrics: null,
		};
	}
};
