/**
 * Consolidated seed script — vendors, sponsors, and franchise bridges.
 *
 * Usage:
 *   npx tsx scripts/seed-all.ts
 *
 * Requires env vars: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD!;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
	console.error('❌ Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD');
	process.exit(1);
}

const pb = new PocketBase(POCKETBASE_URL);

// ─── Vendor data ────────────────────────────────────────────────────────────

const VENDORS = [
	// Venues
	{ name: 'Sloan Park',           type: 'venue',            active: true },
	{ name: 'Turf Paradise',        type: 'venue',            active: true },
	{ name: 'Snapdragon Stadium',   type: 'venue',            active: true },
	{ name: 'Chicken Ranch Casino', type: 'venue',            active: true },
	{ name: 'Santa Anita Park',     type: 'venue',            active: true },
	{ name: 'Del Mar Race Track',   type: 'venue',            active: true },
	// Product suppliers
	{ name: 'GoVision',             type: 'product_supplier', active: true },
	{ name: 'Longines',             type: 'product_supplier', active: true },
	{ name: 'Zuca',                 type: 'product_supplier', active: true },
	{ name: 'Big Bully Turf',       type: 'product_supplier', active: true },
	// Beverages
	{ name: 'Rat Bastard Energy Drink', type: 'beverage',     active: true },
	{ name: 'Long Drink',           type: 'beverage',         active: true },
	{ name: 'Bacardi',              type: 'beverage',         active: true },
	// Technology
	{ name: 'Udisc',                type: 'technology',       active: true },
	{ name: 'Netflix',              type: 'technology',       active: true },
	{ name: 'Amazon Prime',         type: 'technology',       active: true },
	// Gaming
	{ name: 'Prizepicks',           type: 'gaming',           active: true },
	{ name: 'Fanduel',              type: 'gaming',           active: true },
	// Service providers
	{ name: 'Crash-call-Ash Law firm', type: 'service_provider', active: true },
	// Disc golf equipment
	{ name: 'Innova Discs',         type: 'product_supplier', active: true },
	{ name: 'Discraft',             type: 'product_supplier', active: true },
	{ name: 'Dynamic Discs',        type: 'product_supplier', active: true },
	{ name: 'MVP Disc Sports',      type: 'product_supplier', active: true },
	// Media
	{ name: 'Jomez Productions',    type: 'service_provider', active: true },
	{ name: 'Disc Golf Network',    type: 'service_provider', active: true },
	// Marketing
	{ name: 'Ace Printing Co',      type: 'service_provider', active: true },
	{ name: 'Social Media Boost',   type: 'service_provider', active: true },
	// Events
	{ name: 'Event Tents Plus',     type: 'product_supplier', active: true },
	{ name: 'Trophy Masters',       type: 'product_supplier', active: true },
	// Apparel
	{ name: 'Disc Golf Apparel Co', type: 'product_supplier', active: true },
	// Catering
	{ name: 'Catering Excellence',  type: 'service_provider', active: true },
];

// ─── Sponsor data ────────────────────────────────────────────────────────────

const TIER_PRICING: Record<string, Record<number, number>> = {
	tier_1: { 2025: 7_000_000, 2026: 5_000_000, 2027: 3_000_000 },
	tier_2: { 2025: 5_000_000, 2026: 7_000_000, 2027: 9_000_000 },
	tier_3: { 2025: 1_000_000, 2026: 1_000_000, 2027: 2_000_000 },
	tier_4: { 2025: 1_000_000, 2026: 1_500_000, 2027: 2_000_000 },
};

const SPONSORS = [
	{
		companyName: 'MGM Grand Casino',
		type: 'casino', tier: 'tier_1', status: 'active',
		primaryContactName: 'Robert Chen',
		primaryContactEmail: 'rchen@mgmgrand.com',
		primaryContactPhone: '702-555-0101',
		location: 'Las Vegas, NV', territory: 'Las Vegas',
		contractStartDate: '2025-01-01', contractEndDate: '2027-12-31',
		currentYear: 2025, franchiseInterest: true,
		notes: 'Premium casino partner. Expressed strong interest in franchise ownership for Las Vegas territory.',
	},
	{
		companyName: 'Caesars Palace',
		type: 'casino', tier: 'tier_2', status: 'active',
		primaryContactName: 'Maria Rodriguez',
		primaryContactEmail: 'mrodriguez@caesars.com',
		primaryContactPhone: '702-555-0102',
		location: 'Las Vegas, NV', territory: 'Las Vegas',
		contractStartDate: '2025-01-01', contractEndDate: '2027-12-31',
		currentYear: 2025, franchiseInterest: false,
		notes: 'Elite tier sponsor. Growing investment over 3 years.',
	},
	{
		companyName: 'Wynn Resorts',
		type: 'resort', tier: 'tier_1', status: 'negotiating',
		primaryContactName: 'David Kim',
		primaryContactEmail: 'dkim@wynnresorts.com',
		primaryContactPhone: '702-555-0103',
		location: 'Las Vegas, NV', territory: 'Las Vegas',
		currentYear: 2025, franchiseInterest: true,
		notes: 'In final negotiations for Tier 1 sponsorship. Very interested in franchise conversion.',
	},
	{
		companyName: 'Atlantis Casino Resort',
		type: 'resort', tier: 'tier_3', status: 'active',
		primaryContactName: 'Jennifer Walsh',
		primaryContactEmail: 'jwalsh@atlantis.com',
		primaryContactPhone: '242-555-0104',
		location: 'Paradise Island, Bahamas', territory: 'Caribbean',
		contractStartDate: '2025-01-01', contractEndDate: '2027-12-31',
		currentYear: 2025, franchiseInterest: false,
		notes: 'Standard tier sponsor. Consistent annual commitment.',
	},
	{
		companyName: 'Mohegan Sun',
		type: 'casino', tier: 'tier_4', status: 'prospect',
		primaryContactName: 'Thomas Anderson',
		primaryContactEmail: 'tanderson@mohegansun.com',
		primaryContactPhone: '860-555-0105',
		location: 'Uncasville, CT', territory: 'Northeast',
		currentYear: 2025, franchiseInterest: false,
		notes: 'Prospect for Tier 4 growth sponsorship. Initial discussions ongoing.',
	},
	{
		companyName: 'Hard Rock Hotel & Casino',
		type: 'casino', tier: 'tier_2', status: 'active',
		primaryContactName: 'Angela Torres',
		primaryContactEmail: 'atorres@hardrock.com',
		primaryContactPhone: '305-555-0201',
		location: 'Hollywood, FL', territory: 'Southeast',
		contractStartDate: '2025-01-01', contractEndDate: '2027-12-31',
		currentYear: 2025, franchiseInterest: true,
		notes: 'Strong brand alignment with FLI Golf entertainment model.',
	},
	{
		companyName: 'Seminole Gaming',
		type: 'casino', tier: 'tier_3', status: 'active',
		primaryContactName: 'James Osceola',
		primaryContactEmail: 'josceola@seminolegaming.com',
		primaryContactPhone: '954-555-0202',
		location: 'Tampa, FL', territory: 'Southeast',
		contractStartDate: '2025-01-01', contractEndDate: '2027-12-31',
		currentYear: 2025, franchiseInterest: false,
		notes: 'Regional casino partner covering Florida market.',
	},
	{
		companyName: 'Pechanga Resort Casino',
		type: 'resort', tier: 'tier_3', status: 'active',
		primaryContactName: 'Mark Macarro',
		primaryContactEmail: 'mmacarro@pechanga.com',
		primaryContactPhone: '951-555-0301',
		location: 'Temecula, CA', territory: 'West Coast',
		contractStartDate: '2025-01-01', contractEndDate: '2027-12-31',
		currentYear: 2025, franchiseInterest: false,
		notes: 'Southern California tribal casino partner.',
	},
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function collectionExists(name: string): Promise<boolean> {
	try {
		await pb.collection(name).getList(1, 1);
		return true;
	} catch {
		return false;
	}
}

async function alreadyExists(collection: string, filter: string): Promise<boolean> {
	try {
		const list = await pb.collection(collection).getFullList({ filter });
		return list.length > 0;
	} catch {
		return false;
	}
}

// ─── Seed vendors ─────────────────────────────────────────────────────────────

async function seedVendors() {
	console.log('\n── Vendors ──────────────────────────────────────────────');

	if (!(await collectionExists('vendors'))) {
		console.log('⚠️  vendors collection not found — skipping');
		return { created: 0, skipped: 0 };
	}

	let created = 0, skipped = 0, failed = 0;

	for (const vendor of VENDORS) {
		const exists = await alreadyExists('vendors', `name = "${vendor.name}"`);
		if (exists) {
			console.log(`  ⚠️  skip  ${vendor.name}`);
			skipped++;
			continue;
		}
		try {
			await pb.collection('vendors').create(vendor);
			console.log(`  ✅ created  ${vendor.name} (${vendor.type})`);
			created++;
		} catch (err: any) {
			console.log(`  ❌ failed  ${vendor.name}: ${err.message}`);
			failed++;
		}
	}

	console.log(`\n  Created ${created} · Skipped ${skipped} · Failed ${failed}`);
	return { created, skipped };
}

// ─── Seed sponsors ────────────────────────────────────────────────────────────

async function seedSponsors(salesProfileId: string | undefined) {
	console.log('\n── Sponsors ─────────────────────────────────────────────');

	if (!(await collectionExists('sponsors'))) {
		console.log('⚠️  sponsors collection not found — skipping');
		return [];
	}

	const created: any[] = [];

	for (const s of SPONSORS) {
		const exists = await alreadyExists('sponsors', `companyName = "${s.companyName}"`);
		if (exists) {
			console.log(`  ⚠️  skip  ${s.companyName}`);
			continue;
		}

		const annualCommitment = TIER_PRICING[s.tier]?.[s.currentYear] ?? 0;
		const totalPaid = s.status === 'active' ? annualCommitment : 0;

		const payload: Record<string, any> = {
			...s,
			contractStartDate: s.contractStartDate ? new Date(s.contractStartDate).toISOString() : undefined,
			contractEndDate:   s.contractEndDate   ? new Date(s.contractEndDate).toISOString()   : undefined,
			annualCommitment,
			totalPaid,
			assignedTo: salesProfileId,
		};

		try {
			const record = await pb.collection('sponsors').create(payload);
			console.log(`  ✅ created  ${s.companyName} (${s.tier}, ${s.status})`);
			created.push(record);
		} catch (err: any) {
			console.log(`  ❌ failed  ${s.companyName}: ${err.message}`);
		}
	}

	return created;
}

// ─── Seed franchise bridges ───────────────────────────────────────────────────

async function seedFranchiseBridges(createdSponsors: any[], salesProfileId: string | undefined) {
	console.log('\n── Franchise Conversion Bridges ─────────────────────────');

	if (!(await collectionExists('sponsor_franchise_bridge'))) {
		console.log('⚠️  sponsor_franchise_bridge collection not found — skipping');
		return;
	}

	const interested = createdSponsors.filter((s) => s.franchiseInterest);

	for (const sponsor of interested) {
		const exists = await alreadyExists('sponsor_franchise_bridge', `sponsorId = "${sponsor.id}"`);
		if (exists) {
			console.log(`  ⚠️  skip  bridge for ${sponsor.companyName}`);
			continue;
		}

		const value = sponsor.totalPaid ?? 0;
		const discountPct = Math.min((value / 1_000_000) * 10, 30);
		const franchiseFee = 10_000_000;
		const feeDiscount = Math.round((franchiseFee * discountPct) / 100);
		const netFee = franchiseFee - feeDiscount;

		try {
			await pb.collection('sponsor_franchise_bridge').create({
				sponsorId: sponsor.id,
				status: sponsor.status === 'active' ? 'interest_expressed' : 'evaluation',
				interestExpressedDate: new Date().toISOString(),
				sponsorshipValueToDate: value,
				franchiseFeeDiscount: feeDiscount,
				netFranchiseFee: netFee,
				proposedTerritory: sponsor.territory,
				targetConversionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
				assignedSalesRep: salesProfileId,
				notes: `${discountPct}% discount available based on sponsorship value.`,
			});
			console.log(`  ✅ bridge  ${sponsor.companyName} — ${discountPct}% discount · net $${netFee.toLocaleString()}`);
		} catch (err: any) {
			console.log(`  ❌ failed  bridge for ${sponsor.companyName}: ${err.message}`);
		}
	}
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	console.log('🌱 FliHub — seed all data\n');
	console.log(`   PocketBase: ${POCKETBASE_URL}`);

	await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
	console.log('✅ Authenticated\n');

	// Resolve a sales user profile (optional — used for assignedTo fields)
	let salesProfileId: string | undefined;
	try {
		const profiles = await pb.collection('user_profiles').getFullList({ filter: 'role = "sales"' });
		salesProfileId = profiles[0]?.id;
		if (salesProfileId) console.log(`   Sales profile: ${salesProfileId}`);
	} catch {
		// user_profiles may not exist yet — that's fine
	}

	const { created: vendorsCreated } = await seedVendors();
	const createdSponsors = await seedSponsors(salesProfileId);
	await seedFranchiseBridges(createdSponsors, salesProfileId);

	console.log('\n══════════════════════════════════════════════════════════');
	console.log('✅ Seed complete');
	console.log(`   Vendors created : ${vendorsCreated}`);
	console.log(`   Sponsors created: ${createdSponsors.length}`);
	console.log('══════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
	console.error('❌ Fatal:', err.message ?? err);
	process.exit(1);
});
