import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Add avatar file field to pros collection
 */
async function addAvatarField() {
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

		// Get the pros collection
		const collections = await pb.collections.getFullList();
		const prosCollection = collections.find(c => c.name === 'pros');
		
		if (!prosCollection) {
			throw new Error('Pros collection not found');
		}

		console.log('📋 Current pros collection schema:');
		console.log(`   Fields: ${prosCollection.schema?.length || 0}`);

		// Check if avatar field already exists
		const avatarField = prosCollection.schema?.find((f: any) => f.name === 'avatar');
		if (avatarField) {
			console.log('\n⚠️  Avatar field already exists!');
			console.log('   Type:', avatarField.type);
			return;
		}

		// Add avatar field
		console.log('\n➕ Adding avatar field...');
		
		const updatedSchema = [
			...(prosCollection.schema || []),
			{
				name: 'avatar',
				type: 'file',
				required: false,
				presentable: false,
				system: false,
				hidden: false,
				id: 'avatar_field',
				maxSelect: 1,
				maxSize: 5242880, // 5MB
				mimeTypes: [
					'image/jpeg',
					'image/jpg',
					'image/png',
					'image/gif',
					'image/webp',
					'image/svg+xml'
				],
				thumbs: [
					'100x100',
					'300x300',
					'500x500'
				],
				protected: false
			}
		];

		await pb.collections.update(prosCollection.id, {
			schema: updatedSchema
		});

		console.log('✅ Avatar field added successfully!');
		console.log('\nField configuration:');
		console.log('   Name: avatar');
		console.log('   Type: file');
		console.log('   Max files: 1');
		console.log('   Max size: 5MB');
		console.log('   Allowed types: JPEG, PNG, GIF, WebP, SVG');
		console.log('   Thumbnails: 100x100, 300x300, 500x500');
		
	} catch (error: any) {
		console.error('❌ Failed to add avatar field:', error.message);
		if (error.data) {
			console.error('   Details:', JSON.stringify(error.data, null, 2));
		}
		throw error;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	addAvatarField().catch(() => process.exit(1));
}

export { addAvatarField };
