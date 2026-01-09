import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function updateSponsorCollections() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');

		// Get existing collections
		const collections = await pb.collections.getFullList();
		const sponsorsCollection = collections.find((c: any) => c.name === 'sponsors');
		const bridgeCollection = collections.find((c: any) => c.name === 'sponsor_franchise_bridge');

		if (!sponsorsCollection || !bridgeCollection) {
			console.log('❌ Collections not found. Run create-sponsor-collections.ts first.');
			process.exit(1);
		}

		console.log('📝 Updating sponsors collection...\n');

		// Update sponsors collection with all fields
		await pb.collections.update(sponsorsCollection.id, {
			schema: [
				{
					name: 'companyName',
					type: 'text',
					required: true,
					options: { min: 1, max: 255 }
				},
				{
					name: 'type',
					type: 'select',
					required: true,
					options: {
						maxSelect: 1,
						values: ['casino', 'resort', 'hospitality', 'entertainment', 'corporate', 'other']
					}
				},
				{
					name: 'tier',
					type: 'select',
					required: true,
					options: {
						maxSelect: 1,
						values: ['tier_1', 'tier_2', 'tier_3', 'tier_4']
					}
				},
				{
					name: 'status',
					type: 'select',
					required: true,
					options: {
						maxSelect: 1,
						values: ['prospect', 'negotiating', 'active', 'renewed', 'expired', 'converted_to_franchise', 'inactive']
					}
				},
				{
					name: 'primaryContactName',
					type: 'text',
					required: false,
					options: { max: 255 }
				},
				{
					name: 'primaryContactEmail',
					type: 'email',
					required: false
				},
				{
					name: 'primaryContactPhone',
					type: 'text',
					required: false,
					options: { max: 50 }
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
					name: 'contractStartDate',
					type: 'date',
					required: false
				},
				{
					name: 'contractEndDate',
					type: 'date',
					required: false
				},
				{
					name: 'currentYear',
					type: 'number',
					required: false,
					options: { min: 2025, max: 2027 }
				},
				{
					name: 'annualCommitment',
					type: 'number',
					required: false,
					options: { min: 0 }
				},
				{
					name: 'totalPaid',
					type: 'number',
					required: false,
					options: { min: 0 }
				},
				{
					name: 'franchiseInterest',
					type: 'bool',
					required: false
				},
				{
					name: 'franchiseConversionDate',
					type: 'date',
					required: false
				},
				{
					name: 'franchiseDealId',
					type: 'relation',
					required: false,
					options: {
						collectionId: 'franchise_deals',
						cascadeDelete: false,
						maxSelect: 1
					}
				},
				{
					name: 'assignedTo',
					type: 'relation',
					required: false,
					options: {
						collectionId: 'user_profiles',
						cascadeDelete: false,
						maxSelect: 1
					}
				},
				{
					name: 'notes',
					type: 'editor',
					required: false
				}
			]
		});

		console.log('✅ Updated sponsors collection with all fields\n');

		console.log('📝 Updating sponsor_franchise_bridge collection...\n');

		// Update sponsor_franchise_bridge collection with all fields
		await pb.collections.update(bridgeCollection.id, {
			schema: [
				{
					name: 'sponsorId',
					type: 'relation',
					required: true,
					options: {
						collectionId: sponsorsCollection.id,
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
					name: 'franchiseLeadId',
					type: 'relation',
					required: false,
					options: {
						collectionId: 'franchise_leads',
						cascadeDelete: false,
						maxSelect: 1
					}
				},
				{
					name: 'franchiseOpportunityId',
					type: 'relation',
					required: false,
					options: {
						collectionId: 'franchise_opportunities',
						cascadeDelete: false,
						maxSelect: 1
					}
				},
				{
					name: 'franchiseDealId',
					type: 'relation',
					required: false,
					options: {
						collectionId: 'franchise_deals',
						cascadeDelete: false,
						maxSelect: 1
					}
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
					name: 'assignedSalesRep',
					type: 'relation',
					required: false,
					options: {
						collectionId: 'user_profiles',
						cascadeDelete: false,
						maxSelect: 1
					}
				},
				{
					name: 'notes',
					type: 'editor',
					required: false
				}
			]
		});

		console.log('✅ Updated sponsor_franchise_bridge collection with all fields\n');

		// Also update franchise_leads to add sponsor fields
		const leadsCollection = collections.find((c: any) => c.name === 'franchise_leads');
		if (leadsCollection) {
			console.log('📝 Updating franchise_leads collection with sponsor fields...\n');
			
			// Get existing schema
			const existingSchema = leadsCollection.schema || [];
			
			// Add new sponsor fields if they don't exist
			const sponsorFields = [
				{
					name: 'isExistingSponsor',
					type: 'bool',
					required: false
				},
				{
					name: 'sponsorId',
					type: 'relation',
					required: false,
					options: {
						collectionId: sponsorsCollection.id,
						cascadeDelete: false,
						maxSelect: 1
					}
				},
				{
					name: 'sponsorBridgeId',
					type: 'relation',
					required: false,
					options: {
						collectionId: bridgeCollection.id,
						cascadeDelete: false,
						maxSelect: 1
					}
				}
			];

			// Check if fields already exist
			const fieldsToAdd = sponsorFields.filter(newField => 
				!existingSchema.some((existingField: any) => existingField.name === newField.name)
			);

			if (fieldsToAdd.length > 0) {
				await pb.collections.update(leadsCollection.id, {
					schema: [...existingSchema, ...fieldsToAdd]
				});
				console.log(`✅ Added ${fieldsToAdd.length} sponsor fields to franchise_leads\n`);
			} else {
				console.log('✅ Sponsor fields already exist in franchise_leads\n');
			}
		}

		console.log('✅ All collections updated successfully!\n');
		console.log('📊 Summary:');
		console.log('   • sponsors: 20 fields');
		console.log('   • sponsor_franchise_bridge: 15 fields');
		console.log('   • franchise_leads: +3 sponsor fields');
		console.log('\n💡 Run create-sample-sponsors.ts to populate with data');

	} catch (error: any) {
		console.error('❌ Error updating collections:', error);
		if (error.data) {
			console.error('Error details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

updateSponsorCollections();
