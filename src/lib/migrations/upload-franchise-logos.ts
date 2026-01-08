import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import { readdirSync, readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

dotenv.config();

/**
 * Upload franchise logos from static/franchise-logos/{franchise-slug}/
 * Deletes the folder after successful upload to save space
 * 
 * Usage:
 *   npx tsx src/lib/migrations/upload-franchise-logos.ts hyzer-heroes
 *   npx tsx src/lib/migrations/upload-franchise-logos.ts all
 */

interface LogoMapping {
	[key: string]: string;
}

const folderToFieldMap: LogoMapping = {
	'full': 'logoFull',
	'mini': 'logoMini',
	'horizontal': 'logoHorizontal',
	'vertical': 'logoVertical',
	'monochrome': 'logoMonochrome',
	'wordmark': 'logoWordmark',
	'specs': 'brandSpecSheet',
	'assets': 'brandAssets'
};

function getMimeType(filename: string): string {
	const ext = filename.toLowerCase().split('.').pop();
	const mimeTypes: { [key: string]: string } = {
		'svg': 'image/svg+xml',
		'png': 'image/png',
		'jpg': 'image/jpeg',
		'jpeg': 'image/jpeg',
		'webp': 'image/webp',
		'pdf': 'application/pdf',
		'zip': 'application/zip'
	};
	return mimeTypes[ext || ''] || 'application/octet-stream';
}

async function uploadFranchiseLogos(franchiseSlug: string, deleteAfter: boolean = true) {
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

		// Find franchise by slug
		const franchises = await pb.collection('franchises').getFullList({
			filter: `slug = "${franchiseSlug}"`
		});

		if (franchises.length === 0) {
			throw new Error(`Franchise not found: ${franchiseSlug}`);
		}

		const franchise = franchises[0];
		console.log(`📋 Found franchise: ${franchise.name}\n`);

		// Check if folder exists
		const basePath = join(process.cwd(), 'static', 'franchise-logos', franchiseSlug);
		
		if (!existsSync(basePath)) {
			throw new Error(`Folder not found: ${basePath}`);
		}

		console.log(`📁 Reading files from: static/franchise-logos/${franchiseSlug}/\n`);

		const formData = new FormData();
		let totalFiles = 0;
		const uploadedFiles: { [key: string]: string[] } = {};

		// Read each subfolder
		for (const [folderName, fieldName] of Object.entries(folderToFieldMap)) {
			const folderPath = join(basePath, folderName);
			
			if (!existsSync(folderPath)) {
				console.log(`⏭️  Skipping ${folderName}/ (folder not found)`);
				continue;
			}

			try {
				const files = readdirSync(folderPath);
				
				if (files.length === 0) {
					console.log(`⏭️  Skipping ${folderName}/ (empty folder)`);
					continue;
				}

				console.log(`📂 Processing ${folderName}/ (${files.length} files):`);
				uploadedFiles[fieldName] = [];

				for (const filename of files) {
					// Skip hidden files and directories
					if (filename.startsWith('.') || filename === '.DS_Store') {
						continue;
					}

					const filePath = join(folderPath, filename);
					
					try {
						const fileBuffer = readFileSync(filePath);
						const mimeType = getMimeType(filename);
						
						const file = new File([fileBuffer], filename, { type: mimeType });
						formData.append(fieldName, file);
						
						totalFiles++;
						uploadedFiles[fieldName].push(filename);
						console.log(`   ✅ ${filename} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
					} catch (fileError: any) {
						console.error(`   ❌ Failed to read ${filename}:`, fileError.message);
					}
				}
				
				console.log('');
			} catch (dirError: any) {
				console.error(`❌ Error reading ${folderName}/:`, dirError.message);
			}
		}

		if (totalFiles === 0) {
			console.log('⚠️  No files found to upload');
			return;
		}

		console.log(`📤 Uploading ${totalFiles} files to PocketBase...\n`);

		// Upload to PocketBase
		await pb.collection('franchises').update(franchise.id, formData);

		console.log('✅ Upload successful!\n');
		console.log('📊 Summary:');
		for (const [fieldName, files] of Object.entries(uploadedFiles)) {
			if (files.length > 0) {
				console.log(`   ${fieldName}: ${files.length} file(s)`);
			}
		}
		console.log(`   Total: ${totalFiles} file(s)\n`);

		// Delete folder if requested
		if (deleteAfter) {
			console.log(`🗑️  Deleting folder: static/franchise-logos/${franchiseSlug}/`);
			rmSync(basePath, { recursive: true, force: true });
			console.log('✅ Folder deleted to save space\n');
		} else {
			console.log(`ℹ️  Keeping folder (use --delete flag to remove)\n`);
		}

		console.log('✅ Done!\n');

	} catch (error: any) {
		console.error('❌ Upload failed:', error.message);
		if (error.data) {
			console.error('   Details:', JSON.stringify(error.data, null, 2));
		}
		throw error;
	}
}

async function uploadAllFranchises() {
	const basePath = join(process.cwd(), 'static', 'franchise-logos');
	
	if (!existsSync(basePath)) {
		console.error('❌ Folder not found: static/franchise-logos/');
		console.log('\nCreate the folder structure:');
		console.log('  static/franchise-logos/{franchise-slug}/full/');
		console.log('  static/franchise-logos/{franchise-slug}/mini/');
		console.log('  etc.');
		return;
	}

	const franchiseSlugs = readdirSync(basePath).filter(item => {
		const itemPath = join(basePath, item);
		return existsSync(itemPath) && readdirSync(itemPath).length > 0;
	});

	if (franchiseSlugs.length === 0) {
		console.log('⚠️  No franchise folders found in static/franchise-logos/');
		return;
	}

	console.log(`📋 Found ${franchiseSlugs.length} franchise folder(s):\n`);
	franchiseSlugs.forEach(slug => console.log(`   - ${slug}`));
	console.log('');

	for (const slug of franchiseSlugs) {
		console.log(`\n${'='.repeat(60)}`);
		console.log(`Processing: ${slug}`);
		console.log('='.repeat(60) + '\n');
		
		try {
			await uploadFranchiseLogos(slug, true);
		} catch (error: any) {
			console.error(`❌ Failed to upload ${slug}:`, error.message);
			console.log('Continuing with next franchise...\n');
		}
	}

	console.log('\n✅ All franchises processed!');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
	const franchiseSlug = process.argv[2];
	const deleteFlag = process.argv.includes('--delete') || process.argv.includes('-d');

	if (!franchiseSlug) {
		console.log('Usage:');
		console.log('  npx tsx src/lib/migrations/upload-franchise-logos.ts <franchise-slug>');
		console.log('  npx tsx src/lib/migrations/upload-franchise-logos.ts all');
		console.log('');
		console.log('Options:');
		console.log('  --delete, -d    Delete folder after upload (default: true)');
		console.log('  --keep          Keep folder after upload');
		console.log('');
		console.log('Examples:');
		console.log('  npx tsx src/lib/migrations/upload-franchise-logos.ts hyzer-heroes');
		console.log('  npx tsx src/lib/migrations/upload-franchise-logos.ts all');
		console.log('  npx tsx src/lib/migrations/upload-franchise-logos.ts hyzer-heroes --keep');
		console.log('');
		console.log('Folder structure:');
		console.log('  static/franchise-logos/');
		console.log('  ├── hyzer-heroes/');
		console.log('  │   ├── full/          → logoFull');
		console.log('  │   ├── mini/          → logoMini');
		console.log('  │   ├── horizontal/    → logoHorizontal');
		console.log('  │   ├── vertical/      → logoVertical');
		console.log('  │   ├── monochrome/    → logoMonochrome');
		console.log('  │   ├── wordmark/      → logoWordmark');
		console.log('  │   ├── specs/         → brandSpecSheet');
		console.log('  │   └── assets/        → brandAssets');
		console.log('  └── huk-a-mania/');
		console.log('      └── ...');
		process.exit(0);
	}

	const shouldDelete = !process.argv.includes('--keep');

	if (franchiseSlug === 'all') {
		uploadAllFranchises().catch(() => process.exit(1));
	} else {
		uploadFranchiseLogos(franchiseSlug, shouldDelete).catch(() => process.exit(1));
	}
}

export { uploadFranchiseLogos };
