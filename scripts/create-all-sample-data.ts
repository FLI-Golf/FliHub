import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function createAllSampleData() {
	try {
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

		if (!salesProfile) {
			console.log('⚠️  No sales user found. Creating one...');
			// Sales user should already exist from previous setup
		}

		// 1. Create Franchise Territories
		console.log('📍 Creating franchise territories...\n');
		
		const territories = [
			{
				name: 'Dallas-Fort Worth',
				code: 'TX-DFW',
				description: '<p>Major metropolitan area in North Texas with strong golf culture and casino interest.</p>',
				state: 'Texas',
				city: 'Dallas',
				region: 'Southwest',
				population: 7637000,
				marketSize: 'Large',
				status: 'available',
				price: 10000000,
				notes: '<p>High-value market with multiple casino prospects.</p>'
			},
			{
				name: 'Los Angeles',
				code: 'CA-LA',
				description: '<p>Premier West Coast market with entertainment and casino connections.</p>',
				state: 'California',
				city: 'Los Angeles',
				region: 'West Coast',
				population: 13200000,
				marketSize: 'Large',
				status: 'available',
				price: 10000000,
				notes: '<p>Largest market with significant growth potential.</p>'
			},
			{
				name: 'Miami',
				code: 'FL-MIA',
				description: '<p>Southeast hub with strong tourism and hospitality industry.</p>',
				state: 'Florida',
				city: 'Miami',
				region: 'Southeast',
				population: 6200000,
				marketSize: 'Large',
				status: 'available',
				price: 10000000,
				notes: '<p>Growing market with casino expansion opportunities.</p>'
			},
			{
				name: 'Las Vegas',
				code: 'NV-LV',
				description: '<p>Entertainment capital with established casino partnerships.</p>',
				state: 'Nevada',
				city: 'Las Vegas',
				region: 'Southwest',
				population: 2200000,
				marketSize: 'Medium',
				status: 'reserved',
				price: 10000000,
				reservedUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
				notes: '<p>Reserved for MGM Grand Casino conversion.</p>'
			},
			{
				name: 'Phoenix',
				code: 'AZ-PHX',
				description: '<p>Fast-growing Southwest market with expanding golf scene.</p>',
				state: 'Arizona',
				city: 'Phoenix',
				region: 'Southwest',
				population: 4900000,
				marketSize: 'Large',
				status: 'available',
				price: 10000000
			}
		];

		const createdTerritories: any[] = [];
		for (const territory of territories) {
			const created = await pb.collection('franchise_territories').create(territory);
			console.log(`✅ Created territory: ${territory.name} (${territory.status})`);
			createdTerritories.push(created);
		}

		// 2. Create Franchise Leads
		console.log('\n👥 Creating franchise leads...\n');

		const leads = [
			{
				firstName: 'John',
				lastName: 'Smith',
				email: 'john.smith@example.com',
				phone: '555-0101',
				company: 'Smith Enterprises',
				location: 'Dallas, TX',
				territory: 'Dallas-Fort Worth',
				source: 'website',
				status: 'qualified',
				netWorth: 15000000,
				liquidCapital: 5000000,
				experienceLevel: 'some',
				isExistingSponsor: false,
				notes: '<p>Very interested in Dallas market. Has experience in hospitality industry.</p>',
				assignedTo: salesProfile?.id,
				qualifiedDate: new Date().toISOString()
			},
			{
				firstName: 'Sarah',
				lastName: 'Johnson',
				email: 'sarah.j@example.com',
				phone: '555-0102',
				company: 'Johnson Hospitality Group',
				location: 'Los Angeles, CA',
				territory: 'Los Angeles',
				source: 'referral',
				status: 'contacted',
				netWorth: 20000000,
				liquidCapital: 8000000,
				experienceLevel: 'extensive',
				isExistingSponsor: false,
				notes: '<p>Referred by existing franchise owner. Strong background in entertainment.</p>',
				assignedTo: salesProfile?.id
			},
			{
				firstName: 'Michael',
				lastName: 'Brown',
				email: 'mbrown@example.com',
				phone: '555-0103',
				location: 'Miami, FL',
				territory: 'Miami',
				source: 'event',
				status: 'new',
				netWorth: 12000000,
				liquidCapital: 4000000,
				experienceLevel: 'none',
				isExistingSponsor: false,
				notes: '<p>Met at golf expo. Interested in learning more about franchise opportunity.</p>',
				assignedTo: salesProfile?.id
			}
		];

		const createdLeads: any[] = [];
		for (const lead of leads) {
			const created = await pb.collection('franchise_leads').create(lead);
			console.log(`✅ Created lead: ${lead.firstName} ${lead.lastName} (${lead.status})`);
			createdLeads.push(created);
		}

		// 3. Create Franchise Opportunities
		console.log('\n🎯 Creating franchise opportunities...\n');

		const opportunities = [
			{
				leadId: createdLeads[0].id,
				opportunityName: `Dallas-Fort Worth Franchise - ${createdLeads[0].firstName} ${createdLeads[0].lastName}`,
				stage: 'proposal',
				dealValue: 10000000,
				probability: 75,
				expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
				territory: 'Dallas-Fort Worth',
				proposalSentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
				lastContactDate: new Date().toISOString(),
				nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				assignedTo: salesProfile?.id,
				notes: '<p>Strong interest. Proposal sent last week. Follow-up scheduled.</p>'
			},
			{
				leadId: createdLeads[1].id,
				opportunityName: `Los Angeles Franchise - ${createdLeads[1].firstName} ${createdLeads[1].lastName}`,
				stage: 'qualification',
				dealValue: 10000000,
				probability: 50,
				expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
				territory: 'Los Angeles',
				lastContactDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
				nextFollowUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
				assignedTo: salesProfile?.id,
				notes: '<p>Qualified lead. Conducting due diligence on LA market.</p>'
			}
		];

		const createdOpportunities: any[] = [];
		for (const opportunity of opportunities) {
			const created = await pb.collection('franchise_opportunities').create(opportunity);
			console.log(`✅ Created opportunity: ${opportunity.opportunityName} (${opportunity.stage})`);
			createdOpportunities.push(created);
		}

		// 4. Create Sponsors
		console.log('\n🎰 Creating casino sponsors...\n');

		const TIER_PRICING = {
			tier_1: { 2025: 7000000, 2026: 5000000, 2027: 3000000 },
			tier_2: { 2025: 5000000, 2026: 7000000, 2027: 9000000 },
			tier_3: { 2025: 1000000, 2026: 1000000, 2027: 2000000 },
			tier_4: { 2025: 1000000, 2026: 1500000, 2027: 2000000 }
		};

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
				notes: '<p>Premium casino partner. Expressed strong interest in franchise ownership for Las Vegas territory.</p>'
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
				notes: '<p>Elite tier sponsor. Growing investment over 3 years.</p>'
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
				notes: '<p>In final negotiations for Tier 1 sponsorship. Very interested in franchise conversion.</p>'
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
				notes: '<p>Standard tier sponsor. Consistent annual commitment.</p>'
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
				notes: '<p>Prospect for Tier 4 growth sponsorship. Initial discussions ongoing.</p>'
			}
		];

		const createdSponsors: any[] = [];
		for (const sponsor of sponsors) {
			const created = await pb.collection('sponsors').create(sponsor);
			console.log(`✅ Created sponsor: ${sponsor.companyName} (${sponsor.tier}, ${sponsor.status})`);
			createdSponsors.push(created);
		}

		// 5. Create Sponsor-Franchise Bridges
		console.log('\n🌉 Creating franchise conversion bridges...\n');

		const interestedSponsors = createdSponsors.filter((s: any) => s.franchiseInterest);
		
		for (const sponsor of interestedSponsors) {
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
				targetConversionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
				assignedSalesRep: salesProfile?.id,
				notes: `<p>Sponsor has expressed interest in franchise ownership. ${discount}% discount available based on sponsorship value.</p>`
			});

			console.log(`✅ Bridge created for ${sponsor.companyName}`);
			console.log(`   Sponsorship Value: $${sponsorshipValue.toLocaleString()}`);
			console.log(`   Franchise Fee Discount: $${franchiseFeeDiscount.toLocaleString()} (${discount}%)`);
			console.log(`   Net Franchise Fee: $${netFranchiseFee.toLocaleString()}\n`);
		}

		console.log('✅ All sample data created successfully!\n');
		console.log('📊 Summary:');
		console.log(`   Territories: ${createdTerritories.length}`);
		console.log(`   Leads: ${createdLeads.length}`);
		console.log(`   Opportunities: ${createdOpportunities.length}`);
		console.log(`   Sponsors: ${createdSponsors.length}`);
		console.log(`   Conversion Bridges: ${interestedSponsors.length}`);

	} catch (error: any) {
		console.error('❌ Error:', error);
		if (error.data) {
			console.error('Details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

createAllSampleData();
