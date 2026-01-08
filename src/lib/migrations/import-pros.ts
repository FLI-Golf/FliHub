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
	let url = process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app';
	// Remove trailing slash if present
	url = url.replace(/\/$/, '');
	
	const pb = new PocketBase(url);

	try {
		const email = process.env.POCKETBASE_ADMIN_EMAIL;
		const password = process.env.POCKETBASE_ADMIN_PASSWORD;
		
		if (!email || !password) {
			throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in .env file');
		}
		
		console.log(`🔐 Authenticating to ${url}...`);
		console.log(`   Email: ${email}`);
		
		// Authenticate
		await pb.admins.authWithPassword(email, password);
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

		// Get all existing users and profiles for matching
		const allUsers = await pb.collection('users').getFullList();
		const allProfiles = await pb.collection('user_profiles').getFullList();
		console.log(`📋 Found ${allUsers.length} existing users and ${allProfiles.length} profiles\n`);

		let created = 0;
		let updated = 0;
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
				// Check if pro already exists
				const existingPros = await pb.collection('pros').getFullList({
					filter: `name = "${row.Name.replace(/"/g, '\\"')}"`
				});

				if (existingPros.length > 0) {
					console.log(`⏭️  Pro already exists: ${row.Name}`);
					skipped++;
					continue;
				}

				// Parse world ranking
				const worldRanking = row['World Ranking']
					? parseNumber(row['World Ranking'].replace('#', '').trim())
					: undefined;

				// Parse date of birth
				const dateOfBirth = parseDate(row.DOB);

				// Parse signed contract safely
				let signedContract = undefined;
				const contractStr = cleanText(row['Signed Contract']);
				if (contractStr) {
					try {
						signedContract = JSON.parse(contractStr);
					} catch {
						signedContract = contractStr;
					}
				}

				// Try to find matching user by name
				const [firstName, ...lastNameParts] = row.Name.split(' ');
				const lastName = lastNameParts.join(' ') || firstName;
				
				// Look for matching profile by name
				const matchingProfile = allProfiles.find(p => {
					const profileFirstName = (p.firstName || '').toLowerCase();
					const profileLastName = (p.lastName || '').toLowerCase();
					const csvFirstName = firstName.toLowerCase();
					const csvLastName = lastName.toLowerCase();
					
					return profileFirstName === csvFirstName && profileLastName === csvLastName;
				});

				let userProfileId: string | undefined = undefined;
				
				if (matchingProfile) {
					userProfileId = matchingProfile.id; // Use the profile record ID, not userId
					console.log(`🔗 Found matching user profile for ${row.Name}`);
				}

				// Create pro record with all available fields
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
				if (cleanURL(row.Photo)) proData.photo = cleanURL(row.Photo);
				if (cleanText(row['Sponsored by'])) proData.sponsoredBy = cleanText(row['Sponsored by']);
				if (dateOfBirth) proData.dateOfBirth = dateOfBirth;
				if (cleanText(row.Height)) proData.height = cleanText(row.Height);
				if (cleanText(row.Weight)) proData.weight = cleanText(row.Weight);
				if (cleanText(row.TikTok)) proData.tiktok = cleanText(row.TikTok);
				if (cleanText(row['Twitch:'])) proData.twitch = cleanText(row['Twitch:']);
				if (cleanURL(row['Website/Blog (if applicable)'])) proData.website = cleanURL(row['Website/Blog (if applicable)']);
				if (parseNumber(row['Year Turned Professional']))
					proData.yearTurnedPro = parseNumber(row['Year Turned Professional']);
				if (cleanText(row['Primary Sponsor(s)'])) proData.primarySponsor = cleanText(row['Primary Sponsor(s)']);
				if (cleanText(row['Favorite Disc'])) proData.favoriteDisc = cleanText(row['Favorite Disc']);
				if (cleanText(row['Signature Move or Shot'])) proData.signatureMove = cleanText(row['Signature Move or Shot']);
				if (cleanText(row['Career Highlights'])) proData.careerHighlights = cleanText(row['Career Highlights']);
				if (parseNumber(row['Number of Tournaments Played']))
					proData.tournamentsPlayed = parseNumber(row['Number of Tournaments Played']);
				if (cleanText(row['Notable Records or Milestones'])) proData.notableRecords = cleanText(row['Notable Records or Milestones']);
				if (cleanText(row.Education)) proData.education = cleanText(row.Education);
				if (cleanText(row['Other Sports Played'])) proData.otherSports = cleanText(row['Other Sports Played']);
				if (cleanText(row['Hobbies Outside Disc Golf'])) proData.hobbies = cleanText(row['Hobbies Outside Disc Golf']);
				if (cleanText(row['Favorite Destination Played'])) proData.favoriteDestination = cleanText(row['Favorite Destination Played']);
				if (cleanText(row['Personal Motivation or Quote'])) proData.personalMotivation = cleanText(row['Personal Motivation or Quote']);
				if (cleanText(row['Video Highlights Links'])) proData.videoHighlightsLinks = cleanText(row['Video Highlights Links']);
				if (cleanText(row['Injury History (if any)'])) proData.injuryHistory = cleanText(row['Injury History (if any)']);
				if (cleanText(row['Current Fitness Regimen'])) proData.fitnessRegimen = cleanText(row['Current Fitness Regimen']);
				if (cleanText(row['Dietary Preferences or Restrictions'])) proData.dietaryPreferences = cleanText(row['Dietary Preferences or Restrictions']);
				if (cleanText(row['Long-Term Goals'])) proData.longTermGoals = cleanText(row['Long-Term Goals']);
				if (cleanText(row['Personal Mission Statement in Disc Golf'])) proData.missionStatement = cleanText(row['Personal Mission Statement in Disc Golf']);
				if (cleanText(row['Primary Airport'])) proData.primaryAirport = cleanText(row['Primary Airport']);
				if (cleanText(row['Secondary (Alternate) Airport'])) proData.secondaryAirport = cleanText(row['Secondary (Alternate) Airport']);
				if (cleanText(row['Frequent Flyer Number(s)'])) proData.frequentFlyerNumbers = cleanText(row['Frequent Flyer Number(s)']);
				if (signedContract) proData.signedContract = signedContract;
				if (currentGender) proData.gender = currentGender;
				if (userProfileId) proData.userId = userProfileId;

				const pro = await pb.collection('pros').create(proData);
				console.log(`✅ Created pro: ${row.Name}${userProfileId ? ' (linked to user)' : ''}`);

				// Update user profile with pro reference if we found a match
				if (matchingProfile && userProfileId) {
					try {
						await pb.collection('user_profiles').update(matchingProfile.id, {
							proReference: pro.id,
							role: 'pro',
							availableRoles: ['pro']
						});
						console.log(`   ✅ Updated user profile with pro reference`);
						updated++;
					} catch (updateError: any) {
						console.error(`   ⚠️  Error updating profile:`, updateError.message);
					}
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
		console.log(`   Updated profiles: ${updated}`);
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
