import PocketBase from 'pocketbase';
import { config } from 'dotenv';

config();

const url = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const email = process.env.POCKETBASE_ADMIN_EMAIL || '';
const password = process.env.POCKETBASE_ADMIN_PASSWORD || '';

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

async function seed2027Tournaments() {
	console.log('🔄 Seeding 2027 Season Tournaments...\n');
	const pb = new PocketBase(url);

	try {
		await pb.admins.authWithPassword(email, password);
		console.log('✅ Authenticated\n');

		// Progressive prize pools - $4M total across 6 tournaments
		// Last tournament worth the most
		const purses = [500000, 566667, 633333, 700000, 766667, 833333];
		
		const names = [
			'FLI Golf Season Opener',
			'Spring Championship',
			'Mid-Season Classic',
			'Summer Showdown',
			'Fall Invitational',
			'FLI Golf Championship Finals'
		];
		
		const locations = [
			'Austin, TX',
			'Charlotte, NC',
			'Portland, OR',
			'Denver, CO',
			'Nashville, TN',
			'San Diego, CA'
		];

		console.log('2027 Season Structure:');
		console.log('======================\n');

		let totalValidation = 0;

		for (let i = 0; i < 6; i++) {
			const purse = purses[i];
			const name = names[i];
			const location = locations[i];

			// Calculate dates - spread throughout 2027
			const startMonth = 2 + i * 2; // Feb, Apr, Jun, Aug, Oct, Dec
			const startDate = new Date(2027, startMonth - 1, 1);
			const endDate = new Date(2027, startMonth - 1, 3);

			console.log(`Tournament ${i + 1}: ${name}`);
			console.log(`  Location: ${location}`);
			console.log(`  Dates: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
			console.log(`  Total Purse: ${formatCurrency(purse)}`);
			console.log(`  Franchise Cut (20%): ${formatCurrency(purse * 0.2)}`);
			console.log(`  Pro Cut (80%): ${formatCurrency(purse * 0.8)}`);
			console.log('');

			// Check if tournament already exists
			const existing = await pb
				.collection('tournaments')
				.getFirstListItem(`season = 2027 && tournamentNumber = ${i + 1}`)
				.catch(() => null);

			if (existing) {
				console.log(`  ⏭️  Already exists, skipping...\n`);
				totalValidation += purse;
				continue;
			}

			// Create tournament
			await pb.collection('tournaments').create({
				name,
				season: 2027,
				tournamentNumber: i + 1,
				startDate: startDate.toISOString().split('T')[0],
				endDate: endDate.toISOString().split('T')[0],
				location,
				venue: `${location} Disc Golf Complex`,
				prizePool: purse,
				franchiseCutPercentage: 20,
				franchiseCutAmount: purse * 0.2,
				proCutAmount: purse * 0.8,
				status: 'scheduled',
				description: `<p>Tournament ${i + 1} of the 2027 FLI Golf season featuring a ${formatCurrency(purse)} prize pool.</p><p>Progressive payout structure with 20% franchise cut, 80% distributed to pros based on placement.</p><p>Top 3 finishers receive 65% of the pro purse, with remaining 35% distributed across places 4-20.</p>`,
				notes: 'Progressive payout structure with 20% franchise cut. No gender divisions - all pros compete together as teammates with equal pay for equal placement.'
			});

			console.log(`  ✅ Created\n`);
			totalValidation += purse;
		}

		console.log('======================');
		console.log(`Total Season Purse: ${formatCurrency(totalValidation)}`);
		console.log(`Validation: ${totalValidation === 4_000_000 ? '✅ PASS' : '❌ FAIL'}`);
		console.log('\n✅ 2027 season tournaments seeded successfully!');
		
		console.log('\n📊 Payout Structure Summary:');
		console.log('- Progressive scaling: Tournament 1 ($500K) → Tournament 6 ($833K)');
		console.log('- Franchise cut: 20% of total purse');
		console.log('- Pro cut: 80% of total purse');
		console.log('- Top 3 get: 65% of pro cut (30%, 20%, 15%)');
		console.log('- Places 4-20: 35% of pro cut (exponential decay)');
		console.log('- No gender divisions: Equal pay for equal placement');
		
	} catch (error: any) {
		console.error('❌ Error:', error.message);
		if (error.data) {
			console.error('Details:', JSON.stringify(error.data, null, 2));
		}
		process.exit(1);
	}
}

seed2027Tournaments();
