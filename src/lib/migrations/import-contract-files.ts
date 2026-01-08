import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';

dotenv.config();

/**
 * Import contract files from URLs in the signedContract JSON field
 * Downloads PDFs from URLs and uploads them to the signedContracts file field
 */

interface ContractInfo {
	name: string;
	url: string;
	size?: number;
	type?: string;
	upload_time?: string;
}

async function downloadFile(url: string): Promise<Buffer> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download file: ${response.statusText}`);
	}
	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
}

function parseContractData(contractStr: string): ContractInfo[] {
	if (!contractStr || contractStr.trim() === '') {
		return [];
	}

	const contracts: ContractInfo[] = [];
	
	// Handle single contract object
	if (contractStr.startsWith('{') && !contractStr.startsWith('[')) {
		// Check if it's multiple contracts concatenated
		const parts = contractStr.split('} {');
		
		if (parts.length > 1) {
			// Multiple contracts concatenated
			parts.forEach((part, index) => {
				let jsonStr = part.trim();
				if (index > 0) jsonStr = '{' + jsonStr;
				if (index < parts.length - 1) jsonStr = jsonStr + '}';
				
				try {
					// Convert Python-style dict to JSON
					const cleaned = jsonStr
						.replace(/'/g, '"')
						.replace(/True/g, 'true')
						.replace(/False/g, 'false')
						.replace(/None/g, 'null');
					const contract = JSON.parse(cleaned);
					if (contract.url) {
						contracts.push(contract);
					}
				} catch (e) {
					console.error('   ⚠️  Failed to parse contract part:', jsonStr.substring(0, 50));
				}
			});
		} else {
			// Single contract
			try {
				const cleaned = contractStr
					.replace(/'/g, '"')
					.replace(/True/g, 'true')
					.replace(/False/g, 'false')
					.replace(/None/g, 'null');
				const contract = JSON.parse(cleaned);
				if (contract.url) {
					contracts.push(contract);
				}
			} catch (e) {
				console.error('   ⚠️  Failed to parse contract:', contractStr.substring(0, 50));
			}
		}
	}
	
	return contracts;
}

async function importContractFiles() {
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

		let downloaded = 0;
		let uploaded = 0;
		let skipped = 0;
		let errors = 0;

		for (const pro of pros) {
			try {
				// Skip if already has contract files
				if (pro.signedContracts && pro.signedContracts.length > 0) {
					console.log(`⏭️  ${pro.name}: Already has ${pro.signedContracts.length} contract file(s)`);
					skipped++;
					continue;
				}

				// Check if has contract data in JSON field
				if (!pro.signedContract) {
					console.log(`⏭️  ${pro.name}: No contract data`);
					skipped++;
					continue;
				}

				// Parse contract data
				const contracts = parseContractData(
					typeof pro.signedContract === 'string' 
						? pro.signedContract 
						: JSON.stringify(pro.signedContract)
				);

				if (contracts.length === 0) {
					console.log(`⏭️  ${pro.name}: No valid contract URLs found`);
					skipped++;
					continue;
				}

				console.log(`📥 ${pro.name}: Found ${contracts.length} contract(s)`);

				// Create temp directory
				const tempDir = join(process.cwd(), 'temp_contracts');
				if (!existsSync(tempDir)) {
					mkdirSync(tempDir, { recursive: true });
				}

				const tempFiles: string[] = [];
				let filesAdded = 0;

				for (const contract of contracts) {
					try {
						console.log(`   Downloading: ${contract.name}...`);
						const fileBuffer = await downloadFile(contract.url);
						downloaded++;

						// Save to temp file
						const tempPath = join(tempDir, contract.name);
						writeFileSync(tempPath, fileBuffer);
						tempFiles.push(tempPath);
						filesAdded++;
						
					} catch (downloadError: any) {
						console.error(`   ⚠️  Failed to download ${contract.name}:`, downloadError.message);
					}
				}

				if (filesAdded > 0) {
					// Upload all contracts for this pro using file paths
					const formData = new FormData();
					
					for (const tempPath of tempFiles) {
						const fileBuffer = readFileSync(tempPath);
						const fileName = tempPath.split('/').pop()!;
						
						// Determine MIME type
						let mimeType = 'application/pdf';
						const ext = fileName.toLowerCase().split('.').pop();
						if (ext === 'doc') mimeType = 'application/msword';
						else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
						else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
						else if (ext === 'png') mimeType = 'image/png';
						
						const file = new File([fileBuffer], fileName, { type: mimeType });
						formData.append('signedContracts', file);
					}
					
					await pb.collection('pros').update(pro.id, formData);
					uploaded++;
					console.log(`   ✅ Uploaded ${filesAdded} contract file(s)`);
				}

			} catch (error: any) {
				console.error(`❌ Error processing ${pro.name}:`, error.message);
				if (error.data) {
					console.error('   Details:', JSON.stringify(error.data, null, 2));
				}
				errors++;
			}
		}

		console.log('\n📊 Import Summary:');
		console.log(`   Downloaded: ${downloaded} files`);
		console.log(`   Uploaded to: ${uploaded} pros`);
		console.log(`   Skipped: ${skipped}`);
		console.log(`   Errors: ${errors}`);
		console.log('\n✅ Import completed!');
		
	} catch (error: any) {
		console.error('❌ Import failed:', error.message);
		throw error;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	importContractFiles().catch(() => process.exit(1));
}

export { importContractFiles };
