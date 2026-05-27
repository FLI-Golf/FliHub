/**
 * Updates talent records from the FLI Golf Google Sheet CSV.
 * Maps all available fields: bio, residence, sponsor, DOB, nickname,
 * height, weight, worldRanking, yearTurnedPro, and more.
 * Announcers are upserted with talentType=['broadcaster'].
 * Existing records are matched by name; new records are created if not found.
 */

import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

dotenv.config();

const SHEET_URL =
	'https://docs.google.com/spreadsheets/d/e/2PACX-1vSbegm0EhWQjiriDC4ueBZZ86cdimXrTdVECDwhAnuF2_lr4xIl_jObxTHYtn-EoA/pub?output=csv';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

function fetchUrl(url: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const client = url.startsWith('https') ? https : http;
		client
			.get(url, (res) => {
				if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
					fetchUrl(res.headers.location).then(resolve).catch(reject);
					return;
				}
				let data = '';
				res.on('data', (chunk) => (data += chunk));
				res.on('end', () => resolve(data));
			})
			.on('error', reject);
	});
}

/** Parse "# 1" -> 1, "Announcer" -> null */
function parseRanking(val: string): number | null {
	const m = val.match(/\d+/);
	return m ? parseInt(m[0]) : null;
}

/** Parse "5/7/2005" -> "2005-05-07 00:00:00.000Z" */
function parseDOB(val: string): string {
	if (!val.trim()) return '';
	const parts = val.split('/');
	if (parts.length !== 3) return '';
	const [m, d, y] = parts.map((p) => p.trim());
	const month = m.padStart(2, '0');
	const day = d.padStart(2, '0');
	return `${y}-${month}-${day} 00:00:00.000Z`;
}

/** Parse year from various formats */
function parseYear(val: string): number {
	const m = val.match(/\d{4}/);
	return m ? parseInt(m[0]) : 0;
}

interface TalentRow {
	name: string;
	gender: 'male' | 'female';
	talentType: string[];
	worldRanking: number | null;
	bio: string;
	residence: string;
	sponsoredBy: string;
	dateOfBirth: string;
	nickname: string;
	height: string;
	weight: string;
	tiktok: string;
	twitch: string;
	website: string;
	yearTurnedPro: number;
	primarySponsor: string;
	favoriteDisc: string;
	signatureMove: string;
	careerHighlights: string;
	tournamentsPlayed: number;
	notableRecords: string;
	education: string;
	otherSports: string;
	hobbies: string;
	favoriteDestination: string;
	personalMotivation: string;
	videoHighlightsLinks: string;
	injuryHistory: string;
	fitnessRegimen: string;
	dietaryPreferences: string;
	longTermGoals: string;
	missionStatement: string;
	primaryAirport: string;
	secondaryAirport: string;
	frequentFlyerNumbers: string;
	signedContract: string;
}

function parseCSV(csvText: string): TalentRow[] {
	const records: string[][] = parse(csvText, { relax_quotes: true, skip_empty_lines: false });
	if (records.length < 2) return [];

	const header = records[0];
	const col = (name: string) => header.findIndex((h) => h.trim() === name);

	const iName = col('Name');
	const iSort = col('Fix Sort');
	const iRanking = col('World Ranking');
	const iBio = col('Bio');
	const iResidence = col('Residence');
	const iSponsoredBy = col('Sponsored by');
	const iDOB = col('DOB');
	const iNickname = col('Nickname');
	const iHeight = col('Height');
	const iWeight = col('Weight');
	const iTikTok = col('TikTok');
	const iTwitch = col('Twitch:');
	const iWebsite = col('Website/Blog (if applicable)');
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
	const iSignedContract = col('Signed Contract');

	const get = (row: string[], idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : '');

	const rows: TalentRow[] = [];
	let currentGender: 'male' | 'female' = 'male';

	for (let i = 1; i < records.length; i++) {
		const row = records[i];
		const name = get(row, iName);
		if (!name) continue;

		// Section headers
		if (name === 'Male') {
			currentGender = 'male';
			continue;
		}
		if (name === 'Female') {
			currentGender = 'female';
			continue;
		}
		if (name === 'Manager' || name === 'Managers') continue;

		const rankingRaw = get(row, iRanking);
		const isAnnouncer = rankingRaw.toLowerCase() === 'announcer';
		const talentType = isAnnouncer ? ['broadcaster'] : ['player'];

		// Skip placeholder career highlights
		const careerHighlightsRaw = get(row, iCareerHighlights);
		const careerHighlights = careerHighlightsRaw.includes('list major tournament wins')
			? ''
			: careerHighlightsRaw;

		const educationRaw = get(row, iEducation);
		const education = educationRaw.includes('Highest Level') ? '' : educationRaw;

		const tournamentsRaw = get(row, iTournamentsPlayed);
		const tournamentsPlayed = tournamentsRaw ? parseInt(tournamentsRaw) || 0 : 0;

		rows.push({
			name: name.replace(/,$/, '').trim(), // strip trailing comma (e.g. "Paul Ulibarri,")
			gender: currentGender,
			talentType,
			worldRanking: parseRanking(rankingRaw),
			bio: get(row, iBio),
			residence: get(row, iResidence),
			sponsoredBy: get(row, iSponsoredBy),
			dateOfBirth: parseDOB(get(row, iDOB)),
			nickname: get(row, iNickname),
			height: get(row, iHeight),
			weight: get(row, iWeight),
			tiktok: get(row, iTikTok),
			twitch: get(row, iTwitch),
			website: get(row, iWebsite),
			yearTurnedPro: parseYear(get(row, iYearPro)),
			primarySponsor: get(row, iPrimarySponsor),
			favoriteDisc: get(row, iFavoriteDisc),
			signatureMove: get(row, iSignatureMove),
			careerHighlights,
			tournamentsPlayed,
			notableRecords: get(row, iNotableRecords),
			education,
			otherSports: get(row, iOtherSports),
			hobbies: get(row, iHobbies),
			favoriteDestination: get(row, iFavoriteDestination),
			personalMotivation: get(row, iPersonalMotivation),
			videoHighlightsLinks: get(row, iVideoLinks),
			injuryHistory: get(row, iInjuryHistory),
			fitnessRegimen: get(row, iFitnessRegimen),
			dietaryPreferences: get(row, iDietaryPreferences),
			longTermGoals: get(row, iLongTermGoals),
			missionStatement: get(row, iMissionStatement),
			primaryAirport: get(row, iPrimaryAirport),
			secondaryAirport: get(row, iSecondaryAirport),
			frequentFlyerNumbers: get(row, iFrequentFlyer),
			signedContract: get(row, iSignedContract)
		});
	}

	return rows;
}

