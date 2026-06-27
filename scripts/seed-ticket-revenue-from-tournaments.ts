import * as dotenv from 'dotenv';
import PocketBase from 'pocketbase';

dotenv.config();

const PB_URL = (process.env.POCKETBASE_URL ?? 'http://127.0.0.1:8090').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD ?? '';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

type TournamentRow = {
	id: string;
	name?: string;
	startDate?: string;
	venue?: string;
	location?: string;
	season?: number;
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

async function authenticate() {
	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		throw new Error('Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD in environment.');
	}

	try {
		await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('Authenticated with _superusers.');
		return;
	} catch {
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('Authenticated with admins.');
	}
}

async function clearTicketSeeds() {
	const records = await pb.collection('ticket_sales').getFullList({
		filter: 'notes ~ "[ticket-seed]"',
		fields: 'id'
	}).catch(() => [] as Array<{ id: string }>);

	for (const row of records) {
		await pb.collection('ticket_sales').delete(row.id).catch(() => null);
	}

	console.log(`Cleared ${records.length} prior ticket revenue seed rows.`);
}

async function fetchTournaments(): Promise<TournamentRow[]> {
	const rows = await pb.collection('tournaments').getFullList({
		sort: 'startDate,tournamentNumber',
		fields: 'id,name,startDate,venue,location,season,tournamentNumber'
	}).catch(() => [] as TournamentRow[]);

	return rows.filter((r) => !!r.id);
}

async function createTicketRow(tournament: TournamentRow, plan: TicketSeedPlan, baseQty: number) {
	const quantity = Math.max(25, Math.round(baseQty * plan.qtyFactor));
	const grossRevenue = roundedMoney(quantity * plan.price);
	const platformFees = roundedMoney(grossRevenue * plan.feeRate);
	const netRevenue = roundedMoney(grossRevenue - platformFees);
	const eventDate = toIsoDate(tournament.startDate);
	const eventName = cleanName(tournament);
	const invoiceNumber = `seed-ticket-${tournament.id}-${plan.key}`;

	const existing = await pb.collection('ticket_sales').getFirstListItem(
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
		await pb.collection('ticket_sales').update(existing.id, payload);
		return 'updated';
	}

	await pb.collection('ticket_sales').create(payload);
	return 'created';
}

async function seedFromTournaments() {
	const args = new Set(process.argv.slice(2));
	const shouldClear = args.has('--clear') || args.has('--reset');

	console.log('Seeding ticket revenue from tournaments...');
	await authenticate();

	if (shouldClear) {
		await clearTicketSeeds();
	}

	const tournaments = await fetchTournaments();
	if (tournaments.length === 0) {
		console.log('No tournaments found. Seed tournaments first, then run this script.');
		return;
	}

	let created = 0;
	let updated = 0;
	let gross = 0;
	let net = 0;

	for (let i = 0; i < tournaments.length; i++) {
		const tournament = tournaments[i];
		const baseQty = 320 + i * 55;

		for (const plan of PLANS) {
			const result = await createTicketRow(tournament, plan, baseQty);
			const quantity = Math.max(25, Math.round(baseQty * plan.qtyFactor));
			const rowGross = roundedMoney(quantity * plan.price);
			const rowNet = roundedMoney(rowGross - roundedMoney(rowGross * plan.feeRate));

			if (result === 'created') created++;
			if (result === 'updated') updated++;

			gross += rowGross;
			net += rowNet;
		}
	}

	console.log(`Done. ${created} created, ${updated} updated across ${tournaments.length} tournaments.`);
	console.log(`Gross seeded: $${Math.round(gross).toLocaleString('en-US')}`);
	console.log(`Net seeded:   $${Math.round(net).toLocaleString('en-US')}`);
}

seedFromTournaments().catch((err: any) => {
	console.error('Ticket revenue seed failed:', err?.message ?? err);
	process.exit(1);
});
