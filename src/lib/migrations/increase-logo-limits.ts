import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Increase logo field limits to accommodate more files
 */
async function increaseLogoLimits() {
	let url = process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app';
	url = url.replace(/\/$/, '');
	
	const pb = new PocketBase(url);

	try {
		const email = process.env.POCKETBASE_ADMIN_EMAIL;
		const password = process.env.POCKETBASE_ADMIN_PASSWORD;
		
		if (!email || !password) {
			throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in .env file');
		}
		
		console.log(`🔐 Authenticating to ${url}...`);
		await pb.admins.authWithPassword(email, password);
		console.log('✅ Authenticated\n');

		const collections = await pb.collections.getFullList();
		const franchisesCollection = collections.find(c => c.name === 'franchises');
		
		if (!franchisesCollection) {
			throw new Error('Franchises collection not found');
		}

		console.log('📋 Updating logo field limits...\n');

		const updatedFields = franchisesCollection.fields.map((field: any) => {
			// Increase logo file limits from 5 to 15
			if (['logoFull', 'logoMini', 'logoHorizontal', 'logoVertical', 'logoMonochrome', 'logoWordmark'].includes(field.name)) {
				console.log(`   ${field.name}: 5 → 15 files`);
				return {
					...field,
					maxSelect: 15
				};
			}
			
			// Increase spec sheet size from 20MB to 30MB
			if (field.name === 'brandSpecSheet') {
				console.log(`   ${field.name}: 20MB → 30MB per file`);
				return {
					...field,
					maxSize: 31457280 // 30MB
				};
			}
			
			return field;
		});

		await pb.collections.update(franchisesCollection.id, {
			fields: updatedFields
		});

		console.log('\n✅ Limits updated successfully!\n');
		console.log('New Limits:');
		console.log('   Logo fields: 15 files each (was 5)');
		console.log('   Spec sheets: 30MB per file (was 20MB)');
		
	} catch (error: any) {
		console.error('❌ Failed to update limits:', error.message);
		if (error.data) {
			console.error('   Details:', JSON.stringify(error.data, null, 2));
		}
		throw error;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	increaseLogoLimits().catch(() => process.exit(1));
}

export { increaseLogoLimits };
