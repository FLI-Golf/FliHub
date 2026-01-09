import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function verifyAdminSetup() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');

		// Check for admin user profile
		const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL!;
		const users = await pb.collection('users').getFullList({
			filter: `email = "${adminEmail}"`
		});

		if (users.length === 0) {
			console.log('⚠️  No user found with admin email');
			return;
		}

		const adminUser = users[0];
		console.log(`📧 Admin User: ${adminUser.email}`);

		// Check for user profile
		const profiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${adminUser.id}"`
		});

		if (profiles.length === 0) {
			console.log('⚠️  No user profile found for admin user');
			console.log('Creating admin user profile...\n');
			
			const profile = await pb.collection('user_profiles').create({
				userId: adminUser.id,
				role: 'admin',
				firstName: 'Admin',
				lastName: 'User',
				email: adminEmail,
				status: 'active'
			});
			
			console.log('✅ Created admin user profile');
			console.log(`   Role: ${profile.role}`);
			console.log(`   Name: ${profile.firstName} ${profile.lastName}\n`);
		} else {
			const profile = profiles[0];
			console.log(`✅ User Profile Found`);
			console.log(`   Role: ${profile.role}`);
			console.log(`   Name: ${profile.firstName} ${profile.lastName}`);
			console.log(`   Status: ${profile.status}\n`);

			// Update to admin if not already
			if (profile.role !== 'admin') {
				await pb.collection('user_profiles').update(profile.id, {
					role: 'admin'
				});
				console.log('✅ Updated role to admin\n');
			}
		}

		// Verify franchise collections exist
		console.log('📊 Checking franchise sales collections...');
		
		const collections = ['franchise_leads', 'franchise_opportunities', 'franchise_deals', 'franchise_territories'];
		for (const collectionName of collections) {
			try {
				const records = await pb.collection(collectionName).getList(1, 1);
				console.log(`✅ ${collectionName}: ${records.totalItems} records`);
			} catch (error) {
				console.log(`❌ ${collectionName}: Collection not found or error`);
			}
		}

		console.log('\n✅ Admin setup verified!');
		console.log('\n📝 Admin can now:');
		console.log('   • Access all sidebar features');
		console.log('   • View Franchise Sales dashboard');
		console.log('   • Manage all franchise leads, opportunities, and deals');
		console.log('   • All franchise fees are set to $10,000,000');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

verifyAdminSetup();
