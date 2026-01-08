import PocketBase from 'pocketbase';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

const pb = new PocketBase('https://pocketbase-production-6ab5.up.railway.app');

// Authenticate
await pb.admins.authWithPassword('ddinsmore8@gmail.com', 'MADcap(123)');

const leagueSlug = 'fli-golf';
const baseFolder = 'static/LEAGUE'; // Upload your league logos here

// Get league record
const league = await pb.collection('league').getFirstListItem(`slug="${leagueSlug}"`);
console.log(`Found league: ${league.name} (${league.id})`);

// MIME type mapping
const mimeTypes: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.eps': 'application/postscript',
  '.ai': 'application/postscript'
};

function getMimeType(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// Recursively read all files from a directory
async function getAllFiles(dir: string, fileList: string[] = []): Promise<string[]> {
  try {
    const files = await readdir(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      const fileStat = await stat(filePath);
      
      if (fileStat.isDirectory()) {
        // Skip __MACOSX folders
        if (file === '__MACOSX') continue;
        await getAllFiles(filePath, fileList);
      } else {
        // Skip hidden files and non-image/pdf files
        if (file.startsWith('.') || file.startsWith('._')) continue;
        fileList.push(filePath);
      }
    }
  } catch (error) {
    // Directory doesn't exist, skip
  }
  
  return fileList;
}

// Process logo folder and upload to specific field
async function processLogoFolder(folderPath: string, fieldName: string) {
  console.log(`\n📂 Processing ${folderPath} → ${fieldName}:`);
  
  const files = await getAllFiles(folderPath);
  
  if (files.length === 0) {
    console.log(`   ⚠️  No files found in ${folderPath}`);
    return;
  }
  
  const logoFiles: File[] = [];
  
  for (const filePath of files) {
    const fileBuffer = await readFile(filePath);
    const fileName = filePath.split('/').pop()!;
    const mimeType = getMimeType(fileName);
    
    // Only upload svg, png, jpg files for logos
    if (mimeType.startsWith('image/')) {
      const file = new File([fileBuffer], fileName, { type: mimeType });
      logoFiles.push(file);
      console.log(`   ✅ ${fileName} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    }
  }
  
  if (logoFiles.length > 0) {
    const formData = new FormData();
    logoFiles.forEach(file => formData.append(fieldName, file));
    
    await pb.collection('league').update(league.id, formData);
    console.log(`   📤 ${logoFiles.length} files uploaded to ${fieldName}`);
  }
}

// Upload spec sheet
async function uploadSpecSheet() {
  console.log(`\n📄 Processing spec sheet → brandSpecSheet:`);
  
  try {
    const specSheetPath = join(baseFolder, 'FLIGolf-SnTWorks.pdf');
    const fileBuffer = await readFile(specSheetPath);
    const file = new File([fileBuffer], 'FLIGolf-SnTWorks.pdf', { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('brandSpecSheet', file);
    
    await pb.collection('league').update(league.id, formData);
    console.log(`   ✅ FLIGolf-SnTWorks.pdf (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
  } catch (error) {
    console.log(`   ⚠️  No spec sheet found`);
  }
}

// Main execution
try {
  // Gender-specific logos
  await processLogoFolder(join(baseFolder, 'mens'), 'logoMens');
  await processLogoFolder(join(baseFolder, 'womens'), 'logoWomens');
  
  // Additional logo variations (optional)
  await processLogoFolder(join(baseFolder, 'horizontal'), 'logoHorizontal');
  await processLogoFolder(join(baseFolder, 'vertical'), 'logoVertical');
  await processLogoFolder(join(baseFolder, 'monochrome'), 'logoMonochrome');
  await processLogoFolder(join(baseFolder, 'wordmark'), 'logoWordmark');
  
  // Spec sheet
  await uploadSpecSheet();
  
  console.log('\n✅ League logo upload complete!');
  
  // Clean up folder
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  await execAsync(`rm -rf ${baseFolder}`);
  console.log('🗑️  Folder static/LEAGUE/ deleted to save space');
  
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
