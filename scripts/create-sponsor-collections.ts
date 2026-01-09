import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function createSponsorCollections() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin');

		// Create sponsors collection
		try {
			await pb.collections.create({
				name: 'sponsors',
				type: 'base',
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
						required: false
					},
					{
						name: 'primaryContactEmail',
						type: 'email',
						required: false
					},
					{
						name: 'primaryContactPhone',
						type: 'text',
						required: false
					},
					{
						name: 'location',
						type: 'text',
						required: false
					},
					{
						name: 'territory',
						type: 'text',
						required: false
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
						required: false
					},
					{
						name: 'annualCommitment',
						type: 'number',
						required: false
					},
					{
						name: 'totalPaid',
						type: 'number',
						required: false
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
						type: 'text',
						required: false
					}
				],
				listRule: '@request.auth.id != ""',
				viewRule: '@request.auth.id != ""',
				createRule: '@request.auth.id != ""',
				updateRule: '@request.auth.id != ""',
				deleteRule: '@request.auth.id != ""'
			});
			console.log('✅ Created sponsors collection');
		} catch (error: any) {
			if (error.status === 400 && error.message.includes('already exists')) {
				console.log('⚠️  sponsors collection already exists');
			} else {
				throw error;
			}
		}

		// Create sponsor_franchise_bridge collection
		try {
			await pb.collections.create({
				name: 'sponsor_franchise_bridge',
				type: 'base',
				schema: [
					{
						name: 'sponsorId',
						type: 'relation',
						required: true,
						options: {
							collectionId: 'sponsors',
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
						required: false
					},
					{
						name: 'franchiseFeeDiscount',
						type: 'number',
						required: false
					},
					{
						name: 'netFranchiseFee',
						type: 'number',
						required: false
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
						required: false
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
						type: 'text',
						required: false
					}
				],
				listRule: '@request.auth.id != ""',
				viewRule: '@request.auth.id != ""',
				createRule: '@request.auth.id != ""',
				updateRule: '@request.auth.id != ""',
				deleteRule: '@request.auth.id != ""'
			});
			console.log('✅ Created sponsor_franchise_bridge collection');
		} catch (error: any) {
			if (error.status === 400 && error.message.includes('already exists')) {
				console.log('⚠️  sponsor_franchise_bridge collection already exists');
			} else {
				throw error;
			}
		}

		console.log('\n✅ All sponsor collections created successfully!');
	} catch (error) {
		console.error('❌ Error creating collections:', error);
		process.exit(1);
	}
}

createSponsorCollections();
