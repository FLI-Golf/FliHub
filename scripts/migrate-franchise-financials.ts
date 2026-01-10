import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const POCKETBASE_URL = process.env.POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function migrateFranchiseFinancials() {
	console.log('🚀 Migrating franchise financial fields...\n');

	if (!POCKETBASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('❌ Missing environment variables');
		process.exit(1);
	}

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated as admin\n');

		// Get franchise_deals collection
		const collections = await pb.collections.getFullList();
		const franchiseDealsCollection = collections.find(c => c.name === 'franchise_deals');

		if (!franchiseDealsCollection) {
			console.error('❌ franchise_deals collection not found');
			process.exit(1);
		}

		console.log('📋 Found franchise_deals collection:', franchiseDealsCollection.id);

		// Define new fields to add
		const newFields = [
			{
				name: 'totalFranchiseValue',
				type: 'number',
				required: false,
				min: 0,
				max: null,
				onlyInt: false
			},
			{
				name: 'sponsorshipDiscount',
				type: 'number',
				required: false,
				min: 0,
				max: null,
				onlyInt: false
			},
			{
				name: 'negotiatedValue',
				type: 'number',
				required: false,
				min: 0,
				max: null,
				onlyInt: false
			},
			{
				name: 'netFranchiseValue',
				type: 'number',
				required: false,
				min: 0,
				max: null,
				onlyInt: false
			},
			{
				name: 'initialPayment',
				type: 'number',
				required: false,
				min: 0,
				max: null,
				onlyInt: false
			},
			{
				name: 'totalPaidToDate',
				type: 'number',
				required: false,
				min: 0,
				max: null,
				onlyInt: false
			},
			{
				name: 'outstandingBalance',
				type: 'number',
				required: false,
				min: 0,
				max: null,
				onlyInt: false
			},
			{
				name: 'paymentMilestones',
				type: 'json',
				required: false,
				maxSize: 0
			},
			{
				name: 'sponsorBridgeId',
				type: 'text',
				required: false,
				min: 0,
				max: 0,
				autogeneratePattern: '',
				pattern: ''
			}
		];

		// Get existing fields
		const existingFields = franchiseDealsCollection.fields || [];
		const existingFieldNames = existingFields.map((f: any) => f.name);

		// Filter out fields that already exist
		const fieldsToAdd = newFields.filter(field => !existingFieldNames.includes(field.name));

		if (fieldsToAdd.length === 0) {
			console.log('⚠️  All new fields already exist');
		} else {
			console.log(`\n➕ Adding ${fieldsToAdd.length} new fields:`);
			fieldsToAdd.forEach(field => console.log(`   - ${field.name} (${field.type})`));

			// Add new fields to existing fields
			const updatedFields = [...existingFields, ...fieldsToAdd];

			// Update the collection
			await pb.collections.update(franchiseDealsCollection.id, {
				fields: updatedFields
			});

			console.log('\n✅ Successfully added new fields to franchise_deals collection!');
		}

		// Now migrate existing data
		console.log('\n📊 Migrating existing franchise deal data...');
		const deals = await pb.collection('franchise_deals').getFullList();
		
		console.log(`Found ${deals.length} franchise deals to migrate\n`);

		let migrated = 0;
		let skipped = 0;

		for (const deal of deals) {
			try {
				// Check if already migrated
				if (deal.totalFranchiseValue && deal.netFranchiseValue) {
					console.log(`⚠️  Skipped deal ${deal.dealNumber || deal.id} - already migrated`);
					skipped++;
					continue;
				}

				// Migrate old fields to new structure
				const dealValue = deal.dealValue || 10000000;
				const paymentReceived = deal.paymentReceived || 0;

				const updateData: any = {
					totalFranchiseValue: dealValue,
					netFranchiseValue: dealValue,
					sponsorshipDiscount: 0,
					initialPayment: paymentReceived,
					totalPaidToDate: paymentReceived,
					outstandingBalance: dealValue - paymentReceived
				};

				// Create default payment milestones (5 stages of 20% each)
				const milestoneAmount = dealValue / 5;
				updateData.paymentMilestones = [
					{
						milestoneNumber: 1,
						description: 'Initial Payment (20%)',
						amountDue: milestoneAmount,
						amountPaid: paymentReceived >= milestoneAmount ? milestoneAmount : paymentReceived,
						status: paymentReceived >= milestoneAmount ? 'paid' : (paymentReceived > 0 ? 'partial' : 'pending')
					},
					{
						milestoneNumber: 2,
						description: 'Second Payment (20%)',
						amountDue: milestoneAmount,
						amountPaid: 0,
						status: 'pending'
					},
					{
						milestoneNumber: 3,
						description: 'Third Payment (20%)',
						amountDue: milestoneAmount,
						amountPaid: 0,
						status: 'pending'
					},
					{
						milestoneNumber: 4,
						description: 'Fourth Payment (20%)',
						amountDue: milestoneAmount,
						amountPaid: 0,
						status: 'pending'
					},
					{
						milestoneNumber: 5,
						description: 'Final Payment (20%)',
						amountDue: milestoneAmount,
						amountPaid: 0,
						status: 'pending'
					}
				];

				await pb.collection('franchise_deals').update(deal.id, updateData);
				console.log(`✅ Migrated deal ${deal.dealNumber || deal.id}`);
				migrated++;
			} catch (error: any) {
				console.error(`❌ Failed to migrate deal ${deal.id}:`, error.message);
			}
		}

		console.log('\n📈 Migration Summary:');
		console.log(`   ✅ Migrated: ${migrated}`);
		console.log(`   ⚠️  Skipped: ${skipped}`);
		console.log(`   Total deals: ${deals.length}`);

		console.log('\n✅ Franchise financial migration completed!');
		process.exit(0);
	} catch (error: any) {
		console.error('❌ Migration failed:', error.message || error);
		if (error.response) {
			console.error('Response:', JSON.stringify(error.response, null, 2));
		}
		process.exit(1);
	}
}

migrateFranchiseFinancials();
