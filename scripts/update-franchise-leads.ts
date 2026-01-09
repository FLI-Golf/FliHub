import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function updateFranchiseLeads() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');

		// Get all collections to find the correct IDs
		const collections = await pb.collections.getFullList();
		
		const franchiseLeadsCollection = collections.find((c: any) => c.name === 'franchise_leads');
		const userProfilesCollection = collections.find((c: any) => c.name === 'user_profiles');
		const sponsorsCollection = collections.find((c: any) => c.name === 'sponsors');
		const bridgeCollection = collections.find((c: any) => c.name === 'sponsor_franchise_bridge');

		console.log('📋 Found Collections:');
		console.log(`   franchise_leads: ${franchiseLeadsCollection?.id || 'NOT FOUND'}`);
		console.log(`   user_profiles: ${userProfilesCollection?.id || 'NOT FOUND'}`);
		console.log(`   sponsors: ${sponsorsCollection?.id || 'NOT FOUND'}`);
		console.log(`   sponsor_franchise_bridge: ${bridgeCollection?.id || 'NOT FOUND'}\n`);

		if (!franchiseLeadsCollection) {
			console.log('❌ franchise_leads collection not found.');
			process.exit(1);
		}

		console.log('📝 Updating franchise_leads collection with all fields...\n');

		const schema = [
			{
				name: 'firstName',
				type: 'text',
				required: true,
				options: { min: 1, max: 255 }
			},
			{
				name: 'lastName',
				type: 'text',
				required: true,
				options: { min: 1, max: 255 }
			},
			{
				name: 'email',
				type: 'email',
				required: true
			},
			{
				name: 'phone',
				type: 'text',
				required: false,
				options: { max: 50 }
			},
			{
				name: 'company',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'location',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'territory',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'source',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['website', 'referral', 'event', 'cold_outreach', 'partner', 'social_media', 'other']
				}
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost']
				}
			},
			{
				name: 'netWorth',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'liquidCapital',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'experienceLevel',
				type: 'select',
				required: false,
				options: {
					maxSelect: 1,
					values: ['none', 'some', 'extensive']
				}
			},
			{
				name: 'isExistingSponsor',
				type: 'bool',
				required: false
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			},
			{
				name: 'qualifiedDate',
				type: 'date',
				required: false
			}
		];

		// Add relations only if collections exist
		if (userProfilesCollection) {
			schema.push({
				name: 'assignedTo',
				type: 'relation',
				required: false,
				options: {
					collectionId: userProfilesCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		if (sponsorsCollection) {
			schema.push({
				name: 'sponsorId',
				type: 'relation',
				required: false,
				options: {
					collectionId: sponsorsCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		if (bridgeCollection) {
			schema.push({
				name: 'sponsorBridgeId',
				type: 'relation',
				required: false,
				options: {
					collectionId: bridgeCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		await pb.collections.update(franchiseLeadsCollection.id, {
			schema: schema
		});

		console.log('✅ Updated franchise_leads collection successfully!\n');
		console.log('📊 Summary:');
		console.log(`   Total fields: ${schema.length}`);
		console.log('\n📋 Fields added:');
		console.log('   • firstName (text, required)');
		console.log('   • lastName (text, required)');
		console.log('   • email (email, required)');
		console.log('   • phone (text)');
		console.log('   • company (text)');
		console.log('   • location (text)');
		console.log('   • territory (text)');
		console.log('   • source (select: website, referral, event, cold_outreach, partner, social_media, other)');
		console.log('   • status (select: new, contacted, qualified, unqualified, converted, lost)');
		console.log('   • netWorth (number)');
		console.log('   • liquidCapital (number)');
		console.log('   • experienceLevel (select: none, some, extensive)');
		console.log('   • isExistingSponsor (bool)');
		console.log('   • notes (editor)');
		console.log('   • qualifiedDate (date)');
		if (userProfilesCollection) {
			console.log('   • assignedTo (relation to user_profiles)');
		}
		if (sponsorsCollection) {
			console.log('   • sponsorId (relation to sponsors)');
		}
		if (bridgeCollection) {
			console.log('   • sponsorBridgeId (relation to sponsor_franchise_bridge)');
		}
		console.log('\n✅ franchise_leads collection is ready!');

	} catch (error: any) {
		console.error('❌ Error updating collection:', error);
		if (error.data) {
			console.error('Error details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

updateFranchiseLeads();
