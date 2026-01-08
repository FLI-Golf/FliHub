import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration: Remove deprecated managers collection
 * 
 * The managers collection is deprecated. We now use user_profiles with role='leader'
 * for leadership roles. This migration removes the old managers collection.
 */

async function removeManagersCollection() {
	const pb = new PocketBase(
		process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app/'
	);

	try {
		// Authenticate
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL || 'ddinsmore8@gmail.com',
			process.env.POCKETBASE_ADMIN_PASSWORD || 'MADcap(123)'
		);
		console.log('✅ Authenticated\n');

		// Check if managers collection exists
		const collections = await pb.collections.getFullList();
		const managersCollection = collections.find((c) => c.name === 'managers');

		if (!managersCollection) {
			console.log('ℹ️  managers collection does not exist - nothing to remove');
			return;
		}

		// Check if there are any records
		const records = await pb.collection('managers').getFullList();
		
		if (records.length > 0) {
			console.log(`⚠️  Warning: managers collection has ${records.length} records`);
			console.log('   These records should be migrated to user_profiles before deletion');
			console.log('   Aborting migration...');
			return;
		}

		console.log('🗑️  Removing managers collection...');
		await pb.collections.delete(managersCollection.id);
		console.log('✅ Removed managers collection\n');

		console.log('✅ Migration completed successfully!');
		console.log('\nNote: The system now uses user_profiles with role="leader" for leadership roles.');
	} catch (error: any) {
		console.error('❌ Migration failed:', error.message);
		if (error.data) {
			console.error('Details:', JSON.stringify(error.data, null, 2));
		}
		throw error;
	}
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	removeManagersCollection().catch(() => process.exit(1));
}

export { removeManagersCollection };
