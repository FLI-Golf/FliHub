import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function seedRevenueData() {
	console.log('🌱 Seeding revenue data...\n');

	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);
		console.log('✓ Authenticated as admin\n');

		// Check if collections exist
		try {
			await pb.collection('sponsors').getList(1, 1);
			console.log('✓ Sponsors collection exists');
		} catch (err) {
			console.log('⚠️  Sponsors collection does not exist - skipping sponsor seeding');
			return;
		}

		// Seed Sponsors
		console.log('\n📊 Seeding Sponsors...');
		const sponsors = [
			{
				companyName: 'MGM Grand Casino',
				type: 'casino',
				tier: 'tier_1',
				status: 'active',
				primaryContactName: 'John Smith',
				primaryContactEmail: 'john.smith@mgm.com',
				location: 'Las Vegas, NV',
				territory: 'Nevada',
				annualCommitment: 5000000,
				totalPaid: 3000000,
				currentYear: 2026
			},
			{
				companyName: 'Caesars Palace',
				type: 'casino',
				tier: 'tier_2',
				status: 'active',
				primaryContactName: 'Jane Doe',
				primaryContactEmail: 'jane.doe@caesars.com',
				location: 'Las Vegas, NV',
				territory: 'Nevada',
				annualCommitment: 7000000,
				totalPaid: 5000000,
				currentYear: 2026
			},
			{
				companyName: 'Wynn Resorts',
				type: 'resort',
				tier: 'tier_3',
				status: 'negotiating',
				primaryContactName: 'Bob Wilson',
				primaryContactEmail: 'bob.wilson@wynn.com',
				location: 'Las Vegas, NV',
				territory: 'Nevada',
				annualCommitment: 1000000,
				totalPaid: 0,
				currentYear: 2026
			},
			{
				companyName: 'Hard Rock Hotel',
				type: 'hospitality',
				tier: 'tier_4',
				status: 'prospect',
				primaryContactName: 'Alice Johnson',
				primaryContactEmail: 'alice.johnson@hardrock.com',
				location: 'Atlantic City, NJ',
				territory: 'New Jersey',
				annualCommitment: 1500000,
				totalPaid: 0,
				currentYear: 2026
			},
			{
				companyName: 'Bellagio',
				type: 'resort',
				tier: 'tier_1',
				status: 'renewed',
				primaryContactName: 'Charlie Brown',
				primaryContactEmail: 'charlie.brown@bellagio.com',
				location: 'Las Vegas, NV',
				territory: 'Nevada',
				annualCommitment: 5000000,
				totalPaid: 5000000,
				currentYear: 2026
			}
		];

		for (const sponsor of sponsors) {
			try {
				await pb.collection('sponsors').create(sponsor);
				console.log(`  ✓ Created sponsor: ${sponsor.companyName}`);
			} catch (err: any) {
				console.log(`  ✗ Failed to create sponsor ${sponsor.companyName}:`, err.message);
			}
		}

		// Seed Franchise Territories
		console.log('\n🗺️  Seeding Franchise Territories...');
		const territories = [
			{ name: 'California - Los Angeles', region: 'West Coast', status: 'sold' },
			{ name: 'California - San Francisco', region: 'West Coast', status: 'sold' },
			{ name: 'Texas - Dallas', region: 'South', status: 'reserved' },
			{ name: 'Texas - Houston', region: 'South', status: 'available' },
			{ name: 'New York - NYC', region: 'Northeast', status: 'sold' },
			{ name: 'Florida - Miami', region: 'Southeast', status: 'reserved' },
			{ name: 'Illinois - Chicago', region: 'Midwest', status: 'available' },
			{ name: 'Washington - Seattle', region: 'Northwest', status: 'available' },
			{ name: 'Arizona - Phoenix', region: 'Southwest', status: 'available' },
			{ name: 'Georgia - Atlanta', region: 'Southeast', status: 'available' }
		];

		const territoryIds: Record<string, string> = {};
		for (const territory of territories) {
			try {
				const record = await pb.collection('franchise_territories').create(territory);
				territoryIds[territory.name] = record.id;
				console.log(`  ✓ Created territory: ${territory.name}`);
			} catch (err: any) {
				console.log(`  ✗ Failed to create territory ${territory.name}:`, err.message);
			}
		}

		// Seed Franchise Leads
		console.log('\n👥 Seeding Franchise Leads...');
		const leads = [
			{ name: 'Michael Chen', email: 'michael.chen@email.com', phone: '555-0101', territory: 'California - Los Angeles', status: 'qualified' },
			{ name: 'Sarah Martinez', email: 'sarah.martinez@email.com', phone: '555-0102', territory: 'Texas - Dallas', status: 'contacted' },
			{ name: 'David Kim', email: 'david.kim@email.com', phone: '555-0103', territory: 'New York - NYC', status: 'qualified' },
			{ name: 'Emily Rodriguez', email: 'emily.rodriguez@email.com', phone: '555-0104', territory: 'Florida - Miami', status: 'new' },
			{ name: 'James Taylor', email: 'james.taylor@email.com', phone: '555-0105', territory: 'Illinois - Chicago', status: 'contacted' }
		];

		const leadIds: string[] = [];
		for (const lead of leads) {
			try {
				const record = await pb.collection('franchise_leads').create(lead);
				leadIds.push(record.id);
				console.log(`  ✓ Created lead: ${lead.name}`);
			} catch (err: any) {
				console.log(`  ✗ Failed to create lead ${lead.name}:`, err.message);
			}
		}

		// Seed Franchise Opportunities
		console.log('\n💼 Seeding Franchise Opportunities...');
		const opportunities = [
			{ leadId: leadIds[0], territory: 'California - Los Angeles', status: 'proposal_sent', estimatedValue: 10000000 },
			{ leadId: leadIds[1], territory: 'Texas - Dallas', status: 'negotiation', estimatedValue: 10000000 },
			{ leadId: leadIds[2], territory: 'New York - NYC', status: 'proposal_sent', estimatedValue: 10000000 }
		];

		const opportunityIds: string[] = [];
		for (const opportunity of opportunities) {
			try {
				const record = await pb.collection('franchise_opportunities').create(opportunity);
				opportunityIds.push(record.id);
				console.log(`  ✓ Created opportunity for territory: ${opportunity.territory}`);
			} catch (err: any) {
				console.log(`  ✗ Failed to create opportunity:`, err.message);
			}
		}

		// Seed Franchise Deals
		console.log('\n🤝 Seeding Franchise Deals...');
		const deals = [
			{
				opportunityId: opportunityIds[0],
				franchiseOwnerName: 'Michael Chen',
				territory: 'California - Los Angeles',
				dealValue: 10000000,
				paymentReceived: 10000000,
				status: 'active',
				contractSignedDate: new Date('2025-06-15')
			},
			{
				opportunityId: opportunityIds[1],
				franchiseOwnerName: 'Sarah Martinez',
				territory: 'Texas - Dallas',
				dealValue: 10000000,
				paymentReceived: 5000000,
				status: 'payment_pending',
				contractSignedDate: new Date('2025-09-01')
			},
			{
				opportunityId: opportunityIds[2],
				franchiseOwnerName: 'David Kim',
				territory: 'New York - NYC',
				dealValue: 10000000,
				paymentReceived: 0,
				status: 'signed',
				contractSignedDate: new Date('2025-11-20')
			}
		];

		for (const deal of deals) {
			try {
				await pb.collection('franchise_deals').create(deal);
				console.log(`  ✓ Created deal: ${deal.franchiseOwnerName} - ${deal.territory}`);
			} catch (err: any) {
				console.log(`  ✗ Failed to create deal:`, err.message);
			}
		}

		console.log('\n✅ Revenue data seeding completed!\n');
		console.log('Summary:');
		console.log(`  - ${sponsors.length} sponsors created`);
		console.log(`  - ${territories.length} territories created`);
		console.log(`  - ${leads.length} leads created`);
		console.log(`  - ${opportunities.length} opportunities created`);
		console.log(`  - ${deals.length} deals created`);

	} catch (error: any) {
		console.error('❌ Error seeding revenue data:', error.message);
		process.exit(1);
	}
}

seedRevenueData();