async function run() {
	console.log('Fetching CSV from Google Sheets...');
	const csvText = await fetchUrl(SHEET_URL);
	const rows = parseCSV(csvText);
	console.log(`Parsed ${rows.length} talent rows from sheet\n`);

	console.log('Authenticating with PocketBase...');
	await pb.collection('_superusers').authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
	console.log('Authenticated\n');

	// Load all existing talent records indexed by name
	const existing = await pb.collection('talent').getFullList({ perPage: 500 });
	const byName = new Map<string, (typeof existing)[0]>();
	for (const r of existing) {
		byName.set(r.name.trim().toLowerCase(), r);
	}
	console.log(`Found ${existing.length} existing talent records\n`);

	let updated = 0;
	let created = 0;
	let skipped = 0;

	for (const row of rows) {
		const key = row.name.toLowerCase();
		const record = byName.get(key);

		// Build update payload — only include non-empty values so we don't
		// overwrite existing data with blanks from the sheet
		const payload: Record<string, unknown> = {
			gender: row.gender,
			talentType: row.talentType,
			status: 'active'
		};

		if (row.worldRanking !== null) payload.worldRanking = row.worldRanking;
		if (row.bio) payload.bio = row.bio;
		if (row.residence) payload.residence = row.residence;
		if (row.sponsoredBy) payload.sponsoredBy = row.sponsoredBy;
		if (row.dateOfBirth) payload.dateOfBirth = row.dateOfBirth;
		if (row.nickname) payload.nickname = row.nickname;
		if (row.height) payload.height = row.height;
		if (row.weight) payload.weight = row.weight;
		if (row.tiktok) payload.tiktok = row.tiktok;
		if (row.twitch) payload.twitch = row.twitch;
		if (row.website) payload.website = row.website;
		if (row.yearTurnedPro) payload.yearTurnedPro = row.yearTurnedPro;
		if (row.primarySponsor) payload.primarySponsor = row.primarySponsor;
		if (row.favoriteDisc) payload.favoriteDisc = row.favoriteDisc;
		if (row.signatureMove) payload.signatureMove = row.signatureMove;
		if (row.careerHighlights) payload.careerHighlights = row.careerHighlights;
		if (row.tournamentsPlayed) payload.tournamentsPlayed = row.tournamentsPlayed;
		if (row.notableRecords) payload.notableRecords = row.notableRecords;
		if (row.education) payload.education = row.education;
		if (row.otherSports) payload.otherSports = row.otherSports;
		if (row.hobbies) payload.hobbies = row.hobbies;
		if (row.favoriteDestination) payload.favoriteDestination = row.favoriteDestination;
		if (row.personalMotivation) payload.personalMotivation = row.personalMotivation;
		if (row.videoHighlightsLinks) payload.videoHighlightsLinks = row.videoHighlightsLinks;
		if (row.injuryHistory) payload.injuryHistory = row.injuryHistory;
		if (row.fitnessRegimen) payload.fitnessRegimen = row.fitnessRegimen;
		if (row.dietaryPreferences) payload.dietaryPreferences = row.dietaryPreferences;
		if (row.longTermGoals) payload.longTermGoals = row.longTermGoals;
		if (row.missionStatement) payload.missionStatement = row.missionStatement;
		if (row.primaryAirport) payload.primaryAirport = row.primaryAirport;
		if (row.secondaryAirport) payload.secondaryAirport = row.secondaryAirport;
		if (row.frequentFlyerNumbers) payload.frequentFlyerNumbers = row.frequentFlyerNumbers;
		if (row.signedContract) payload.signedContract = row.signedContract;

		try {
			if (record) {
				await pb.collection('talent').update(record.id, payload);
				console.log(`  ✓ Updated: ${row.name}`);
				updated++;
			} else {
				payload.name = row.name;
				await pb.collection('talent').create(payload);
				console.log(`  + Created: ${row.name}`);
				created++;
			}
		} catch (err: any) {
			console.log(`  ✗ Failed [${row.name}]: ${err.message}`);
			skipped++;
		}
	}

	console.log('\n--- Summary ---');
	console.log(`  Updated : ${updated}`);
	console.log(`  Created : ${created}`);
	console.log(`  Failed  : ${skipped}`);
	console.log(`  Total   : ${rows.length}`);
}

run().catch((err) => {
	console.error('Fatal error:', err.message);
	process.exit(1);
});
