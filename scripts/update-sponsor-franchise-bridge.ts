import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function updateSponsorFranchiseBridge() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');

		// Get all collections to find the correct IDs
		const collections = await pb.collections.getFullList();
		
		const bridgeCollection = collections.find((c: any) => c.name === 'sponsor_franchise_bridge');
		const sponsorsCollection = collections.find((c: any) => c.name === 'sponsors');
		const franchiseLeadsCollection = collections.find((c: any) => c.name === 'franchise_leads');
		const franchiseOpportunitiesCollection = collections.find((c: any) => c.name === 'franchise_opportunities');
		const franchiseDealsCollection = collections.find((c: any) => c.name === 'franchise_deals');
		const userProfilesCollection = collections.find((c: any) => c.name === 'user_profiles');

		console.log('📋 Found Collections:');
		console.log(`   sponsor_franchise_bridge: ${bridgeCollection?.id || 'NOT FOUND'}`);
		console.log(`   sponsors: ${sponsorsCollection?.id || 'NOT FOUND'}`);
		console.log(`   franchise_leads: ${franchiseLeadsCollection?.id || 'NOT FOUND'}`);
		console.log(`   franchise_opportunities: ${franchiseOpportunitiesCollection?.id || 'NOT FOUND'}`);
		console.log(`   franchise_deals: ${franchiseDealsCollection?.id || 'NOT FOUND'}`);
		console.log(`   user_profiles: ${userProfilesCollection?.id || 'NOT FOUND'}\n`);

		if (!bridgeCollection) {
			console.log('❌ sponsor_franchise_bridge collection not found.');
			process.exit(1);
		}

		console.log('📝 Updating sponsor_franchise_bridge collection with all fields...\n');

		const schema = [
			{
				name: 'sponsorId',
				type: 'relation',
				required: true,
				options: {
					collectionId: sponsorsCollection?.id || '',
					cascadeDelete: false,
					maxSelect: 1
				}
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['sponsor_active', 'interest_expressed', 'evaluation', 'negotiation', 'franchise_deal_pending', 'converted', 'declined']
				}
			},
			{
				name: 'interestExpressedDate',
				type: 'date',
				required: false
			},
			{
				name: 'evaluationStartDate',
				type: 'date',
				required: false
			},
			{
				name: 'sponsorshipValueToDate',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'franchiseFeeDiscount',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'netFranchiseFee',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'proposedTerritory',
				type: 'text',
				required: false,
				options: { max: 255 }
			},
			{
				name: 'targetConversionDate',
				type: 'date',
				required: false
			},
			{
				name: 'actualConversionDate',
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
		if (franchiseLeadsCollection) {
			schema.push({
				name: 'franchiseLeadId',
				type: 'relation',
				required: false,
				options: {
					collectionId: franchiseLeadsCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		if (franchiseOpportunitiesCollection) {
			schema.push({
				name: 'franchiseOpportunityId',
				type: 'relation',
				required: false,
				options: {
					collectionId: franchiseOpportunitiesCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		if (franchiseDealsCollection) {
			schema.push({
				name: 'franchiseDealId',
				type: 'relation',
				required: false,
				options: {
					collectionId: franchiseDealsCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		if (userProfilesCollection) {
			schema.push({
				name: 'assignedSalesRep',
				type: 'relation',
				required: false,
				options: {
					collectionId: userProfilesCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		await pb.collections.update(bridgeCollection.id, {
			schema: schema
		});

		console.log('✅ Updated sponsor_franchise_bridge collection successfully!\n');
		console.log('📊 Summary:');
		console.log(`   Total fields: ${schema.length}`);
		console.log('\n📋 Fields added:');
		console.log('   • sponsorId (relation to sponsors, required)');
		console.log('   • status (select: sponsor_active, interest_expressed, evaluation, negotiation, franchise_deal_pending, converted, declined)');
		console.log('   • interestExpressedDate (date)');
		console.log('   • evaluationStartDate (date)');
		console.log('   • sponsorshipValueToDate (number)');
		console.log('   • franchiseFeeDiscount (number)');
		console.log('   • netFranchiseFee (number)');
		console.log('   • proposedTerritory (text)');
		console.log('   • targetConversionDate (date)');
		console.log('   • actualConversionDate (date)');
		console.log('   • notes (editor)');
		if (franchiseLeadsCollection) {
			console.log('   • franchiseLeadId (relation to franchise_leads)');
		}
		if (franchiseOpportunitiesCollection) {
			console.log('   • franchiseOpportunityId (relation to franchise_opportunities)');
		}
		if (franchiseDealsCollection) {
			console.log('   • franchiseDealId (relation to franchise_deals)');
		}
		if (userProfilesCollection) {
			console.log('   • assignedSalesRep (relation to user_profiles)');
		}
		console.log('\n✅ sponsor_franchise_bridge collection is ready!');
		console.log('\n💡 Discount Formula:');
		console.log('   10% discount per $1M sponsorship value');
		console.log('   Maximum 30% discount on $10M franchise fee');
		console.log('   Example: $3M sponsor = $3M discount = $7M net franchise fee');

	} catch (error: any) {
		console.error('❌ Error updating collection:', error);
		if (error.data) {
			console.error('Error details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

updateSponsorFranchiseBridge();
