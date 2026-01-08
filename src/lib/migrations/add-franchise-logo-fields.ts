import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Add comprehensive logo fields to franchises collection
 * Supports multiple logo types, sizes, and formats
 */
async function addFranchiseLogoFields() {
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

		// Get the franchises collection
		const collections = await pb.collections.getFullList();
		const franchisesCollection = collections.find(c => c.name === 'franchises');
		
		if (!franchisesCollection) {
			throw new Error('Franchises collection not found');
		}

		console.log('📋 Current franchises collection:');
		console.log(`   Fields: ${franchisesCollection.fields?.length || 0}\n`);

		// Check which logo fields already exist
		const existingLogoFields = franchisesCollection.fields?.filter((f: any) => 
			f.name.toLowerCase().includes('logo')
		) || [];

		console.log('Existing logo fields:');
		existingLogoFields.forEach((f: any) => {
			console.log(`   - ${f.name} (${f.type})`);
		});
		console.log('');

		// Define new logo fields
		const newLogoFields = [
			// Main Logo (already exists, but we'll update it)
			{
				name: 'logoFull',
				type: 'file',
				required: false,
				maxSelect: 5, // Multiple versions (PNG, SVG, etc.)
				maxSize: 10485760, // 10MB
				mimeTypes: [
					'image/png',
					'image/jpeg',
					'image/svg+xml',
					'image/webp'
				],
				thumbs: ['200x200', '400x400', '800x800']
			},
			// Mini/Icon Logo
			{
				name: 'logoMini',
				type: 'file',
				required: false,
				maxSelect: 5,
				maxSize: 5242880, // 5MB
				mimeTypes: [
					'image/png',
					'image/jpeg',
					'image/svg+xml',
					'image/webp'
				],
				thumbs: ['50x50', '100x100', '200x200']
			},
			// Horizontal/Wide Logo
			{
				name: 'logoHorizontal',
				type: 'file',
				required: false,
				maxSelect: 5,
				maxSize: 10485760,
				mimeTypes: [
					'image/png',
					'image/jpeg',
					'image/svg+xml',
					'image/webp'
				],
				thumbs: ['400x100', '800x200']
			},
			// Vertical/Stacked Logo
			{
				name: 'logoVertical',
				type: 'file',
				required: false,
				maxSelect: 5,
				maxSize: 10485760,
				mimeTypes: [
					'image/png',
					'image/jpeg',
					'image/svg+xml',
					'image/webp'
				],
				thumbs: ['200x400', '400x800']
			},
			// Monochrome/Single Color Logo
			{
				name: 'logoMonochrome',
				type: 'file',
				required: false,
				maxSelect: 5,
				maxSize: 10485760,
				mimeTypes: [
					'image/png',
					'image/jpeg',
					'image/svg+xml',
					'image/webp'
				],
				thumbs: ['200x200', '400x400']
			},
			// Wordmark (text-only logo)
			{
				name: 'logoWordmark',
				type: 'file',
				required: false,
				maxSelect: 5,
				maxSize: 10485760,
				mimeTypes: [
					'image/png',
					'image/jpeg',
					'image/svg+xml',
					'image/webp'
				],
				thumbs: ['400x100', '800x200']
			},
			// Brand Spec Sheet (PDF from artist)
			{
				name: 'brandSpecSheet',
				type: 'file',
				required: false,
				maxSelect: 3, // Allow multiple versions/updates
				maxSize: 20971520, // 20MB for PDFs
				mimeTypes: [
					'application/pdf'
				],
				thumbs: []
			},
			// Additional Brand Assets
			{
				name: 'brandAssets',
				type: 'file',
				required: false,
				maxSelect: 20, // Patterns, textures, icons, etc.
				maxSize: 10485760,
				mimeTypes: [
					'image/png',
					'image/jpeg',
					'image/svg+xml',
					'image/webp',
					'application/pdf',
					'application/zip'
				],
				thumbs: ['200x200', '400x400']
			},
			// Color Palette (JSON for programmatic access)
			{
				name: 'colorPalette',
				type: 'json',
				required: false,
				maxSize: 0
			},
			// Typography Info
			{
				name: 'typography',
				type: 'json',
				required: false,
				maxSize: 0
			}
		];

		console.log('➕ Adding new logo fields...\n');

		// Get current fields and add new ones
		const updatedFields = [...franchisesCollection.fields];

		// Remove old 'logo' field if it exists
		const oldLogoIndex = updatedFields.findIndex((f: any) => f.name === 'logo');
		if (oldLogoIndex !== -1) {
			console.log('   Removing old "logo" field...');
			updatedFields.splice(oldLogoIndex, 1);
		}

		// Add new logo fields
		newLogoFields.forEach(field => {
			// Check if field already exists
			const existingIndex = updatedFields.findIndex((f: any) => f.name === field.name);
			
			if (existingIndex !== -1) {
				console.log(`   Updating: ${field.name}`);
				updatedFields[existingIndex] = {
					...updatedFields[existingIndex],
					...field,
					id: updatedFields[existingIndex].id
				};
			} else {
				console.log(`   Adding: ${field.name}`);
				updatedFields.push({
					...field,
					id: `${field.name}_field`,
					hidden: false,
					presentable: false,
					system: false
				});
			}
		});

		// Update collection
		await pb.collections.update(franchisesCollection.id, {
			fields: updatedFields
		});

		console.log('\n✅ Logo fields added successfully!\n');
		console.log('New Logo Fields:');
		console.log('   📁 logoFull - Main logo (multiple formats)');
		console.log('   📁 logoMini - Icon/mini logo');
		console.log('   📁 logoHorizontal - Wide/horizontal layout');
		console.log('   📁 logoVertical - Stacked/vertical layout');
		console.log('   📁 logoMonochrome - Single color version');
		console.log('   📁 logoWordmark - Text-only logo');
		console.log('   📄 brandSpecSheet - PDF spec sheet from artist');
		console.log('   📁 brandAssets - Additional brand files');
		console.log('   🎨 colorPalette - JSON color definitions');
		console.log('   🔤 typography - JSON font information');
		
		console.log('\nFile Limits:');
		console.log('   Logos: 5 files each (PNG, SVG, JPEG, WebP)');
		console.log('   Spec Sheet: 3 PDFs (20MB each)');
		console.log('   Brand Assets: 20 files (10MB each)');
		
	} catch (error: any) {
		console.error('❌ Failed to add logo fields:', error.message);
		if (error.data) {
			console.error('   Details:', JSON.stringify(error.data, null, 2));
		}
		throw error;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	addFranchiseLogoFields().catch(() => process.exit(1));
}

export { addFranchiseLogoFields };
