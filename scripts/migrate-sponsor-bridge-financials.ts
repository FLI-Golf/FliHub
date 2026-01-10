import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const POCKETBASE_URL = process.env.POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function migrateSponsorBridgeFinancials() {
	console.log('🚀 Migrating sponsor bridge financial fields...\n');

	if (!POCKETBASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('❌ Missing environment variables');
		process.exit(1);
	}

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated as admin\n');

		const collections = await pb.collections.getFullList();
		const bridgeCollection = collections.find(c => c.name === 'sponsor_franchise_bridge');

		if (!bridgeCollection) {
			console.error('❌ sponsor_franchise_bridge collection not found');
			process.exit(1);
		}

		console.log('📋 Found sponsor_franchise_bridge collection:', bridgeCollection.id);

		// Define new fields
		const newFields = [
			{
				name: 'franchiseDiscount',
				type: 'number',
				required: false,
				min: 0,
				max: null,
				onlyInt: false
			},
			{
				name: 'totalFranchiseValue',
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
			}
		];

		const existingFields = bridgeCollection.fields || [];
		const existingFieldNames = existingFields.map((f: any) => f.name);

		const fieldsToAdd = newFields.filter(field => !existingFieldNames.includes(field.name));

		if (fieldsToAdd.length === 0) {
			console.log('⚠️  All new fields already exist');
		} else {
			console.log(`\n➕ Adding ${fieldsToAdd.length} new fields:`);
			fieldsToAdd.forEach(field => console.log(`   - ${field.name} (${field.type})`));

			const updatedFields = [...existingFields, ...fieldsToAdd];

			await pb.collections.update(bridgeCollection.id, {
				fields: updatedFields
			});

			console.log('\n✅ Successfully added new fields to sponsor_franchise_bridge collection!');
		}

		// Migrate existing data
		console.log('\n📊 Migrating existing sponsor bridge data...');
		const bridges = await pb.collection('sponsor_franchise_bridge').getFullList();
		
		console.log(`Found ${bridges.length} sponsor bridges to migrate\n`);

		let migrated = 0;
		let skipped = 0;

		for (const bridge of bridges) {
			try {
				if (bridge.totalFranchiseValue && bridge.netFranchiseValue) {
					console.log(`⚠️  Skipped bridge ${bridge.id} - already migrated`);
					skipped++;
					continue;
				}

				const sponsorshipValue = bridge.sponsorshipValueToDate || 0;
				const baseFranchiseValue = 10000000;
				
				// Calculate discount: 10% per $1M sponsorship (max 30%)
				const discountPercentage = Math.min((sponsorshipValue / 1000000) * 10, 30);
				const discount = Math.round((baseFranchiseValue * discountPercentage) / 100);
				const netValue = baseFranchiseValue - discount;

				const updateData = {
					totalFranchiseValue: baseFranchiseValue,
					franchiseDiscount: discount,
					netFranchiseValue: netValue
				};

				await pb.collection('sponsor_franchise_bridge').update(bridge.id, updateData);
				console.log(`✅ Migrated bridge ${bridge.id} (discount: $${discount.toLocaleString()})`);
				migrated++;
			} catch (error: any) {
				console.error(`❌ Failed to migrate bridge ${bridge.id}:`, error.message);
			}
		}

		console.log('\n📈 Migration Summary:');
		console.log(`   ✅ Migrated: ${migrated}`);
		console.log(`   ⚠️  Skipped: ${skipped}`);
		console.log(`   Total bridges: ${bridges.length}`);

		console.log('\n✅ Sponsor bridge financial migration completed!');
		process.exit(0);
	} catch (error: any) {
		console.error('❌ Migration failed:', error.message || error);
		if (error.response) {
			console.error('Response:', JSON.stringify(error.response, null, 2));
		}
		process.exit(1);
	}
}

migrateSponsorBridgeFinancials();
