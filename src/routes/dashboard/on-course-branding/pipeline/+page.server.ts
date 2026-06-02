import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	const placements = await pb.collection('branding_placements').getFullList({
		sort: 'eventDate,sponsorName'
	}).catch(() => []) as any[];

	// ── Metrics ───────────────────────────────────────────────────────────────
	const totalContracted = placements
		.filter(r => !['proposed','cancelled'].includes(r.status))
		.reduce((s, r) => s + (r.grossRevenue ?? 0), 0);
	const totalPaid = placements
		.filter(r => ['paid','activated','completed'].includes(r.status))
		.reduce((s, r) => s + (r.grossRevenue ?? 0), 0);
	const totalProposed = placements
		.filter(r => r.status === 'proposed')
		.reduce((s, r) => s + (r.grossRevenue ?? 0), 0);
	const totalPlacements = placements.reduce((s, r) => s + (r.quantity ?? 0), 0);

	// ── By sponsor ────────────────────────────────────────────────────────────
	const bySponsor: Record<string, { name: string; revenue: number; placements: number; rows: any[] }> = {};
	for (const r of placements) {
		const key = r.sponsorName;
		bySponsor[key] ??= { name: r.sponsorName, revenue: 0, placements: 0, rows: [] };
		bySponsor[key].revenue    += r.grossRevenue ?? 0;
		bySponsor[key].placements += r.quantity ?? 0;
		bySponsor[key].rows.push(r);
	}

	// ── By placement type ─────────────────────────────────────────────────────
	const byType: Record<string, { revenue: number; qty: number }> = {};
	for (const r of placements) {
		const t = r.placementType ?? 'other';
		byType[t] ??= { revenue: 0, qty: 0 };
		byType[t].revenue += r.grossRevenue ?? 0;
		byType[t].qty     += r.quantity ?? 0;
	}

	// ── By event ─────────────────────────────────────────────────────────────
	const byEvent: Record<string, { eventName: string; eventDate: string; revenue: number; rows: any[] }> = {};
	for (const r of placements) {
		const key = r.eventName;
		byEvent[key] ??= { eventName: r.eventName, eventDate: r.eventDate ?? '', revenue: 0, rows: [] };
		byEvent[key].revenue += r.grossRevenue ?? 0;
		byEvent[key].rows.push(r);
	}

	// ── Pipeline stages ───────────────────────────────────────────────────────
	const byStage = {
		proposed:   placements.filter(r => r.status === 'proposed'),
		contracted: placements.filter(r => r.status === 'contracted'),
		invoiced:   placements.filter(r => r.status === 'invoiced'),
		paid:       placements.filter(r => r.status === 'paid'),
		activated:  placements.filter(r => r.status === 'activated'),
		completed:  placements.filter(r => r.status === 'completed'),
	};

	return {
		placements,
		bySponsor: Object.values(bySponsor).sort((a, b) => b.revenue - a.revenue),
		byType,
		byEvent: Object.values(byEvent).sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
		byStage,
		metrics: {
			totalContracted,
			totalPaid,
			totalProposed,
			totalPlacements,
			sponsorCount: Object.keys(bySponsor).length,
			recordCount:  placements.length,
		},
	};
};
