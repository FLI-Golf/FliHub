import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function createFranchiseSalesCollections() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin');

		// Create franchise_leads collection
		try {
			await pb.collections.create({
				name: 'franchise_leads',
				type: 'base',
				schema: [
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
						required: false
					},
					{
						name: 'company',
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
						required: false
					},
					{
						name: 'liquidCapital',
						type: 'number',
						required: false
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
						name: 'notes',
						type: 'text',
						required: false
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
						name: 'qualifiedDate',
						type: 'date',
						required: false
					}
				],
				listRule: '@request.auth.id != ""',
				viewRule: '@request.auth.id != ""',
				createRule: '@request.auth.id != ""',
				updateRule: '@request.auth.id != ""',
				deleteRule: '@request.auth.id != ""'
			});
			console.log('✅ Created franchise_leads collection');
		} catch (error: any) {
			if (error.status === 400 && error.message.includes('already exists')) {
				console.log('⚠️  franchise_leads collection already exists');
			} else {
				throw error;
			}
		}

		// Create franchise_opportunities collection
		try {
			await pb.collections.create({
				name: 'franchise_opportunities',
				type: 'base',
				schema: [
					{
						name: 'leadId',
						type: 'relation',
						required: true,
						options: {
							collectionId: 'franchise_leads',
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
						required: false
					},
					{
						name: 'probability',
						type: 'number',
						required: false
					},
					{
						name: 'expectedCloseDate',
						type: 'date',
						required: false
					},
					{
						name: 'territory',
						type: 'text',
						required: false
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
						type: 'text',
						required: false
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
						name: 'projectId',
						type: 'relation',
						required: false,
						options: {
							collectionId: 'projects_collection',
							cascadeDelete: false,
							maxSelect: 1
						}
					}
				],
				listRule: '@request.auth.id != ""',
				viewRule: '@request.auth.id != ""',
				createRule: '@request.auth.id != ""',
				updateRule: '@request.auth.id != ""',
				deleteRule: '@request.auth.id != ""'
			});
			console.log('✅ Created franchise_opportunities collection');
		} catch (error: any) {
			if (error.status === 400 && error.message.includes('already exists')) {
				console.log('⚠️  franchise_opportunities collection already exists');
			} else {
				throw error;
			}
		}

		// Create franchise_deals collection
		try {
			await pb.collections.create({
				name: 'franchise_deals',
				type: 'base',
				schema: [
					{
						name: 'opportunityId',
						type: 'relation',
						required: true,
						options: {
							collectionId: 'franchise_opportunities',
							cascadeDelete: false,
							maxSelect: 1
						}
					},
					{
						name: 'dealNumber',
						type: 'text',
						required: false
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
						required: true
					},
					{
						name: 'dealValue',
						type: 'number',
						required: false
					},
					{
						name: 'paymentReceived',
						type: 'number',
						required: false
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
							collectionId: 'user_profiles',
							cascadeDelete: false,
							maxSelect: 1
						}
					},
					{
						name: 'notes',
						type: 'text',
						required: false
					},
					{
						name: 'closedBy',
						type: 'relation',
						required: false,
						options: {
							collectionId: 'user_profiles',
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
						required: false
					}
				],
				listRule: '@request.auth.id != ""',
				viewRule: '@request.auth.id != ""',
				createRule: '@request.auth.id != ""',
				updateRule: '@request.auth.id != ""',
				deleteRule: '@request.auth.id != ""'
			});
			console.log('✅ Created franchise_deals collection');
		} catch (error: any) {
			if (error.status === 400 && error.message.includes('already exists')) {
				console.log('⚠️  franchise_deals collection already exists');
			} else {
				throw error;
			}
		}

		// Create franchise_territories collection
		try {
			await pb.collections.create({
				name: 'franchise_territories',
				type: 'base',
				schema: [
					{
						name: 'name',
						type: 'text',
						required: true,
						options: { min: 1, max: 255 }
					},
					{
						name: 'code',
						type: 'text',
						required: false,
						options: { max: 10 }
					},
					{
						name: 'description',
						type: 'text',
						required: false
					},
					{
						name: 'state',
						type: 'text',
						required: false
					},
					{
						name: 'city',
						type: 'text',
						required: false
					},
					{
						name: 'region',
						type: 'text',
						required: false
					},
					{
						name: 'population',
						type: 'number',
						required: false
					},
					{
						name: 'marketSize',
						type: 'text',
						required: false
					},
					{
						name: 'status',
						type: 'select',
						required: true,
						options: {
							maxSelect: 1,
							values: ['available', 'reserved', 'sold', 'unavailable']
						}
					},
					{
						name: 'price',
						type: 'number',
						required: false
					},
					{
						name: 'dealId',
						type: 'relation',
						required: false,
						options: {
							collectionId: 'franchise_deals',
							cascadeDelete: false,
							maxSelect: 1
						}
					},
					{
						name: 'reservedUntil',
						type: 'date',
						required: false
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
			console.log('✅ Created franchise_territories collection');
		} catch (error: any) {
			if (error.status === 400 && error.message.includes('already exists')) {
				console.log('⚠️  franchise_territories collection already exists');
			} else {
				throw error;
			}
		}

		console.log('\n✅ All franchise sales collections created successfully!');
	} catch (error) {
		console.error('❌ Error creating collections:', error);
		process.exit(1);
	}
}

createFranchiseSalesCollections();
