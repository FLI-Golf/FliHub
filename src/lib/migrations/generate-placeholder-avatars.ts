import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { File as NodeFile } from 'buffer';

dotenv.config();

/**
 * Generate placeholder avatars with initials for pros without avatars
 * Creates simple SVG avatars with the pro's initials
 */

interface ColorScheme {
	background: string;
	text: string;
}

const colorSchemes: ColorScheme[] = [
	{ background: '#3B82F6', text: '#FFFFFF' }, // Blue
	{ background: '#10B981', text: '#FFFFFF' }, // Green
	{ background: '#F59E0B', text: '#FFFFFF' }, // Amber
	{ background: '#EF4444', text: '#FFFFFF' }, // Red
	{ background: '#8B5CF6', text: '#FFFFFF' }, // Purple
	{ background: '#EC4899', text: '#FFFFFF' }, // Pink
	{ background: '#06B6D4', text: '#FFFFFF' }, // Cyan
	{ background: '#F97316', text: '#FFFFFF' }, // Orange
	{ background: '#14B8A6', text: '#FFFFFF' }, // Teal
	{ background: '#6366F1', text: '#FFFFFF' }, // Indigo
];

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) {
		return parts[0].substring(0, 2).toUpperCase();
	}
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorForName(name: string): ColorScheme {
	// Use name to consistently pick a color
	const hash = name.split('').reduce((acc, char) => {
		return char.charCodeAt(0) + ((acc << 5) - acc);
	}, 0);
	const index = Math.abs(hash) % colorSchemes.length;
	return colorSchemes[index];
}

function generateAvatarSVG(name: string, size: number = 500): string {
	const initials = getInitials(name);
	const colors = getColorForName(name);
	const fontSize = Math.floor(size * 0.4);
	
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${colors.background}"/>
  <text
    x="50%"
    y="50%"
    font-family="Arial, sans-serif"
    font-size="${fontSize}"
    font-weight="600"
    fill="${colors.text}"
    text-anchor="middle"
    dominant-baseline="central"
  >${initials}</text>
</svg>`;
}

async function generatePlaceholderAvatars() {
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

		// Get all pros without avatars
		const allPros = await pb.collection('pros').getFullList();
		const prosWithoutAvatars = allPros.filter(pro => !pro.avatar);
		
		console.log(`📋 Found ${allPros.length} total pros`);
		console.log(`🎨 ${prosWithoutAvatars.length} pros need placeholder avatars\n`);

		if (prosWithoutAvatars.length === 0) {
			console.log('✅ All pros already have avatars!');
			return;
		}

		// Create temp directory for generated avatars
		const tempDir = join(process.cwd(), 'temp_avatars');
		if (!existsSync(tempDir)) {
			mkdirSync(tempDir, { recursive: true });
		}

		let generated = 0;
		let uploaded = 0;
		let errors = 0;

		for (const pro of prosWithoutAvatars) {
			try {
				console.log(`🎨 Generating avatar for ${pro.name}...`);
				
				// Generate SVG
				const svg = generateAvatarSVG(pro.name);
				const fileName = `${pro.id}.svg`;
				const tempPath = join(tempDir, fileName);
				
				// Save temporarily
				writeFileSync(tempPath, svg, 'utf-8');
				generated++;
				
				// Read file back as buffer
				const fileBuffer = readFileSync(tempPath);
				
				// Create File object for Node.js
				const file = new File([fileBuffer], fileName, { type: 'image/svg+xml' });
				
				// Create FormData and upload to PocketBase
				const formData = new FormData();
				formData.append('avatar', file);
				
				await pb.collection('pros').update(pro.id, formData);
				uploaded++;
				
				console.log(`   ✅ Uploaded placeholder avatar (${getInitials(pro.name)})`);
				
			} catch (error: any) {
				console.error(`   ❌ Error processing ${pro.name}:`, error.message);
				if (error.data) {
					console.error('      Details:', JSON.stringify(error.data, null, 2));
				}
				errors++;
			}
		}

		console.log('\n📊 Generation Summary:');
		console.log(`   Generated: ${generated}`);
		console.log(`   Uploaded: ${uploaded}`);
		console.log(`   Errors: ${errors}`);
		console.log('\n✅ Placeholder generation completed!');
		
	} catch (error: any) {
		console.error('❌ Generation failed:', error.message);
		throw error;
	}
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	generatePlaceholderAvatars().catch(() => process.exit(1));
}

export { generatePlaceholderAvatars, generateAvatarSVG, getInitials };
