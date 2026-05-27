/**
 * Syncs talent records (pros, broadcasters, managers) from the updated
 * FLI Golf Google Sheet into PocketBase.
 *
 * New fields covered: email, phone, hometown, geolocation, careerEarnings,
 * careerWins, injured, avgDriveDistance, circle1Pct, circle2Pct, fairwayPct,
 * puttPct, emergencyContact, managerPhone, instagram, facebook, twitter,
 * youtube, yearsPlayingDiscGolf, plus all previously synced fields.
 *
 * Status mapping:
 *   "Primary Pro"    -> status=primary_pro, talentType=[player]
 *   "Reserve Pro"    -> status=reserve_pro, talentType=[player]
 *   "Broadcaster"    -> talentType=[broadcaster]
 *   "Manager / Agent"-> talentType=[manager]
 *
 * Matching: by lowercased name. New records created if not found.
 * Only non-empty sheet values are written to preserve existing data.
 * File/photo fields are skipped (not uploadable from CSV URLs).
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';
import * as https from 'https';
import * as http from 'http';

dotenv.config();

const SHEET_URL =
	'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ52A2a6eWUJtoUiq1i4pmWNyxjHEkTt7blzeTzGkZggbgHYqatDcj5FXoPUsYyCw/pub?gid=1854274497&single=true&output=csv';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

function fetchUrl(url: string, redirects = 0): Promise<string> {
	if (redirects > 10) return Promise.reject(new Error('Too many redirects'));
	return new Promise((resolve, reject) => {
		const client = url.startsWith('https') ? https : http;
		client
			.get(url, (res) => {
				if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
					fetchUrl(res.headers.location, redirects + 1).then(resolve).catch(reject);
					return;
				}
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', () => resolve(data));
			})
			.on('error', reject);
	});
}

function parseDOB(val: string): string {
	if (!val.trim()) return '';
	const parts = val.split('/');
	if (parts.length !== 3) return '';
	const [m, d, y] = parts.map((p) => p.trim());
	return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} 00:00:00.000Z`;
}

function parseYear(val: string): number {
	const m = val.match(/\d{4}/);
	return m ? parseInt(m[0]) : 0;
}

function parseNumber(val: string): number {
	const cleaned = val.replace(/[^0-9.]/g, '');
	return cleaned ? parseFloat(cleaned) || 0 : 0;
}

function parseBool(val: string): boolean | null {
	const v = val.trim().toLowerCase();
	if (v === 'yes' || v === 'true' || v === '1') return true;
	if (v === 'no' || v === 'false' || v === '0') return false;
	return null;
}

/** Strip placeholder template text left in the sheet */
function stripPlaceholder(val: string, ...markers: string[]): string {
	for (const m of markers) {
		if (val.includes(m)) return '';
	}
	return val;
}

function mapStatus(raw: string): { status: string; talentType: string[] } {
	switch (raw.trim()) {
		case 'Primary Pro':
			return { status: 'primary_pro', talentType: ['player'] };
		case 'Reserve Pro':
			return { status: 'reserve_pro', talentType: ['player'] };
		case 'Broadcaster':
			return { status: 'active', talentType: ['broadcaster'] };
		case 'Manager / Agent':
			return { status: 'active', talentType: ['manager'] };
		default:
			return { status: 'active', talentType: ['player'] };
	}
}

