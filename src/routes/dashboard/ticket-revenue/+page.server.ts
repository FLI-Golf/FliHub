import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	const sales = await pb.collection('ticket_sales').getFullList({
		sort: 'eventDate'
	}).catch(() => []) as any[];
	const grossFor = (r: any) => r.grossRevenue ?? ((r.quantity ?? 0) * (r.pricePerTicket ?? 0));

	// ── Metrics ───────────────────────────────────────────────────────────────
	const totalGross      = sales.reduce((s, r) => s + grossFor(r), 0);
	const totalNet        = sales.reduce((s, r) => s + (r.netRevenue ?? 0), 0);
	const totalFees       = sales.reduce((s, r) => s + (r.platformFees ?? 0), 0);
	const totalTickets    = sales.reduce((s, r) => s + (r.quantity ?? 0), 0);
	const totalReconciled = sales.filter(r => r.status === 'reconciled').reduce((s, r) => s + (r.netRevenue ?? 0), 0);
	const totalReceived   = sales.filter(r => ['completed', 'reconciled'].includes(r.status)).reduce((s, r) => s + (r.netRevenue ?? 0), 0);
	const totalProjected  = sales.filter(r => ['projected', 'on_sale'].includes(r.status)).reduce((s, r) => s + grossFor(r), 0);

	// ── By event ─────────────────────────────────────────────────────────────
	const byEvent: Record<string, { eventName: string; eventDate: string; venue: string; gross: number; net: number; tickets: number; rows: any[] }> = {};
	for (const r of sales) {
		const key = r.eventName;
		byEvent[key] ??= { eventName: r.eventName, eventDate: r.eventDate, venue: r.venue ?? '', gross: 0, net: 0, tickets: 0, rows: [] };
		byEvent[key].gross   += grossFor(r);
		byEvent[key].net     += r.netRevenue ?? 0;
		byEvent[key].tickets += r.quantity ?? 0;
		byEvent[key].rows.push(r);
	}

	// ── By ticket type ────────────────────────────────────────────────────────
	const byType: Record<string, { gross: number; tickets: number }> = {};
	for (const r of sales) {
		const t = r.ticketType ?? 'unknown';
		byType[t] ??= { gross: 0, tickets: 0 };
		byType[t].gross   += grossFor(r);
		byType[t].tickets += r.quantity ?? 0;
	}

	// ── By channel ────────────────────────────────────────────────────────────
	const byChannel: Record<string, number> = {};
	for (const r of sales) {
		const c = r.salesChannel ?? 'unknown';
		byChannel[c] = (byChannel[c] ?? 0) + grossFor(r);
	}

	return {
		sales,
		events: Object.values(byEvent).sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
		byType,
		byChannel,
		metrics: {
			totalGross,
			totalNet,
			totalFees,
			totalTickets,
			totalReconciled,
			totalReceived,
			totalProjected,
			eventCount: Object.keys(byEvent).length,
			recordCount: sales.length,
		},
	};
};
