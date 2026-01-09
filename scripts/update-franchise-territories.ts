import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function updateFranchiseTerritories() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');

		// Get all collections to find the correct IDs
		const collections = await pb.collections.getFullList();
		
		const franchiseTerritoriesCollection = collections.find((c: any) => c.name === 'franchise_territories');
		const franchiseDealsCollection = collections.find((c: any) => c.name === 'franchise_deals');

		console.log('📋 Found Collections:');
		console.log(`   franchise_territories: ${franchiseTerritoriesCollection?.id || 'NOT FOUND'}`);
		console.log(`   franchise_deals: ${franchiseDealsCollection?.id || 'NOT FOUND'}\n`);

		if (!franchiseTerritoriesCollection) {
			console.log('❌ franchise_territories collection not found.');
			process.exit(1);
		}

		console.log('📝 Updating franchise_territories collection with all fields...\n');

		const schema = [
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
				type: 'editor',
				required: false
			},
			{
				name: 'state',
				type: 'text',
				required: false,
				options: { max: 100 }
			},
			{
				name: 'city',
				type: 'text',
				required: false,
				options: { max: 100 }
			},
			{
				name: 'region',
				type: 'text',
				required: false,
				options: { max: 100 }
			},
			{
				name: 'population',
				type: 'number',
				required: false,
				options: { min: 0 }
			},
			{
				name: 'marketSize',
				type: 'text',
				required: false,
				options: { max: 50 }
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
				required: false,
				options: { min: 0 }
			},
			{
				name: 'reservedUntil',
				type: 'date',
				required: false
			},
			{
				name: 'notes',
				type: 'editor',
				required: false
			}
		];

		// Add relation only if franchise_deals collection exists
		if (franchiseDealsCollection) {
			schema.push({
				name: 'dealId',
				type: 'relation',
				required: false,
				options: {
					collectionId: franchiseDealsCollection.id,
					cascadeDelete: false,
					maxSelect: 1
				}
			} as any);
		}

		await pb.collections.update(franchiseTerritoriesCollection.id, {
			schema: schema
		});

		console.log('✅ Updated franchise_territories collection successfully!\n');
		console.log('📊 Summary:');
		console.log(`   Total fields: ${schema.length}`);
		console.log('\n📋 Fields added:');
		console.log('   • name (text, required)');
		console.log('   • code (text) - e.g., "TX-DAL", "CA-LA"');
		console.log('   • description (editor)');
		console.log('   • state (text)');
		console.log('   • city (text)');
		console.log('   • region (text)');
		console.log('   • population (number)');
		console.log('   • marketSize (text)');
		console.log('   • status (select: available, reserved, sold, unavailable)');
		console.log('   • price (number) - Default $10M');
		console.log('   • reservedUntil (date)');
		console.log('   • notes (editor)');
		if (franchiseDealsCollection) {
			console.log('   • dealId (relation to franchise_deals)');
		}
		console.log('\n✅ franchise_territories collection is ready!');

	} catch (error: any) {
		console.error('❌ Error updating collection:', error);
		if (error.data) {
			console.error('Error details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

updateFranchiseTerritories();
