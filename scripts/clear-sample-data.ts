import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function clearSampleData() {
	try {
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);

		console.log('✅ Authenticated as admin\n');
		console.log('🗑️  Clearing existing sample data...\n');

		const collections = [
			'sponsor_franchise_bridge',
			'franchise_deals',
			'franchise_opportunities',
			'franchise_leads',
			'franchise_territories',
			'sponsors'
		];

		for (const collectionName of collections) {
			try {
				const records = await pb.collection(collectionName).getFullList();
				let deleted = 0;
				
				for (const record of records) {
					try {
						await pb.collection(collectionName).delete(record.id);
						deleted++;
					} catch (e) {
						// Continue on error
					}
				}
				
				console.log(`✅ Cleared ${deleted} records from ${collectionName}`);
			} catch (error) {
				console.log(`⚠️  ${collectionName}: ${error}`);
			}
		}

		console.log('\n✅ Sample data cleared successfully!');
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

clearSampleData();
