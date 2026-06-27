import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

type TournamentRow = {
	id: string;
	name?: string;
	startDate?: string;
	venue?: string;
	location?: string;
	tournamentNumber?: number;
};

type TicketSeedStatus = 'projected' | 'on_sale' | 'completed' | 'reconciled';
type TicketSeedType = 'general_admission' | 'vip' | 'group';
type TicketSeedChannel = 'website' | 'box_office' | 'third_party';

type TicketSeedPlan = {
	key: string;
	status: TicketSeedStatus;
	ticketType: TicketSeedType;
	salesChannel: TicketSeedChannel;
	feeRate: number;
	qtyFactor: number;
	price: number;
};

const PLANS: TicketSeedPlan[] = [
	{
		key: 'ga-web',
		status: 'on_sale',
		ticketType: 'general_admission',
		salesChannel: 'website',
		feeRate: 0.04,
		qtyFactor: 1,
		price: 65,
	},
	{
		key: 'vip-box',
		status: 'completed',
		ticketType: 'vip',
		salesChannel: 'box_office',
		feeRate: 0.02,
		qtyFactor: 0.18,
		price: 180,
	},
	{
		key: 'group-third-party',
		status: 'reconciled',
		ticketType: 'group',
		salesChannel: 'third_party',
		feeRate: 0.06,
		qtyFactor: 0.35,
		price: 52,
	},
];

function toIsoDate(value?: string): string {
	if (!value) return new Date().toISOString().slice(0, 10);
	return new Date(value).toISOString().slice(0, 10);
}

function cleanName(t: TournamentRow): string {
	return t.name?.trim() || `Tournament ${t.tournamentNumber ?? ''}`.trim();
}

function roundedMoney(value: number): number {
	return Math.round(value * 100) / 100;
}

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const body = await request.json().catch(() => ({}));
	const shouldReset = body?.reset === true;

	try {
		if (shouldReset) {
			const existingSeedRows = await ctx.pb.collection('ticket_sales').getFullList({
				filter: 'notes ~ "[ticket-seed]"',
				fields: 'id'
			}).catch(() => [] as Array<{ id: string }>);

			for (const row of existingSeedRows) {
				await ctx.pb.collection('ticket_sales').delete(row.id).catch(() => null);
			}
		}

		const tournaments = await ctx.pb.collection('tournaments').getFullList({
			sort: 'startDate,tournamentNumber',
			fields: 'id,name,startDate,venue,location,tournamentNumber'
		}).catch(() => [] as TournamentRow[]);

		if (tournaments.length === 0) {
			return json({ message: 'No tournaments found. Seed tournaments first.' }, { status: 400 });
		}

		let created = 0;
		let updated = 0;

		for (let i = 0; i < tournaments.length; i++) {
			const tournament = tournaments[i];
			const baseQty = 320 + i * 55;
			const eventName = cleanName(tournament);
			const eventDate = toIsoDate(tournament.startDate);

			for (const plan of PLANS) {
				const quantity = Math.max(25, Math.round(baseQty * plan.qtyFactor));
				const grossRevenue = roundedMoney(quantity * plan.price);
				const platformFees = roundedMoney(grossRevenue * plan.feeRate);
				const netRevenue = roundedMoney(grossRevenue - platformFees);
				const invoiceNumber = `seed-ticket-${tournament.id}-${plan.key}`;

				const existing = await ctx.pb.collection('ticket_sales').getFirstListItem(
					`invoiceNumber = "${invoiceNumber}"`,
					{ fields: 'id' }
				).catch(() => null);

				const payload = {
					eventName,
					eventDate,
					venue: tournament.venue || tournament.location || '',
					ticketType: plan.ticketType,
					quantity,
					pricePerTicket: plan.price,
					grossRevenue,
					platformFees,
					netRevenue,
					status: plan.status,
					salesChannel: plan.salesChannel,
					tournamentId: tournament.id,
					invoiceNumber,
					receivedDate: ['completed', 'reconciled'].includes(plan.status) ? eventDate : null,
					reconciledDate: plan.status === 'reconciled' ? eventDate : null,
					notes: `[ticket-seed] Tournament-linked revenue seed for ${eventName}.`,
				};

				if (existing?.id) {
					await ctx.pb.collection('ticket_sales').update(existing.id, payload);
					updated++;
				} else {
					await ctx.pb.collection('ticket_sales').create(payload);
					created++;
				}
			}
		}

		return json({
			message: `Ticket revenue testing data ready. ${created} created, ${updated} updated across ${tournaments.length} tournaments.`,
			created,
			updated,
			tournaments: tournaments.length,
		});
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Seed failed' }, { status: 500 });
	}
};
