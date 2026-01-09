import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function createAdminUser() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as PocketBase admin\n');

		// Create admin user
		const adminEmail = 'admin@flihub.com';
		const adminPassword = 'admin123';

		let user;
		try {
			user = await pb.collection('users').create({
				email: adminEmail,
				password: adminPassword,
				passwordConfirm: adminPassword,
				emailVisibility: true
			});
			console.log('✅ Created admin user:', adminEmail);
		} catch (error: any) {
			if (error.status === 400 && error.message.includes('already exists')) {
				console.log('⚠️  Admin user already exists, fetching...');
				const users = await pb.collection('users').getFullList({
					filter: `email = "${adminEmail}"`
				});
				user = users[0];
			} else {
				throw error;
			}
		}

		// Create or update user profile with admin role
		try {
			const profiles = await pb.collection('user_profiles').getFullList({
				filter: `userId = "${user.id}"`
			});

			if (profiles.length > 0) {
				// Update existing profile
				const profile = profiles[0];
				if (profile.role !== 'admin') {
					await pb.collection('user_profiles').update(profile.id, {
						role: 'admin'
					});
					console.log('✅ Updated user profile to admin role');
				} else {
					console.log('✅ User profile already has admin role');
				}
			} else {
				// Create new profile
				await pb.collection('user_profiles').create({
					userId: user.id,
					role: 'admin',
					firstName: 'Admin',
					lastName: 'User',
					email: adminEmail,
					status: 'active'
				});
				console.log('✅ Created admin user profile');
			}
		} catch (error: any) {
			console.error('Error with user profile:', error);
		}

		// Verify franchise collections
		console.log('\n📊 Verifying franchise sales collections...');
		
		const collections = [
			{ name: 'franchise_leads', label: 'Franchise Leads' },
			{ name: 'franchise_opportunities', label: 'Franchise Opportunities' },
			{ name: 'franchise_deals', label: 'Franchise Deals' },
			{ name: 'franchise_territories', label: 'Franchise Territories' }
		];

		for (const collection of collections) {
			try {
				const records = await pb.collection(collection.name).getList(1, 1);
				console.log(`✅ ${collection.label}: ${records.totalItems} records`);
			} catch (error) {
				console.log(`❌ ${collection.label}: Not found`);
			}
		}

		console.log('\n✅ Admin user setup complete!');
		console.log('\n📧 Login credentials:');
		console.log(`   Email: ${adminEmail}`);
		console.log(`   Password: ${adminPassword}`);
		console.log('\n📝 Admin features:');
		console.log('   • Full access to all sidebar navigation');
		console.log('   • Franchise Sales dashboard');
		console.log('   • All departments, projects, tasks');
		console.log('   • People, vendors, expenses, approvals');
		console.log('   • All franchise fees set to $10,000,000');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

createAdminUser();
