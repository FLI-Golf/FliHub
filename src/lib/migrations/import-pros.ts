import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { join } from 'path';

dotenv.config();

/**
 * Import pros from CSV file
 */

interface ProCSVRow {
	Name: string;
	Photo: string;
	'World Ranking': string;
	Country: string;
	'Signed Contract': string;
	Bio: string;
	Residence: string;
	'Sponsored by': string;
	DOB: string;
	Nickname: string;
	Height: string;
	Weight: string;
	TikTok: string;
	'Twitch:': string;
	'Website/Blog (if applicable)': string;
	'Year Turned Professional': string;
	'Primary Sponsor(s)': string;
	'Favorite Disc': string;
	'Signature Move or Shot': string;
	'Career Highlights': string;
	'Number of Tournaments Played': string;
	'Notable Records or Milestones': string;
	Education: string;
	'Other Sports Played': string;
	'Hobbies Outside Disc Golf': string;
	'Favorite Destination Played': string;
	'Personal Motivation or Quote': string;
	'Injury History (if any)': string;
	'Current Fitness Regimen': string;
	'Dietary Preferences or Restrictions': string;
	'Long-Term Goals': string;
	'Personal Mission Statement in Disc Golf': string;
	'Primary Airport': string;
	'Secondary (Alternate) Airport': string;
	'Frequent Flyer Number(s)': string;
	'Video Highlights Links': string;
}

function parseDate(dateStr: string): string | undefined {
	if (!dateStr || dateStr.trim() === '') return undefined;
	
	try {
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return undefined;
		return date.toISOString().split('T')[0]; // YYYY-MM-DD format
	} catch {
		return undefined;
	}
}

function parseNumber(numStr: string): number | undefined {
	if (!numStr || numStr.trim() === '') return undefined;
	const num = parseInt(numStr.replace(/[^0-9]/g, ''), 10);
	return isNaN(num) ? undefined : num;
}

function cleanText(text: string): string | undefined {
	if (!text || text.trim() === '') return undefined;
	return text.trim();
}

function cleanURL(url: string): string | undefined {
	if (!url || url.trim() === '') return undefined;
	const cleaned = url.trim();
	// Basic URL validation
	try {
		new URL(cleaned);
		return cleaned;
	} catch {
		// If not a valid URL, return undefined
		return undefined;
	}
}

async function importPros() {
	const pb = new PocketBase(
		process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app/'
	);

	try {
		// Authenticate
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL || 'ddinsmore8@gmail.com',
			process.env.POCKETBASE_ADMIN_PASSWORD || 'MADcap(123)'
		);
		console.log('✅ Authenticated\n');

		// Read CSV file
		const csvPath = join(process.cwd(), 'static', 'csv_data', 'Pros.csv');
		const csvContent = readFileSync(csvPath, 'utf-8');

		// Parse CSV
		const records: ProCSVRow[] = parse(csvContent, {
			columns: true,
			skip_empty_lines: true,
			trim: true
		});

		console.log(`📊 Found ${records.length} pros in CSV\n`);

		let created = 0;
		let skipped = 0;
		let errors = 0;
		let currentGender: 'male' | 'female' | undefined = undefined;

		for (const row of records) {
			// Skip header rows
			if (row.Name === 'Male' || row.Name === 'Female') {
				currentGender = row.Name.toLowerCase() as 'male' | 'female';
				console.log(`\n📍 Processing ${row.Name} pros...\n`);
				continue;
			}

			// Skip empty rows
			if (!row.Name || row.Name.trim() === '') {
				continue;
			}

			try {
				// Skip duplicate check for now - just try to create

				// Parse world ranking
				const worldRanking = row['World Ranking']
					? parseNumber(row['World Ranking'].replace('#', '').trim())
					: undefined;

				// Parse signed contract safely
				let signedContract = undefined;
				const contractStr = cleanText(row['Signed Contract']);
				if (contractStr) {
					try {
						// Try to parse as JSON, but if it fails, store as string
						signedContract = JSON.parse(contractStr);
					} catch {
						// If not valid JSON, just store the string
						signedContract = contractStr;
					}
				}

				// Create pro record with basic fields only
				const proData: any = {
					name: row.Name,
					status: 'active'
				};

				// Add optional fields
				if (cleanText(row.Nickname)) proData.nickname = cleanText(row.Nickname);
				if (worldRanking !== undefined) proData.worldRanking = worldRanking;
				if (cleanText(row.Country)) proData.country = cleanText(row.Country);
				if (cleanText(row.Residence)) proData.residence = cleanText(row.Residence);
				if (cleanText(row.Bio)) proData.bio = cleanText(row.Bio);
				if (cleanText(row['Sponsored by'])) proData.sponsoredBy = cleanText(row['Sponsored by']);
				if (cleanText(row.Height)) proData.height = cleanText(row.Height);
				if (cleanText(row.Weight)) proData.weight = cleanText(row.Weight);
				if (parseNumber(row['Year Turned Professional']))
					proData.yearTurnedPro = parseNumber(row['Year Turned Professional']);
				if (currentGender) proData.gender = currentGender;

				const pro = await pb.collection('pros').create(proData);
				console.log(`✅ Created pro: ${row.Name}`);

				// Create user account for the pro
				const firstName = row.Name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
				const email = `${firstName}@fligolf.com`;
				const password = 'MADcap(123)';

				try {
					// Check if user already exists
					const existingUsers = await pb.collection('users').getFullList({
						filter: `email = "${email}"`
					});

					let userId: string;

					if (existingUsers.length > 0) {
						userId = existingUsers[0].id;
						console.log(`   ℹ️  User already exists: ${email}`);
					} else {
						// Create user
						const user = await pb.collection('users').create({
							email,
							password,
							passwordConfirm: password,
							emailVisibility: true
						});
						userId = user.id;
						console.log(`   ✅ Created user: ${email}`);
					}

					// Check if user profile exists
					const existingProfiles = await pb.collection('user_profiles').getFullList({
						filter: `userId = "${userId}"`
					});

					if (existingProfiles.length > 0) {
						// Update existing profile with pro reference
						await pb.collection('user_profiles').update(existingProfiles[0].id, {
							proReference: pro.id,
							role: 'pro',
							availableRoles: ['pro']
						});
						console.log(`   ✅ Updated user profile with pro reference`);
					} else {
						// Create user profile
						const [firstName, ...lastNameParts] = row.Name.split(' ');
						const lastName = lastNameParts.join(' ') || firstName;

						await pb.collection('user_profiles').create({
							userId: userId,
							firstName: firstName,
							lastName: lastName,
							email: email,
							role: 'pro',
							availableRoles: ['pro'],
							status: 'active',
							proReference: pro.id
						});
						console.log(`   ✅ Created user profile with pro reference`);
					}
				} catch (userError: any) {
					console.error(`   ⚠️  Error creating user for ${row.Name}:`, userError.message);
					// Continue even if user creation fails
				}

				created++;
			} catch (error: any) {
				console.error(`❌ Error importing ${row.Name}:`, error.message);
				if (error.data) {
					console.error('   Details:', JSON.stringify(error.data, null, 2));
				}
				errors++;
			}
		}

		console.log('\n📊 Import Summary:');
		console.log(`   Created: ${created}`);
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
	importPros().catch(() => process.exit(1));
}

export { importPros };
