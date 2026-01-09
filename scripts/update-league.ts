import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function updateLeague() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');

		// Get all collections to find the correct IDs
		const collections = await pb.collections.getFullList();
		
		const leagueCollection = collections.find((c: any) => c.name === 'league');
		const userProfilesCollection = collections.find((c: any) => c.name === 'user_profiles');

		console.log('📋 Found Collections:');
		console.log(`   league: ${leagueCollection?.id || 'NOT FOUND'}`);
		console.log(`   user_profiles: ${userProfilesCollection?.id || 'NOT FOUND'}\n`);

		if (!leagueCollection) {
			console.log('❌ league collection not found.');
			process.exit(1);
		}

		console.log('📝 Updating league collection with all fields...\n');

		const schema = [
			{
				name: 'name',
				type: 'text',
				required: true,
				options: { min: 1, max: 255 }
			},
			{
				name: 'slug',
				type: 'text',
				required: true,
				options: { min: 1, max: 100 }
			},
			{
				name: 'description',
				type: 'editor',
				required: false
			},
			{
				name: 'logo',
				type: 'file',
				required: false,
				options: {
					maxSelect: 1,
					maxSize: 5242880,
					mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp']
				}
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['active', 'inactive', 'upcoming', 'completed']
				}
			},
			{
				name: 'season',
				type: 'text',
				required: false,
				options: { max: 50 }
			},
			{
				name: 'startDate',
				type: 'date',
				required: false
			},
			{
				name: 'endDate',
				type: 'date',
				required: false
			},
			{
				name: 'website',
				type: 'url',
				required: false
			},
			{
				name: 'location',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'headquarters',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'founded',
				type: 'number',
				required: false,
				options: { min: 1900, max: 2100 }
			},
			{
				name: 'totalTeams',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'totalPlayers',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'prizePool',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'format',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'rules',
				type: 'editor',
				required: false
			},
			{
				name: 'contactEmail',
				type: 'email',
				required: false
			},
			{
				name: 'contactPhone',
				type: 'text',
				required: false,
				options: { max: 50 }
			},
			{
				name: 'socialMedia',
				type: 'json',
				required: false
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			}
		];

		// Add relation only if user_profiles collection exists
		if (userProfilesCollection) {
			schema.push({
				name: 'leagueOwner',
				type: 'relation',
				required: false,
				options: {
					collectionId: userProfilesCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		await pb.collections.update(leagueCollection.id, {
			schema: schema
		});

		console.log('✅ Updated league collection successfully!\n');
		console.log('📊 Summary:');
		console.log(`   Total fields: ${schema.length}`);
		console.log('\n📋 Fields added:');
		console.log('   • name (text, required)');
		console.log('   • slug (text, required) - URL-friendly identifier');
		console.log('   • description (editor)');
		console.log('   • logo (file) - Image upload');
		console.log('   • status (select: active, inactive, upcoming, completed)');
		console.log('   • season (text)');
		console.log('   • startDate (date)');
		console.log('   • endDate (date)');
		console.log('   • website (url)');
		console.log('   • location (text)');
		console.log('   • headquarters (text)');
		console.log('   • founded (number) - Year founded');
		console.log('   • totalTeams (number)');
		console.log('   • totalPlayers (number)');
		console.log('   • prizePool (number)');
		console.log('   • format (text) - League format/structure');
		console.log('   • rules (editor)');
		console.log('   • contactEmail (email)');
		console.log('   • contactPhone (text)');
		console.log('   • socialMedia (json) - Social media links');
		console.log('   • notes (editor)');
		if (userProfilesCollection) {
			console.log('   • leagueOwner (relation to user_profiles)');
		}
		console.log('\n✅ league collection is ready!');

	} catch (error: any) {
		console.error('❌ Error updating collection:', error);
		if (error.data) {
			console.error('Error details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

updateLeague();
