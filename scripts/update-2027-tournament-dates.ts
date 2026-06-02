/**
 * Updates the 2027 tournament schedule to single-day Saturday events.
 *
 * Safe to run multiple times.
 */
import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

const TOURNAMENT_DATES = [
	{ tournamentNumber: 1, date: '2027-04-24' },
	{ tournamentNumber: 2, date: '2027-05-22' },
	{ tournamentNumber: 3, date: '2027-06-26' },
	{ tournamentNumber: 4, date: '2027-07-24' },
	{ tournamentNumber: 5, date: '2027-08-28' },
	{ tournamentNumber: 6, date: '2027-09-25' }
];

async function run() {
	await pb.admins.authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
	console.log('✅ Authenticated');

	for (const item of TOURNAMENT_DATES) {
		const tournament = await pb
			.collection('tournaments')
			.getFirstListItem(`season = 2027 && tournamentNumber = ${item.tournamentNumber}`)
			.catch(() => null);

		if (!tournament) {
			console.log(`⚠️  Tournament #${item.tournamentNumber} not found`);
			continue;
		}

		await pb.collection('tournaments').update(tournament.id, {
			startDate: item.date,
			endDate: item.date
		});
		console.log(`✅ Tournament #${item.tournamentNumber}: ${item.date}`);
	}
}

run().catch((err) => {
	console.error('❌ Failed to update 2027 tournament dates:', err?.message ?? err);
	if (err?.data) console.error(JSON.stringify(err.data, null, 2));
	process.exit(1);
});
