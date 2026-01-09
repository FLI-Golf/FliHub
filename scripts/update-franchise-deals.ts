import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function updateFranchiseDeals() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');

		// Get all collections to find the correct IDs
		const collections = await pb.collections.getFullList();
		
		const franchiseDealsCollection = collections.find((c: any) => c.name === 'franchise_deals');
		const franchiseOpportunitiesCollection = collections.find((c: any) => c.name === 'franchise_opportunities');
		const userProfilesCollection = collections.find((c: any) => c.name === 'user_profiles');

		console.log('📋 Found Collections:');
		console.log(`   franchise_deals: ${franchiseDealsCollection?.id || 'NOT FOUND'}`);
		console.log(`   franchise_opportunities: ${franchiseOpportunitiesCollection?.id || 'NOT FOUND'}`);
		console.log(`   user_profiles: ${userProfilesCollection?.id || 'NOT FOUND'}\n`);

		if (!franchiseDealsCollection) {
			console.log('❌ franchise_deals collection not found.');
			process.exit(1);
		}

		console.log('📝 Updating franchise_deals collection with all fields...\n');

		const schema = [
			{
				name: 'opportunityId',
				type: 'relation',
				required: true,
				options: {
					collectionId: franchiseOpportunitiesCollection?.id || '',
					cascadeDelete: false,
					maxSelect: 1
				}
			},
			{
				name: 'dealNumber',
				type: 'text',
				required: false,
				options: { max: 50 }
			},
			{
				name: 'franchiseOwnerName',
				type: 'text',
				required: true,
				options: { min: 1, max: 255 }
			},
			{
				name: 'territory',
				type: 'text',
				required: true,
				options: { min: 1, max: 255 }
			},
			{
				name: 'dealValue',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'paymentReceived',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'paymentDueDate',
				type: 'date',
				required: false
			},
			{
				name: 'contractSignedDate',
				type: 'date',
				required: false
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['pending_signature', 'signed', 'payment_pending', 'payment_received', 'onboarding', 'active', 'cancelled']
				}
			},
			{
				name: 'franchiseOwnerProfileId',
				type: 'relation',
				required: false,
				options: {
					collectionId: userProfilesCollection?.id || '',
					cascadeDelete: false,
					maxSelect: 1
				}
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			},
			{
				name: 'closedBy',
				type: 'relation',
				required: false,
				options: {
					collectionId: userProfilesCollection?.id || '',
					cascadeDelete: false,
					maxSelect: 1
				}
			},
			{
				name: 'commissionPaid',
				type: 'bool',
				required: false
			},
			{
				name: 'commissionAmount',
				type: 'number',
				required: false,
				options: { min: 0 }
			}
		];

		await pb.collections.update(franchiseDealsCollection.id, {
			schema: schema
		});

		console.log('✅ Updated franchise_deals collection successfully!\n');
		console.log('📊 Summary:');
		console.log(`   Total fields: ${schema.length}`);
		console.log('\n📋 Fields added:');
		console.log('   • opportunityId (relation to franchise_opportunities)');
		console.log('   • dealNumber (text)');
		console.log('   • franchiseOwnerName (text, required)');
		console.log('   • territory (text, required)');
		console.log('   • dealValue (number)');
		console.log('   • paymentReceived (number)');
		console.log('   • paymentDueDate (date)');
		console.log('   • contractSignedDate (date)');
		console.log('   • status (select: pending_signature, signed, payment_pending, payment_received, onboarding, active, cancelled)');
		console.log('   • franchiseOwnerProfileId (relation to user_profiles)');
		console.log('   • notes (editor)');
		console.log('   • closedBy (relation to user_profiles)');
		console.log('   • commissionPaid (bool)');
		console.log('   • commissionAmount (number)');
		console.log('\n✅ franchise_deals collection is ready!');

	} catch (error: any) {
		console.error('❌ Error updating collection:', error);
		if (error.data) {
			console.error('Error details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

updateFranchiseDeals();
