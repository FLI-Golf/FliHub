import PocketBase from 'pocketbase';
import 'dotenv/config';

/**
 * Talent Management Restructure Migration
 * 
 * 1. Add talentType field to pros collection
 * 2. Backfill existing records with talentType: ['player']
 * 3. Rename pros collection to talent
 * 4. Create broadcaster_profiles collection
 * 5. Add broadcasterReference to user_profiles
 * 6. Rename proReference to talentReference
 */

const TALENT_TYPES = ['player', 'broadcaster', 'commentator', 'analyst'];

async function migrate() {
	const url = process.env.POCKETBASE_URL;
	const email = process.env.POCKETBASE_ADMIN_EMAIL;
	const password = process.env.POCKETBASE_ADMIN_PASSWORD;

	if (!url || !email || !password) {
		console.error('❌ Missing environment variables. Required: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD');
		process.exit(1);
	}

	console.log(`🔄 Connecting to PocketBase at ${url}...`);
	const pb = new PocketBase(url);

	try {
		await pb.admins.authWithPassword(email, password);
		console.log('✅ Authenticated successfully\n');

		// Step 1: Get the pros collection and add talentType field
		console.log('📋 Step 1: Adding talentType field to pros collection...');
		const prosCollection = await pb.collections.getOne('pros');
		
		const existingFields = prosCollection.fields || [];
		const hasTalentType = existingFields.some((f: any) => f.name === 'talentType');
		
		if (!hasTalentType) {
			const talentTypeField = {
				id: 'talentType_field',
				name: 'talentType',
				type: 'select',
				required: true,
				hidden: false,
				presentable: false,
				system: false,
				maxSelect: 4,
				values: TALENT_TYPES
			};

			const updatedFields = [...existingFields, talentTypeField];

			await pb.collections.update(prosCollection.id, {
				fields: updatedFields
			});
			console.log('✅ Added talentType field to pros collection\n');
		} else {
			console.log('⚠️ talentType field already exists, skipping...\n');
		}

		// Step 2: Backfill existing pros with talentType: ['player']
		console.log('📋 Step 2: Backfilling existing records with talentType...');
		const allPros = await pb.collection('pros').getFullList();
		let backfillCount = 0;
		
		for (const pro of allPros) {
			if (!pro.talentType || pro.talentType.length === 0) {
				await pb.collection('pros').update(pro.id, {
					talentType: ['player']
				});
				backfillCount++;
			}
		}
		console.log(`✅ Backfilled ${backfillCount} records with talentType: ['player']\n`);

		// Step 3: Rename pros collection to talent
		console.log('📋 Step 3: Renaming pros collection to talent...');
		await pb.collections.update(prosCollection.id, {
			name: 'talent'
		});
		console.log('✅ Renamed pros collection to talent\n');

		// Step 4: Create broadcaster_profiles collection
		console.log('📋 Step 4: Creating broadcaster_profiles collection...');
		
		const existingCollections = await pb.collections.getFullList();
		const broadcasterProfilesExists = existingCollections.some(c => c.name === 'broadcaster_profiles');
		
		if (!broadcasterProfilesExists) {
			await pb.collections.create({
				name: 'broadcaster_profiles',
				type: 'base',
				fields: [
					{
						id: 'bp_name',
						name: 'name',
						type: 'text',
						required: true,
						min: 1,
						max: 255
					},
					{
						id: 'bp_nickname',
						name: 'nickname',
						type: 'text',
						required: false,
						max: 100
					},
					{
						id: 'bp_bio',
						name: 'bio',
						type: 'editor',
						required: false
					},
					{
						id: 'bp_photo',
						name: 'photo',
						type: 'url',
						required: false
					},
					{
						id: 'bp_avatar',
						name: 'avatar',
						type: 'file',
						required: false,
						maxSelect: 1,
						maxSize: 500500,
						mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
						thumbs: ['300x300']
					},
					{
						id: 'bp_status',
						name: 'status',
						type: 'select',
						required: true,
						maxSelect: 1,
						values: ['active', 'inactive', 'retired']
					},
					{
						id: 'bp_gender',
						name: 'gender',
						type: 'select',
						required: false,
						maxSelect: 1,
						values: ['male', 'female', 'other']
					},
					{
						id: 'bp_country',
						name: 'country',
						type: 'text',
						required: false,
						max: 100
					},
					{
						id: 'bp_residence',
						name: 'residence',
						type: 'text',
						required: false,
						max: 255
					},
					{
						id: 'bp_email',
						name: 'email',
						type: 'email',
						required: false
					},
					{
						id: 'bp_phone',
						name: 'phone',
						type: 'text',
						required: false,
						max: 50
					},
					// Broadcaster-specific fields
					{
						id: 'bp_broadcastExperience',
						name: 'broadcastExperience',
						type: 'editor',
						required: false
					},
					{
						id: 'bp_broadcastReel',
						name: 'broadcastReel',
						type: 'url',
						required: false
					},
					{
						id: 'bp_preferredRole',
						name: 'preferredRole',
						type: 'select',
						required: false,
						maxSelect: 3,
						values: ['play-by-play', 'color-commentary', 'analyst', 'sideline', 'host']
					},
					{
						id: 'bp_yearsExperience',
						name: 'yearsExperience',
						type: 'number',
						required: false,
						min: 0,
						max: 50
					},
					{
						id: 'bp_notableWork',
						name: 'notableWork',
						type: 'editor',
						required: false
					},
					{
						id: 'bp_availability',
						name: 'availability',
						type: 'select',
						required: false,
						maxSelect: 1,
						values: ['full-time', 'part-time', 'freelance', 'unavailable']
					},
					// Social media
					{
						id: 'bp_website',
						name: 'website',
						type: 'url',
						required: false
					},
					{
						id: 'bp_twitter',
						name: 'twitter',
						type: 'text',
						required: false,
						max: 255
					},
					{
						id: 'bp_youtube',
						name: 'youtube',
						type: 'text',
						required: false,
						max: 255
					},
					{
						id: 'bp_tiktok',
						name: 'tiktok',
						type: 'text',
						required: false,
						max: 255
					},
					{
						id: 'bp_twitch',
						name: 'twitch',
						type: 'text',
						required: false,
						max: 255
					}
				],
				listRule: '@request.auth.id != ""',
				viewRule: '@request.auth.id != ""',
				createRule: '@request.auth.id != ""',
				updateRule: '@request.auth.id != ""',
				deleteRule: '@request.auth.id != ""'
			});
			console.log('✅ Created broadcaster_profiles collection\n');
		} else {
			console.log('⚠️ broadcaster_profiles collection already exists, skipping...\n');
		}

		// Step 5: Add broadcasterReference and talentReference to user_profiles
		console.log('📋 Step 5: Updating user_profiles with new reference fields...');
		const userProfilesCollection = await pb.collections.getOne('user_profiles');
		const userProfileFields = userProfilesCollection.fields || [];
		
		const hasBroadcasterRef = userProfileFields.some((f: any) => f.name === 'broadcasterReference');
		const hasTalentRef = userProfileFields.some((f: any) => f.name === 'talentReference');
		const hasProRef = userProfileFields.some((f: any) => f.name === 'proReference');
		
		// Get collection IDs
		const talentCollection = await pb.collections.getOne('talent');
		const broadcasterCollection = await pb.collections.getOne('broadcaster_profiles');
		
		let updatedUserProfileFields = [...userProfileFields];
		
		// Add broadcasterReference if missing
		if (!hasBroadcasterRef) {
			updatedUserProfileFields.push({
				id: 'up_broadcasterRef',
				name: 'broadcasterReference',
				type: 'relation',
				required: false,
				collectionId: broadcasterCollection.id,
				cascadeDelete: false,
				maxSelect: 1,
				minSelect: 0
			});
			console.log('  - Adding broadcasterReference field');
		}
		
		// Rename proReference to talentReference
		if (hasProRef && !hasTalentRef) {
			updatedUserProfileFields = updatedUserProfileFields.map((f: any) => {
				if (f.name === 'proReference') {
					return {
						...f,
						name: 'talentReference',
						collectionId: talentCollection.id
					};
				}
				return f;
			});
			console.log('  - Renaming proReference to talentReference');
		} else if (!hasTalentRef) {
			// Add talentReference if neither exists
			updatedUserProfileFields.push({
				id: 'up_talentRef',
				name: 'talentReference',
				type: 'relation',
				required: false,
				collectionId: talentCollection.id,
				cascadeDelete: false,
				maxSelect: 1,
				minSelect: 0
			});
			console.log('  - Adding talentReference field');
		}
		
		if (updatedUserProfileFields.length !== userProfileFields.length || 
		    JSON.stringify(updatedUserProfileFields) !== JSON.stringify(userProfileFields)) {
			await pb.collections.update(userProfilesCollection.id, {
				fields: updatedUserProfileFields
			});
			console.log('✅ Updated user_profiles collection\n');
		} else {
			console.log('⚠️ user_profiles already up to date\n');
		}

		console.log('🎉 Migration completed successfully!');
		console.log('\nSummary:');
		console.log('  ✅ Added talentType field to talent collection');
		console.log(`  ✅ Backfilled ${backfillCount} records with talentType: ['player']`);
		console.log('  ✅ Renamed pros collection to talent');
		console.log('  ✅ Created broadcaster_profiles collection');
		console.log('  ✅ Updated user_profiles with broadcasterReference and talentReference');

	} catch (error: any) {
		console.error('❌ Migration failed:', error.message);
		if (error.data) {
			console.error('Details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

migrate();
