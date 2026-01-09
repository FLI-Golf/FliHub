import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function updateFranchiseOpportunities() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');

		// Get all collections to find the correct IDs
		const collections = await pb.collections.getFullList();
		
		const franchiseOpportunitiesCollection = collections.find((c: any) => c.name === 'franchise_opportunities');
		const franchiseLeadsCollection = collections.find((c: any) => c.name === 'franchise_leads');
		const userProfilesCollection = collections.find((c: any) => c.name === 'user_profiles');
		const projectsCollection = collections.find((c: any) => c.name === 'projects_collection');

		console.log('📋 Found Collections:');
		console.log(`   franchise_opportunities: ${franchiseOpportunitiesCollection?.id || 'NOT FOUND'}`);
		console.log(`   franchise_leads: ${franchiseLeadsCollection?.id || 'NOT FOUND'}`);
		console.log(`   user_profiles: ${userProfilesCollection?.id || 'NOT FOUND'}`);
		console.log(`   projects_collection: ${projectsCollection?.id || 'NOT FOUND'}\n`);

		if (!franchiseOpportunitiesCollection) {
			console.log('❌ franchise_opportunities collection not found.');
			process.exit(1);
		}

		console.log('📝 Updating franchise_opportunities collection with all fields...\n');

		const schema = [
			{
				name: 'leadId',
				type: 'relation',
				required: true,
				options: {
					collectionId: franchiseLeadsCollection?.id || '',
					cascadeDelete: false,
					maxSelect: 1
				}
			},
			{
				name: 'opportunityName',
				type: 'text',
				required: true,
				options: { min: 1, max: 255 }
			},
			{
				name: 'stage',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['discovery', 'qualification', 'proposal', 'negotiation', 'due_diligence', 'contract', 'closed_won', 'closed_lost']
				}
			},
			{
				name: 'dealValue',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'probability',
				type: 'number',
				required: false,
				options: { min: 0, max: 100 }
			},
			{
				name: 'expectedCloseDate',
				type: 'date',
				required: false
			},
			{
				name: 'territory',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'proposalSentDate',
				type: 'date',
				required: false
			},
			{
				name: 'lastContactDate',
				type: 'date',
				required: false
			},
			{
				name: 'nextFollowUpDate',
				type: 'date',
				required: false
			},
			{
				name: 'notes',
				type: 'editor',
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

		if (projectsCollection) {
			schema.push({
				name: 'projectId',
				type: 'relation',
				required: false,
				options: {
					collectionId: projectsCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		await pb.collections.update(franchiseOpportunitiesCollection.id, {
			schema: schema
		});

		console.log('✅ Updated franchise_opportunities collection successfully!\n');
		console.log('📊 Summary:');
		console.log(`   Total fields: ${schema.length}`);
		console.log('\n📋 Fields added:');
		console.log('   • leadId (relation to franchise_leads, required)');
		console.log('   • opportunityName (text, required)');
		console.log('   • stage (select: discovery, qualification, proposal, negotiation, due_diligence, contract, closed_won, closed_lost)');
		console.log('   • dealValue (number) - Default $10M');
		console.log('   • probability (number, 0-100%)');
		console.log('   • expectedCloseDate (date)');
		console.log('   • territory (text)');
		console.log('   • proposalSentDate (date)');
		console.log('   • lastContactDate (date)');
		console.log('   • nextFollowUpDate (date)');
		console.log('   • notes (editor)');
		if (userProfilesCollection) {
			console.log('   • assignedTo (relation to user_profiles)');
		}
		if (projectsCollection) {
			console.log('   • projectId (relation to projects_collection)');
		}
		console.log('\n✅ franchise_opportunities collection is ready!');

	} catch (error: any) {
		console.error('❌ Error updating collection:', error);
		if (error.data) {
			console.error('Error details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

updateFranchiseOpportunities();
