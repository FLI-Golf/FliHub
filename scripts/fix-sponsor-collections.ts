import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function fixSponsorCollections() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');

		// Get all collections to find the correct IDs
		const collections = await pb.collections.getFullList();
		
		const sponsorsCollection = collections.find((c: any) => c.name === 'sponsors');
		const bridgeCollection = collections.find((c: any) => c.name === 'sponsor_franchise_bridge');
		const userProfilesCollection = collections.find((c: any) => c.name === 'user_profiles');
		const franchiseDealsCollection = collections.find((c: any) => c.name === 'franchise_deals');
		const franchiseLeadsCollection = collections.find((c: any) => c.name === 'franchise_leads');
		const franchiseOpportunitiesCollection = collections.find((c: any) => c.name === 'franchise_opportunities');

		console.log('📋 Found Collections:');
		console.log(`   sponsors: ${sponsorsCollection?.id || 'NOT FOUND'}`);
		console.log(`   sponsor_franchise_bridge: ${bridgeCollection?.id || 'NOT FOUND'}`);
		console.log(`   user_profiles: ${userProfilesCollection?.id || 'NOT FOUND'}`);
		console.log(`   franchise_deals: ${franchiseDealsCollection?.id || 'NOT FOUND'}`);
		console.log(`   franchise_leads: ${franchiseLeadsCollection?.id || 'NOT FOUND'}`);
		console.log(`   franchise_opportunities: ${franchiseOpportunitiesCollection?.id || 'NOT FOUND'}\n`);

		if (!sponsorsCollection || !bridgeCollection) {
			console.log('❌ Sponsor collections not found. Run create-sponsor-collections.ts first.');
			process.exit(1);
		}

		// Update sponsors collection with correct relation IDs
		console.log('📝 Updating sponsors collection...\n');

		const sponsorSchema = [
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
				name: 'notes',
				type: 'editor',
				required: false
			}
		];

		// Add franchise_deals relation only if collection exists
		if (franchiseDealsCollection) {
			sponsorSchema.push({
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

		// Add user_profiles relation only if collection exists
		if (userProfilesCollection) {
			sponsorSchema.push({
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

		await pb.collections.update(sponsorsCollection.id, {
			schema: sponsorSchema
		});

		console.log('✅ Updated sponsors collection\n');

		// Update sponsor_franchise_bridge collection
		console.log('📝 Updating sponsor_franchise_bridge collection...\n');

		const bridgeSchema = [
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

		// Add optional relations only if collections exist
		if (franchiseLeadsCollection) {
			bridgeSchema.push({
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
			bridgeSchema.push({
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
			bridgeSchema.push({
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
			bridgeSchema.push({
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
			schema: bridgeSchema
		});

		console.log('✅ Updated sponsor_franchise_bridge collection\n');

		// Update franchise_leads if it exists
		if (franchiseLeadsCollection) {
			console.log('📝 Updating franchise_leads collection...\n');
			
			const existingSchema = franchiseLeadsCollection.schema || [];
			
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

			const fieldsToAdd = sponsorFields.filter(newField => 
				!existingSchema.some((existingField: any) => existingField.name === newField.name)
			);

			if (fieldsToAdd.length > 0) {
				await pb.collections.update(franchiseLeadsCollection.id, {
					schema: [...existingSchema, ...fieldsToAdd]
				});
				console.log(`✅ Added ${fieldsToAdd.length} sponsor fields to franchise_leads\n`);
			} else {
				console.log('✅ Sponsor fields already exist in franchise_leads\n');
			}
		}

		console.log('✅ All collections fixed successfully!\n');
		console.log('📊 Summary:');
		console.log(`   • sponsors: ${sponsorSchema.length} fields`);
		console.log(`   • sponsor_franchise_bridge: ${bridgeSchema.length} fields`);
		if (franchiseLeadsCollection) {
			console.log('   • franchise_leads: sponsor fields added');
		}
		console.log('\n💡 Now run: npx tsx scripts/create-sample-sponsors.ts');

	} catch (error: any) {
		console.error('❌ Error:', error);
		if (error.data) {
			console.error('Error details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

fixSponsorCollections();
