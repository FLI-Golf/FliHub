import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const POCKETBASE_URL = process.env.POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function migrateFranchisesFinancials() {
	console.log('🚀 Migrating franchises collection financial fields...\n');

	if (!POCKETBASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('❌ Missing environment variables');
		process.exit(1);
	}

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated as admin\n');

		// Get franchises collection
		const collections = await pb.collections.getFullList();
		const franchisesCollection = collections.find(c => c.name === 'franchises');

		if (!franchisesCollection) {
			console.error('❌ franchises collection not found');
			process.exit(1);
		}

		console.log('📋 Found franchises collection:', franchisesCollection.id);

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
			},
			{
				name: 'franchiseDealId',
				type: 'text',
				required: false,
				min: 0,
				max: 0,
				autogeneratePattern: '',
				pattern: ''
			}
		];

		// Get existing fields
		const existingFields = franchisesCollection.fields || [];
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
			await pb.collections.update(franchisesCollection.id, {
				fields: updatedFields
			});

			console.log('\n✅ Successfully added new fields to franchises collection!');
		}

		// Now migrate existing data
		console.log('\n📊 Migrating existing franchise data...');
		const franchises = await pb.collection('franchises').getFullList();
		
		console.log(`Found ${franchises.length} franchises to migrate\n`);

		let migrated = 0;
		let skipped = 0;

		for (const franchise of franchises) {
			try {
				// Check if already migrated
				if (franchise.totalFranchiseValue && franchise.netFranchiseValue) {
					console.log(`⚠️  Skipped franchise ${franchise.name} - already migrated`);
					skipped++;
					continue;
				}

				// Migrate old franchiseFee to new structure
				const franchiseFee = franchise.franchiseFee || 10000000;

				const updateData: any = {
					totalFranchiseValue: franchiseFee,
					netFranchiseValue: franchiseFee,
					sponsorshipDiscount: 0,
					initialPayment: 0,
					totalPaidToDate: 0,
					outstandingBalance: franchiseFee
				};

				// Create default payment milestones (5 stages of 20% each)
				const milestoneAmount = franchiseFee / 5;
				updateData.paymentMilestones = [
					{
						milestoneNumber: 1,
						description: 'Initial Payment (20%)',
						amountDue: milestoneAmount,
						amountPaid: 0,
						status: 'pending'
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

				await pb.collection('franchises').update(franchise.id, updateData);
				console.log(`✅ Migrated franchise "${franchise.name}" (${franchise.slug})`);
				migrated++;
			} catch (error: any) {
				console.error(`❌ Failed to migrate franchise ${franchise.id}:`, error.message);
			}
		}

		console.log('\n📈 Migration Summary:');
		console.log(`   ✅ Migrated: ${migrated}`);
		console.log(`   ⚠️  Skipped: ${skipped}`);
		console.log(`   Total franchises: ${franchises.length}`);

		console.log('\n💡 Note: franchiseFee field is kept for backward compatibility');
		console.log('   New code should use totalFranchiseValue and netFranchiseValue');

		console.log('\n✅ Franchises financial migration completed!');
		process.exit(0);
	} catch (error: any) {
		console.error('❌ Migration failed:', error.message || error);
		if (error.response) {
			console.error('Response:', JSON.stringify(error.response, null, 2));
		}
		process.exit(1);
	}
}

migrateFranchisesFinancials();
