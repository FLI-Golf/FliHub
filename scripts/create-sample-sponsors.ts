import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

// Tier pricing
const TIER_PRICING = {
	tier_1: { 2025: 7000000, 2026: 5000000, 2027: 3000000 },
	tier_2: { 2025: 5000000, 2026: 7000000, 2027: 9000000 },
	tier_3: { 2025: 1000000, 2026: 1000000, 2027: 2000000 },
	tier_4: { 2025: 1000000, 2026: 1500000, 2027: 2000000 }
};

async function createSampleSponsors() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');

		// Get sales user profile
		const salesProfiles = await pb.collection('user_profiles').getFullList({
			filter: 'role = "sales"'
		});
		const salesProfile = salesProfiles[0];

		// Sample casino sponsors
		const sponsors = [
			{
				companyName: 'MGM Grand Casino',
				type: 'casino',
				tier: 'tier_1',
				status: 'active',
				primaryContactName: 'Robert Chen',
				primaryContactEmail: 'rchen@mgmgrand.com',
				primaryContactPhone: '702-555-0101',
				location: 'Las Vegas, NV',
				territory: 'Las Vegas',
				contractStartDate: new Date('2025-01-01').toISOString(),
				contractEndDate: new Date('2027-12-31').toISOString(),
				currentYear: 2025,
				annualCommitment: TIER_PRICING.tier_1[2025],
				totalPaid: TIER_PRICING.tier_1[2025],
				franchiseInterest: true,
				assignedTo: salesProfile?.id,
				notes: 'Premium casino partner. Expressed strong interest in franchise ownership for Las Vegas territory.'
			},
			{
				companyName: 'Caesars Palace',
				type: 'casino',
				tier: 'tier_2',
				status: 'active',
				primaryContactName: 'Maria Rodriguez',
				primaryContactEmail: 'mrodriguez@caesars.com',
				primaryContactPhone: '702-555-0102',
				location: 'Las Vegas, NV',
				territory: 'Las Vegas',
				contractStartDate: new Date('2025-01-01').toISOString(),
				contractEndDate: new Date('2027-12-31').toISOString(),
				currentYear: 2025,
				annualCommitment: TIER_PRICING.tier_2[2025],
				totalPaid: TIER_PRICING.tier_2[2025],
				franchiseInterest: false,
				assignedTo: salesProfile?.id,
				notes: 'Elite tier sponsor. Growing investment over 3 years.'
			},
			{
				companyName: 'Wynn Resorts',
				type: 'resort',
				tier: 'tier_1',
				status: 'negotiating',
				primaryContactName: 'David Kim',
				primaryContactEmail: 'dkim@wynnresorts.com',
				primaryContactPhone: '702-555-0103',
				location: 'Las Vegas, NV',
				territory: 'Las Vegas',
				currentYear: 2025,
				annualCommitment: TIER_PRICING.tier_1[2025],
				totalPaid: 0,
				franchiseInterest: true,
				assignedTo: salesProfile?.id,
				notes: 'In final negotiations for Tier 1 sponsorship. Very interested in franchise conversion.'
			},
			{
				companyName: 'Atlantis Casino Resort',
				type: 'resort',
				tier: 'tier_3',
				status: 'active',
				primaryContactName: 'Jennifer Walsh',
				primaryContactEmail: 'jwalsh@atlantis.com',
				primaryContactPhone: '242-555-0104',
				location: 'Paradise Island, Bahamas',
				territory: 'Caribbean',
				contractStartDate: new Date('2025-01-01').toISOString(),
				contractEndDate: new Date('2027-12-31').toISOString(),
				currentYear: 2025,
				annualCommitment: TIER_PRICING.tier_3[2025],
				totalPaid: TIER_PRICING.tier_3[2025],
				franchiseInterest: false,
				assignedTo: salesProfile?.id,
				notes: 'Standard tier sponsor. Consistent annual commitment.'
			},
			{
				companyName: 'Mohegan Sun',
				type: 'casino',
				tier: 'tier_4',
				status: 'prospect',
				primaryContactName: 'Thomas Anderson',
				primaryContactEmail: 'tanderson@mohegansun.com',
				primaryContactPhone: '860-555-0105',
				location: 'Uncasville, CT',
				territory: 'Northeast',
				currentYear: 2025,
				annualCommitment: TIER_PRICING.tier_4[2025],
				totalPaid: 0,
				franchiseInterest: false,
				assignedTo: salesProfile?.id,
				notes: 'Prospect for Tier 4 growth sponsorship. Initial discussions ongoing.'
			}
		];

		console.log('📊 Creating sample casino sponsors...\n');

		const createdSponsors = [];
		for (const sponsor of sponsors) {
			try {
				const created = await pb.collection('sponsors').create(sponsor);
				console.log(`✅ Created: ${sponsor.companyName} (${sponsor.tier.toUpperCase()}, ${sponsor.status})`);
				createdSponsors.push(created);
			} catch (error: any) {
				console.log(`⚠️  ${sponsor.companyName}: ${error.message}`);
			}
		}

		// Create sponsor-to-franchise bridges for interested sponsors
		console.log('\n🌉 Creating franchise conversion bridges...\n');

		const interestedSponsors = createdSponsors.filter((s: any) => s.franchiseInterest);
		
		for (const sponsor of interestedSponsors) {
			try {
				const sponsorshipValue = sponsor.totalPaid || 0;
				const discount = Math.min((sponsorshipValue / 1000000) * 10, 30);
				const franchiseFee = 10000000;
				const franchiseFeeDiscount = Math.round((franchiseFee * discount) / 100);
				const netFranchiseFee = franchiseFee - franchiseFeeDiscount;

				const bridge = await pb.collection('sponsor_franchise_bridge').create({
					sponsorId: sponsor.id,
					status: sponsor.status === 'active' ? 'interest_expressed' : 'evaluation',
					interestExpressedDate: new Date().toISOString(),
					sponsorshipValueToDate: sponsorshipValue,
					franchiseFeeDiscount: franchiseFeeDiscount,
					netFranchiseFee: netFranchiseFee,
					proposedTerritory: sponsor.territory,
					targetConversionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
					assignedSalesRep: salesProfile?.id,
					notes: `Sponsor has expressed interest in franchise ownership. ${discount}% discount available based on sponsorship value.`
				});

				console.log(`✅ Bridge created for ${sponsor.companyName}`);
				console.log(`   Sponsorship Value: $${sponsorshipValue.toLocaleString()}`);
				console.log(`   Franchise Fee Discount: $${franchiseFeeDiscount.toLocaleString()} (${discount}%)`);
				console.log(`   Net Franchise Fee: $${netFranchiseFee.toLocaleString()}\n`);
			} catch (error: any) {
				console.log(`⚠️  Bridge for ${sponsor.companyName}: ${error.message}\n`);
			}
		}

		console.log('✅ Sample sponsor data created successfully!\n');
		console.log('📈 Summary:');
		console.log(`   Total Sponsors: ${createdSponsors.length}`);
		console.log(`   Active: ${createdSponsors.filter((s: any) => s.status === 'active').length}`);
		console.log(`   Prospects: ${createdSponsors.filter((s: any) => s.status === 'prospect' || s.status === 'negotiating').length}`);
		console.log(`   Franchise Interest: ${interestedSponsors.length}`);
		console.log('\n💰 Tier Distribution:');
		console.log(`   Tier 1: ${createdSponsors.filter((s: any) => s.tier === 'tier_1').length}`);
		console.log(`   Tier 2: ${createdSponsors.filter((s: any) => s.tier === 'tier_2').length}`);
		console.log(`   Tier 3: ${createdSponsors.filter((s: any) => s.tier === 'tier_3').length}`);
		console.log(`   Tier 4: ${createdSponsors.filter((s: any) => s.tier === 'tier_4').length}`);
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

createSampleSponsors();
