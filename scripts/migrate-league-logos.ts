import PocketBase from 'pocketbase';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import 'dotenv/config';

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Authenticate as admin
await pb.admins.authWithPassword(
	process.env.POCKETBASE_ADMIN_EMAIL!,
	process.env.POCKETBASE_ADMIN_PASSWORD!
);

console.log('✅ Authenticated as admin');

const leagueSlug = 'fli-golf';
const baseFolder = 'static/FGL';

// Step 1: Add new logo fields to the league collection
console.log('\n📋 Step 1: Adding logo fields to league collection...');

const newFields = [
	{
		name: 'logoMens',
		type: 'file',
		maxSelect: 10,
		maxSize: 10485760, // 10MB
		mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'],
		required: false
	},
	{
		name: 'logoWomens',
		type: 'file',
		maxSelect: 10,
		maxSize: 10485760,
		mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'],
		required: false
	},
	{
		name: 'logoMonochrome',
		type: 'file',
		maxSelect: 10,
		maxSize: 10485760,
		mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'],
		required: false
	}
];

try {
	// Get current collection schema
	const collection = await pb.collections.getOne('league');
	const existingFieldNames = collection.fields.map((f: any) => f.name);
	
	// Filter out fields that already exist
	const fieldsToAdd = newFields.filter(f => !existingFieldNames.includes(f.name));
	
	if (fieldsToAdd.length > 0) {
		const updatedFields = [...collection.fields, ...fieldsToAdd];
		await pb.collections.update('league', { fields: updatedFields });
		console.log(`   ✅ Added fields: ${fieldsToAdd.map(f => f.name).join(', ')}`);
	} else {
		console.log('   ℹ️  All logo fields already exist');
	}
} catch (error) {
	console.error('   ❌ Error adding fields:', error);
	process.exit(1);
}

// Step 2: Get league record
console.log('\n📋 Step 2: Finding league record...');
let league;
try {
	league = await pb.collection('league').getFirstListItem(`slug="${leagueSlug}"`);
	console.log(`   ✅ Found league: ${league.name} (${league.id})`);
} catch (error) {
	console.error('   ❌ League not found:', error);
	process.exit(1);
}

// MIME type mapping
const mimeTypes: Record<string, string> = {
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.pdf': 'application/pdf'
};

function getMimeType(filename: string): string {
	const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
	return mimeTypes[ext] || 'application/octet-stream';
}

// Get all files from a directory
async function getFilesFromDir(dir: string): Promise<string[]> {
	const files: string[] = [];
	try {
		const entries = await readdir(dir);
		for (const entry of entries) {
			const filePath = join(dir, entry);
			const fileStat = await stat(filePath);
			if (fileStat.isFile() && !entry.startsWith('.')) {
				files.push(filePath);
			}
		}
	} catch (error) {
		// Directory doesn't exist
	}
	return files;
}

// Upload files to a specific field
async function uploadToField(folderPath: string, fieldName: string, description: string) {
	console.log(`\n📂 Uploading ${description} → ${fieldName}:`);
	
	const files = await getFilesFromDir(folderPath);
	
	if (files.length === 0) {
		console.log(`   ⚠️  No files found in ${folderPath}`);
		return;
	}
	
	const uploadFiles: File[] = [];
	
	for (const filePath of files) {
		const fileName = filePath.split('/').pop()!;
		const mimeType = getMimeType(fileName);
		
		// Only upload supported formats
		if (mimeTypes[fileName.substring(fileName.lastIndexOf('.')).toLowerCase()]) {
			const fileBuffer = await readFile(filePath);
			const file = new File([fileBuffer], fileName, { type: mimeType });
			uploadFiles.push(file);
			console.log(`   📄 ${fileName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
		} else {
			console.log(`   ⏭️  Skipping ${fileName} (unsupported format)`);
		}
	}
	
	if (uploadFiles.length > 0) {
		const formData = new FormData();
		uploadFiles.forEach(file => formData.append(fieldName, file));
		
		await pb.collection('league').update(league.id, formData);
		console.log(`   ✅ Uploaded ${uploadFiles.length} files to ${fieldName}`);
	}
}

// Step 3: Upload logos
console.log('\n📋 Step 3: Uploading logo files...');

try {
	// Men's logos (Red-White-Blue)
	await uploadToField(
		join(baseFolder, 'RED-WHITE-BLUE'),
		'logoMens',
		"Men's logos (Red-White-Blue)"
	);
	
	// Women's logos (Pink-White-Blue)
	await uploadToField(
		join(baseFolder, 'PINK-WHITE-BLUE'),
		'logoWomens',
		"Women's logos (Pink-White-Blue)"
	);
	
	// Monochrome logos (Black-White)
	await uploadToField(
		join(baseFolder, 'BLACK-WHITE'),
		'logoMonochrome',
		'Monochrome logos (Black-White)'
	);
	
	console.log('\n✅ League logo migration complete!');
	
	// Verify upload
	const updatedLeague = await pb.collection('league').getOne(league.id);
	console.log('\n📊 Verification:');
	console.log(`   logoMens: ${updatedLeague.logoMens?.length || 0} files`);
	console.log(`   logoWomens: ${updatedLeague.logoWomens?.length || 0} files`);
	console.log(`   logoMonochrome: ${updatedLeague.logoMonochrome?.length || 0} files`);
	
} catch (error) {
	console.error('❌ Error uploading logos:', error);
	process.exit(1);
}
