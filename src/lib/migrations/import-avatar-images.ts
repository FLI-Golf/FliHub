import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';
import { File as NodeFile } from 'buffer';

dotenv.config();

/**
 * Import avatar images from URLs
 * Downloads images from URLs and uploads them to PocketBase
 */

interface ProWithImage {
	id: string;
	name: string;
	imageUrl: string;
}

async function downloadImage(url: string): Promise<Buffer> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download image: ${response.statusText}`);
	}
	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
}

function getFileExtension(url: string, contentType?: string): string {
	// Try to get extension from content type
	if (contentType) {
		const typeMap: Record<string, string> = {
			'image/jpeg': 'jpg',
			'image/jpg': 'jpg',
			'image/png': 'png',
			'image/gif': 'gif',
			'image/webp': 'webp'
		};
		if (typeMap[contentType]) {
			return typeMap[contentType];
		}
	}
	
	// Try to get extension from URL
	const match = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
	if (match) {
		return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
	}
	
	// Default to jpg
	return 'jpg';
}

async function importAvatarImages(csvPath?: string) {
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

		// Get all pros
		const pros = await pb.collection('pros').getFullList();
		console.log(`📋 Found ${pros.length} pros in database\n`);

		// If CSV path provided, read image URLs from CSV
		let imageMap: Map<string, string> = new Map();
		
		if (csvPath) {
			console.log(`📄 Reading image URLs from ${csvPath}...`);
			const csvContent = readFileSync(csvPath, 'utf-8');
			const records = parse(csvContent, {
				columns: true,
				skip_empty_lines: true,
				trim: true
			});

			records.forEach((row: any) => {
				if (row.Name && row.Name !== 'Male' && row.Name !== 'Female') {
					const imageUrl = row['Photo'] || row['In-Action Photo'] || row['photo'] || row['image'];
					if (imageUrl && imageUrl.trim() && imageUrl.includes('http')) {
						imageMap.set(row.Name, imageUrl.trim());
					}
				}
			});
			
			console.log(`   Found ${imageMap.size} image URLs in CSV\n`);
		}

		// Create temp directory for downloads
		const tempDir = join(process.cwd(), 'temp_avatars');
		if (!existsSync(tempDir)) {
			mkdirSync(tempDir, { recursive: true });
		}

		let downloaded = 0;
		let uploaded = 0;
		let skipped = 0;
		let errors = 0;

		for (const pro of pros) {
			try {
				// Skip if already has avatar
				if (pro.avatar) {
					console.log(`⏭️  ${pro.name}: Already has avatar`);
					skipped++;
					continue;
				}

				// Check if we have an image URL for this pro
				const imageUrl = imageMap.get(pro.name) || pro.photo;
				
				if (!imageUrl || !imageUrl.includes('http')) {
					console.log(`⏭️  ${pro.name}: No image URL available`);
					skipped++;
					continue;
				}

				console.log(`📥 ${pro.name}: Downloading from ${imageUrl.substring(0, 60)}...`);
				
				// Download image
				const imageBuffer = await downloadImage(imageUrl);
				downloaded++;
				
				// Determine file extension
				const ext = getFileExtension(imageUrl);
				const fileName = `${pro.id}.${ext}`;
				const tempPath = join(tempDir, fileName);
				
				// Save temporarily
				writeFileSync(tempPath, imageBuffer);
				
				// Create File object for Node.js
				const file = new File([imageBuffer], fileName, { type: `image/${ext}` });
				
				// Create FormData and upload to PocketBase
				const formData = new FormData();
				formData.append('avatar', file);
				
				await pb.collection('pros').update(pro.id, formData);
				uploaded++;
				
				console.log(`   ✅ Uploaded avatar for ${pro.name}`);
				
			} catch (error: any) {
				console.error(`   ❌ Error processing ${pro.name}:`, error.message);
				errors++;
			}
		}

		console.log('\n📊 Import Summary:');
		console.log(`   Downloaded: ${downloaded}`);
		console.log(`   Uploaded: ${uploaded}`);
		console.log(`   Skipped: ${skipped}`);
		console.log(`   Errors: ${errors}`);
		console.log('\n✅ Import completed!');
		
	} catch (error: any) {
		console.error('❌ Import failed:', error.message);
		throw error;
	}
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const csvPath = process.argv[2] || join(process.cwd(), 'static', 'csv_data', 'Pros.csv');
	importAvatarImages(csvPath).catch(() => process.exit(1));
}

export { importAvatarImages };
