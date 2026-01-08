import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create franchise owner users and profiles for each franchise
 * Email pattern: first@franchisename.com (e.g., first@hyzer-heroes.com)
 */

async function createFranchiseOwners() {
	let url = process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app';
	url = url.replace(/\/$/, '');
	
	const pb = new PocketBase(url);

	try {
		const email = process.env.POCKETBASE_ADMIN_EMAIL;
		const password = process.env.POCKETBASE_ADMIN_PASSWORD;
		
		if (!email || !password) {
			throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in .env file');
		}
		
		console.log(`🔐 Authenticating to ${url}...`);
		await pb.admins.authWithPassword(email, password);
		console.log('✅ Authenticated\n');

		// Get all franchises
		const franchises = await pb.collection('franchises').getFullList({
			sort: 'priority'
		});
		
		console.log(`📋 Found ${franchises.length} franchises\n`);

		let created = 0;
		let updated = 0;
		let skipped = 0;
		let errors = 0;

		for (const franchise of franchises) {
			try {
				// Generate email from franchise slug
				const ownerEmail = `first@${franchise.slug}.com`;
				const defaultPassword = 'FLIGolf2024!';
				
				console.log(`👤 Processing: ${franchise.name}`);
				console.log(`   Email: ${ownerEmail}`);

				// Check if user already exists
				let user;
				let userId;
				
				try {
					const existingUsers = await pb.collection('users').getFullList({
						filter: `email = "${ownerEmail}"`
					});
					
					if (existingUsers.length > 0) {
						user = existingUsers[0];
						userId = user.id;
						console.log(`   ℹ️  User already exists`);
					}
				} catch (e) {
					// User doesn't exist, will create
				}

				// Create user if doesn't exist
				if (!userId) {
					try {
						user = await pb.collection('users').create({
							email: ownerEmail,
							password: defaultPassword,
							passwordConfirm: defaultPassword,
							emailVisibility: true
						});
						userId = user.id;
						console.log(`   ✅ Created user account`);
						created++;
					} catch (userError: any) {
						console.error(`   ❌ Failed to create user:`, userError.message);
						errors++;
						continue;
					}
				}

				// Check if profile exists
				const existingProfiles = await pb.collection('user_profiles').getFullList({
					filter: `userId = "${userId}"`
				});

				let profileId;

				if (existingProfiles.length > 0) {
					// Update existing profile
					const profile = existingProfiles[0];
					profileId = profile.id;
					
					await pb.collection('user_profiles').update(profile.id, {
						role: 'franchise_owner',
						availableRoles: ['franchise_owner'],
						firstName: 'Franchise',
						lastName: 'Owner',
						email: ownerEmail,
						status: 'active'
					});
					
					console.log(`   ✅ Updated user profile`);
					updated++;
				} else {
					// Create new profile
					const profile = await pb.collection('user_profiles').create({
						userId: userId,
						firstName: 'Franchise',
						lastName: 'Owner',
						email: ownerEmail,
						role: 'franchise_owner',
						availableRoles: ['franchise_owner'],
						status: 'active'
					});
					
					profileId = profile.id;
					console.log(`   ✅ Created user profile`);
					created++;
				}

				// Update franchise with owner information
				await pb.collection('franchises').update(franchise.id, {
					franchiseeId: userId,
					franchiseeName: `${franchise.name} Owner`,
					franchiseeEmail: ownerEmail
				});

				console.log(`   ✅ Linked to franchise\n`);

			} catch (error: any) {
				console.error(`❌ Error processing ${franchise.name}:`, error.message);
				if (error.data) {
					console.error('   Details:', JSON.stringify(error.data, null, 2));
				}
				errors++;
			}
		}

		console.log('\n📊 Summary:');
		console.log(`   Created: ${created}`);
		console.log(`   Updated: ${updated}`);
		console.log(`   Skipped: ${skipped}`);
		console.log(`   Errors: ${errors}`);
		console.log('\n✅ Franchise owner creation completed!');
		
		// Display franchise owners
		console.log('\n👥 Franchise Owners:\n');
		const updatedFranchises = await pb.collection('franchises').getFullList({
			expand: 'franchiseeId',
			sort: 'priority'
		});

		updatedFranchises.forEach((f: any) => {
			console.log(`${f.name}`);
			console.log(`  Owner: ${f.franchiseeName || 'Not assigned'}`);
			console.log(`  Email: ${f.franchiseeEmail || 'Not set'}`);
			console.log(`  User ID: ${f.franchiseeId || 'Not linked'}`);
			console.log('');
		});

		console.log('\n🔑 Default Password: FLIGolf2024!');
		console.log('   (Owners should change this on first login)\n');
		
	} catch (error: any) {
		console.error('❌ Failed to create franchise owners:', error.message);
		throw error;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	createFranchiseOwners().catch(() => process.exit(1));
}

export { createFranchiseOwners };
