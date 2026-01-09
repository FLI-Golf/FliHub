import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function createTestSalesUser() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin');

		// Create test sales user
		const testEmail = 'sales@flihub.com';
		const testPassword = 'sales123';

		let user;
		try {
			user = await pb.collection('users').create({
				email: testEmail,
				password: testPassword,
				passwordConfirm: testPassword,
				emailVisibility: true
			});
			console.log('✅ Created test user:', testEmail);
		} catch (error: any) {
			if (error.status === 400 && error.message.includes('already exists')) {
				console.log('⚠️  User already exists, fetching...');
				const users = await pb.collection('users').getFullList({
					filter: `email = "${testEmail}"`
				});
				user = users[0];
			} else {
				throw error;
			}
		}

		// Create user profile with sales role
		try {
			const profile = await pb.collection('user_profiles').create({
				userId: user.id,
				role: 'sales',
				firstName: 'Sales',
				lastName: 'Representative',
				email: testEmail,
				status: 'active'
			});
			console.log('✅ Created sales user profile');
		} catch (error: any) {
			if (error.status === 400 && error.message.includes('already exists')) {
				console.log('⚠️  User profile already exists');
			} else {
				throw error;
			}
		}

		// Create sample territories
		const territories = [
			{
				name: 'Dallas-Fort Worth',
				code: 'TX-DFW',
				state: 'Texas',
				city: 'Dallas',
				region: 'Southwest',
				population: 7637000,
				marketSize: 'Large',
				status: 'available',
				price: 10000000
			},
			{
				name: 'Los Angeles',
				code: 'CA-LA',
				state: 'California',
				city: 'Los Angeles',
				region: 'West Coast',
				population: 13200000,
				marketSize: 'Large',
				status: 'available',
				price: 10000000
			},
			{
				name: 'Miami',
				code: 'FL-MIA',
				state: 'Florida',
				city: 'Miami',
				region: 'Southeast',
				population: 6200000,
				marketSize: 'Large',
				status: 'available',
				price: 10000000
			}
		];

		for (const territory of territories) {
			try {
				await pb.collection('franchise_territories').create(territory);
				console.log(`✅ Created territory: ${territory.name}`);
			} catch (error: any) {
				if (error.status === 400) {
					console.log(`⚠️  Territory ${territory.name} may already exist`);
				} else {
					throw error;
				}
			}
		}

		// Get the sales user profile
		const profiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${user.id}"`
		});
		const salesProfile = profiles[0];

		// Create sample leads
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
				notes: 'Very interested in Dallas market',
				assignedTo: salesProfile.id,
				qualifiedDate: new Date().toISOString()
			},
			{
				firstName: 'Sarah',
				lastName: 'Johnson',
				email: 'sarah.j@example.com',
				phone: '555-0102',
				location: 'Los Angeles, CA',
				territory: 'Los Angeles',
				source: 'referral',
				status: 'contacted',
				netWorth: 20000000,
				liquidCapital: 8000000,
				experienceLevel: 'extensive',
				notes: 'Referred by existing franchise owner',
				assignedTo: salesProfile.id
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
				notes: 'Met at golf expo',
				assignedTo: salesProfile.id
			}
		];

		for (const lead of leads) {
			try {
				const createdLead = await pb.collection('franchise_leads').create(lead);
				console.log(`✅ Created lead: ${lead.firstName} ${lead.lastName}`);

				// Create opportunity for qualified lead
				if (lead.status === 'qualified') {
					await pb.collection('franchise_opportunities').create({
						leadId: createdLead.id,
						opportunityName: `${lead.territory} Franchise - ${lead.firstName} ${lead.lastName}`,
						stage: 'proposal',
						dealValue: 10000000,
						probability: 75,
						expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
						territory: lead.territory,
						assignedTo: salesProfile.id,
						lastContactDate: new Date().toISOString(),
						nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
					});
					console.log(`✅ Created opportunity for ${lead.firstName} ${lead.lastName}`);
				}
			} catch (error: any) {
				if (error.status === 400) {
					console.log(`⚠️  Lead ${lead.firstName} ${lead.lastName} may already exist`);
				} else {
					throw error;
				}
			}
		}

		console.log('\n✅ Test sales user and sample data created successfully!');
		console.log('\n📧 Login credentials:');
		console.log(`   Email: ${testEmail}`);
		console.log(`   Password: ${testPassword}`);
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

createTestSalesUser();