async function run() {
	console.log('Fetching CSV from Google Sheets...');
	const csvText = await fetchUrl(SHEET_URL);

	const records: string[][] = parse(csvText, { relax_quotes: true, skip_empty_lines: false });
	if (records.length < 2) {
		console.error('No data rows found in CSV');
		process.exit(1);
	}

	const header = records[0];
	const col = (name: string) => header.findIndex((h) => h.trim() === name);
	const get = (row: string[], idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : '');

	// Column indices
	const iName = col('Name');
	const iGender = col('Gender');
	const iEmail = col('Email adress');
	const iGeolocation = col('Geolocation');
	const iRanking = col('World Ranking');
	const iCountry = col('Country');
	const iStatus = col('Status');
	const iCareerWins = col('Career Wins');
	const iPhone = col('Phone');
	const iHometown = col('Hometown');
	const iCareerEarnings = col('Career Earnings');
	const iBio = col('Bio');
	const iResidence = col('Residence');
	const iSponsoredBy = col('Sponsored by');
	const iDOB = col('DOB');
	const iNickname = col('Nickname');
	const iHeight = col('Height');
	const iWeight = col('Weight');
	const iInjured = col('Injured');
	const iAvgDrive = col('Average Drive Distance');
	const iCircle1 = col('Circle 1 Percentage');
	const iCircle2 = col('Circle 2 Percentage');
	const iFairway = col('Fairway in Regulation Percentage');
	const iPutt = col('Putt Percentage');
	const iEmergencyContact = col('Emergency Contact');
	const iManagerName = col('Manager/Agent Name');
	const iManagerPhone = col('Manager/Agent Number');
	const iManagerEmail = col('Manager/Agent Email');
	const iInstagram = col('Instagram');
	const iFacebook = col('Facebook');
	const iTwitter = col('Twitter/X');
	const iYouTube = col('YouTube');
	const iTikTok = col('TikTok');
	const iTwitch = col('Twitch:');
	const iWebsite = col('Website/Blog (if applicable)');
	const iYearsPlaying = col('Years Playing Disc Golf');
	const iYearPro = col('Year Turned Professional');
	const iPrimarySponsor = col('Primary Sponsor(s)');
	const iFavoriteDisc = col('Favorite Disc');
	const iSignatureMove = col('Signature Move or Shot');
	const iCareerHighlights = col('Career Highlights');
	const iTournamentsPlayed = col('Number of Tournaments Played');
	const iNotableRecords = col('Notable Records or Milestones');
	const iEducation = col('Education');
	const iOtherSports = col('Other Sports Played');
	const iHobbies = col('Hobbies Outside Disc Golf');
	const iFavoriteDestination = col('Favorite Destination Played');
	const iPersonalMotivation = col('Personal Motivation or Quote');
	const iVideoLinks = col('Video Highlights Links');
	const iInjuryHistory = col('Injury History (if any)');
	const iFitnessRegimen = col('Current Fitness Regimen');
	const iDietaryPreferences = col('Dietary Preferences or Restrictions');
	const iLongTermGoals = col('Long-Term Goals');
	const iMissionStatement = col('Personal Mission Statement in Disc Golf');
	const iPrimaryAirport = col('Primary Airport');
	const iSecondaryAirport = col('Secondary (Alternate) Airport');
	const iFrequentFlyer = col('Frequent Flyer Number(s)');

	const dataRows = records.slice(1).filter((r) => get(r, iName));
	console.log(`Parsed ${dataRows.length} rows from sheet\n`);

	console.log('Authenticating with PocketBase...');
	await pb.collection('_superusers').authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
	console.log('Authenticated\n');

	// Index existing records by lowercased name
	const existing = await pb.collection('talent').getFullList();
	const byName = new Map<string, (typeof existing)[0]>();
	for (const r of existing) {
		byName.set(r.name.trim().toLowerCase(), r);
	}
	console.log(`Found ${existing.length} existing talent records\n`);

	let updated = 0;
	let created = 0;
	let failed = 0;

	// Track names seen to handle duplicates in sheet (e.g. Cole Redalen appears twice)
	const seen = new Set<string>();

	for (const row of dataRows) {
		const rawName = get(row, iName).replace(/,$/, '').trim();
		const key = rawName.toLowerCase();

		// Skip exact duplicate rows (same name seen twice — keep first occurrence)
		if (seen.has(key)) {
			console.log(`  ~ Skipping duplicate row: ${rawName}`);
			continue;
		}
		seen.add(key);

		const statusRaw = get(row, iStatus);
		const { status, talentType } = mapStatus(statusRaw);
		const genderRaw = get(row, iGender).toLowerCase();
		const gender = genderRaw === 'female' ? 'female' : genderRaw === 'male' ? 'male' : '';

		const careerHighlightsRaw = get(row, iCareerHighlights);
		const careerHighlights = stripPlaceholder(careerHighlightsRaw, 'list major tournament wins');

		const educationRaw = get(row, iEducation);
		const education = stripPlaceholder(educationRaw, 'Highest Level');

		const injuredRaw = get(row, iInjured);
		const injured = parseBool(injuredRaw);

		const rankingRaw = get(row, iRanking);
		const worldRanking = rankingRaw ? parseInt(rankingRaw) || null : null;

		const payload: Record<string, unknown> = { talentType, status };

		if (gender) payload.gender = gender;
		if (worldRanking !== null) payload.worldRanking = worldRanking;
		if (injured !== null) payload.injured = injured;

		const textFields: [number, string][] = [
			[iEmail, 'email'],
			[iGeolocation, 'geolocation'],
			[iPhone, 'phone'],
			[iHometown, 'hometown'],
			[iCareerEarnings, 'careerEarnings'],
			[iBio, 'bio'],
			[iResidence, 'residence'],
			[iSponsoredBy, 'sponsoredBy'],
			[iNickname, 'nickname'],
			[iHeight, 'height'],
			[iWeight, 'weight'],
			[iAvgDrive, 'avgDriveDistance'],
			[iCircle1, 'circle1Pct'],
			[iCircle2, 'circle2Pct'],
			[iFairway, 'fairwayPct'],
			[iPutt, 'puttPct'],
			[iEmergencyContact, 'emergencyContact'],
			[iManagerName, 'managerName'],
			[iManagerPhone, 'managerPhone'],
			[iManagerEmail, 'managerEmail'],
			[iInstagram, 'instagram'],
			[iFacebook, 'facebook'],
			[iTwitter, 'twitter'],
			[iYouTube, 'youtube'],
			[iTikTok, 'tiktok'],
			[iTwitch, 'twitch'],
			[iWebsite, 'website'],
			[iPrimarySponsor, 'primarySponsor'],
			[iFavoriteDisc, 'favoriteDisc'],
			[iSignatureMove, 'signatureMove'],
			[iNotableRecords, 'notableRecords'],
			[iOtherSports, 'otherSports'],
			[iHobbies, 'hobbies'],
			[iFavoriteDestination, 'favoriteDestination'],
			[iVideoLinks, 'videoHighlightsLinks'],
			[iInjuryHistory, 'injuryHistory'],
			[iFitnessRegimen, 'fitnessRegimen'],
			[iDietaryPreferences, 'dietaryPreferences'],
			[iPrimaryAirport, 'primaryAirport'],
			[iSecondaryAirport, 'secondaryAirport'],
			[iFrequentFlyer, 'frequentFlyerNumbers'],
			[iCountry, 'country'],
		];

		for (const [idx, field] of textFields) {
			const v = get(row, idx);
			if (v) payload[field] = v;
		}

		// Editor fields (same logic, just noting they accept rich text)
		if (careerHighlights) payload.careerHighlights = careerHighlights;
		if (education) payload.education = education;

		const personalMotivation = get(row, iPersonalMotivation);
		if (personalMotivation) payload.personalMotivation = personalMotivation;
		const longTermGoals = get(row, iLongTermGoals);
		if (longTermGoals) payload.longTermGoals = longTermGoals;
		const missionStatement = get(row, iMissionStatement);
		if (missionStatement) payload.missionStatement = missionStatement;

		// Number fields
		const careerWinsRaw = get(row, iCareerWins);
		if (careerWinsRaw) payload.careerWins = parseNumber(careerWinsRaw);

		const tournamentsRaw = get(row, iTournamentsPlayed);
		if (tournamentsRaw) payload.tournamentsPlayed = parseNumber(tournamentsRaw);

		const yearProRaw = get(row, iYearPro);
		const yearTurnedPro = parseYear(yearProRaw);
		if (yearTurnedPro) payload.yearTurnedPro = yearTurnedPro;

		const yearsPlayingRaw = get(row, iYearsPlaying);
		if (yearsPlayingRaw) payload.yearsPlayingDiscGolf = parseNumber(yearsPlayingRaw);

		// DOB
		const dob = parseDOB(get(row, iDOB));
		if (dob) payload.dateOfBirth = dob;

		const record = byName.get(key);

		try {
			if (record) {
				await pb.collection('talent').update(record.id, payload);
				console.log(`  ✓ Updated: ${rawName} [${statusRaw}]`);
				updated++;
			} else {
				payload.name = rawName;
				await pb.collection('talent').create(payload);
				console.log(`  + Created: ${rawName} [${statusRaw}]`);
				created++;
			}
		} catch (err: any) {
			console.log(`  ✗ Failed [${rawName}]: ${err.message}`);
			failed++;
		}
	}

	console.log('\n--- Summary ---');
	console.log(`  Updated : ${updated}`);
	console.log(`  Created : ${created}`);
	console.log(`  Failed  : ${failed}`);
	console.log(`  Total   : ${dataRows.length}`);
}

run().catch((err) => {
	console.error('Fatal error:', err.message);
	process.exit(1);
});
