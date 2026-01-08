import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configure signedContracts field for multiple contract files
 */
async function configureSignedContracts() {
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

		console.log('📋 Current pros collection fields:');
		console.log(`   Total fields: ${prosCollection.fields?.length || 0}\n`);

		// Find signedContracts field
		const contractsFieldIndex = prosCollection.fields?.findIndex((f: any) => f.name === 'signedContracts');
		
		if (contractsFieldIndex === -1 || contractsFieldIndex === undefined) {
			console.log('❌ signedContracts field not found!');
			console.log('   Please add it manually in PocketBase admin UI first.');
			return;
		}

		const contractsField = prosCollection.fields[contractsFieldIndex];
		console.log('📝 Current signedContracts field:');
		console.log(`   Type: ${contractsField.type}`);
		console.log(`   Max files: ${contractsField.maxSelect}`);
		console.log(`   Max size: ${contractsField.maxSize} bytes`);
		console.log(`   MIME types: ${contractsField.mimeTypes?.join(', ') || 'none'}`);

		// Update the field with proper configuration
		console.log('\n🔄 Updating signedContracts field configuration...');
		
		const updatedFields = [...prosCollection.fields];
		updatedFields[contractsFieldIndex] = {
			...contractsField,
			maxSelect: 10, // Allow up to 10 contract files
			maxSize: 10485760, // 10MB per file
			mimeTypes: [
				'application/pdf',
				'application/msword',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				'image/jpeg',
				'image/jpg',
				'image/png'
			],
			thumbs: [] // No thumbnails needed for documents
		};

		await pb.collections.update(prosCollection.id, {
			fields: updatedFields
		});

		console.log('✅ signedContracts field updated successfully!\n');
		console.log('New configuration:');
		console.log('   Max files: 10 (multiple contracts per pro)');
		console.log('   Max size per file: 10MB');
		console.log('   Allowed types:');
		console.log('     - PDF (.pdf)');
		console.log('     - Word (.doc, .docx)');
		console.log('     - Images (.jpg, .png) for scanned contracts');
		
	} catch (error: any) {
		console.error('❌ Failed to configure signedContracts field:', error.message);
		if (error.data) {
			console.error('   Details:', JSON.stringify(error.data, null, 2));
		}
		throw error;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	configureSignedContracts().catch(() => process.exit(1));
}

export { configureSignedContracts };
