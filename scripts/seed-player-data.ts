import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function seedPlayerData() {
	console.log('🌱 Seeding player data...\n');

	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL!,
			process.env.POCKETBASE_ADMIN_PASSWORD!
		);
		console.log('✓ Authenticated as admin\n');

		// Check if collection exists
		try {
			await pb.collection('pros').getList(1, 1);
			console.log('✓ Pros collection exists');
		} catch (err) {
			console.log('⚠️  Pros collection does not exist - skipping player seeding');
			return;
		}

		// Seed Pro Players
		console.log('\n🏌️ Seeding Pro Players...');
		const players = [
			{
				name: 'Paul McBeth',
				nickname: 'McBeast',
				worldRanking: 1,
				country: 'United States',
				residence: 'North Carolina, USA',
				bio: 'Six-time PDGA World Champion and one of the most dominant players in disc golf history.',
				gender: 'male',
				status: 'active',
				yearTurnedPro: 2008,
				primarySponsor: 'Discraft',
				favoriteDisc: 'Luna',
				signatureMove: 'Forehand roller',
				careerHighlights: '6x World Champion, 5x USDGC Champion',
				tournamentsPlayed: 450,
				signedContract: true
			},
			{
				name: 'Ricky Wysocki',
				nickname: 'Sockibomb',
				worldRanking: 2,
				country: 'United States',
				residence: 'South Carolina, USA',
				bio: 'Two-time World Champion known for his powerful drives and competitive spirit.',
				gender: 'male',
				status: 'active',
				yearTurnedPro: 2009,
				primarySponsor: 'Dynamic Discs',
				favoriteDisc: 'Judge',
				signatureMove: 'Massive distance drives',
				careerHighlights: '2x World Champion, Multiple Major wins',
				tournamentsPlayed: 420,
				signedContract: true
			},
			{
				name: 'Paige Pierce',
				nickname: 'Fierce Pierce',
				worldRanking: 1,
				country: 'United States',
				residence: 'Texas, USA',
				bio: 'Five-time World Champion and the most dominant female player in disc golf.',
				gender: 'female',
				status: 'active',
				yearTurnedPro: 2011,
				primarySponsor: 'Discraft',
				favoriteDisc: 'Luna',
				signatureMove: 'Consistent accuracy',
				careerHighlights: '5x World Champion, Multiple Major wins',
				tournamentsPlayed: 380,
				signedContract: true
			},
			{
				name: 'Catrina Allen',
				nickname: 'Cat',
				worldRanking: 3,
				country: 'United States',
				residence: 'Utah, USA',
				bio: 'Two-time World Champion known for her mental toughness and clutch performances.',
				gender: 'female',
				status: 'active',
				yearTurnedPro: 2012,
				primarySponsor: 'Prodigy',
				favoriteDisc: 'PA-3',
				signatureMove: 'Pressure putting',
				careerHighlights: '2x World Champion, USDGC Champion',
				tournamentsPlayed: 350,
				signedContract: true
			},
			{
				name: 'Eagle McMahon',
				nickname: 'Eagle',
				worldRanking: 5,
				country: 'United States',
				residence: 'Colorado, USA',
				bio: 'Young phenom with incredible distance and technical skill.',
				gender: 'male',
				status: 'active',
				yearTurnedPro: 2013,
				primarySponsor: 'Discmania',
				favoriteDisc: 'P2',
				signatureMove: 'Forehand bombs',
				careerHighlights: 'World Champion, Multiple Major wins',
				tournamentsPlayed: 280,
				signedContract: true
			},
			{
				name: 'Simon Lizotte',
				nickname: 'Eagle Eye',
				worldRanking: 8,
				country: 'Germany',
				residence: 'California, USA',
				bio: 'German star known for his incredible distance and trick shots.',
				gender: 'male',
				status: 'active',
				yearTurnedPro: 2011,
				primarySponsor: 'Discmania',
				favoriteDisc: 'P2',
				signatureMove: 'Distance drives',
				careerHighlights: 'European Champion, Multiple tour wins',
				tournamentsPlayed: 320,
				signedContract: true
			},
			{
				name: 'Kristin Tattar',
				nickname: 'KT',
				worldRanking: 2,
				country: 'Estonia',
				residence: 'Estonia',
				bio: 'Estonian star dominating the FPO division with consistent excellence.',
				gender: 'female',
				status: 'active',
				yearTurnedPro: 2010,
				primarySponsor: 'Latitude 64',
				favoriteDisc: 'Pure',
				signatureMove: 'Smooth form',
				careerHighlights: 'Multiple Major wins, European Champion',
				tournamentsPlayed: 300,
				signedContract: true
			},
			{
				name: 'Calvin Heimburg',
				nickname: 'Calvin',
				worldRanking: 4,
				country: 'United States',
				residence: 'Florida, USA',
				bio: 'Known for his incredible accuracy and consistent play.',
				gender: 'male',
				status: 'active',
				yearTurnedPro: 2014,
				primarySponsor: 'Innova',
				favoriteDisc: 'Destroyer',
				signatureMove: 'Laser-straight drives',
				careerHighlights: 'Multiple Major wins, Tour Championship',
				tournamentsPlayed: 250,
				signedContract: true
			},
			{
				name: 'Nate Sexton',
				nickname: 'Sexton',
				worldRanking: 15,
				country: 'United States',
				residence: 'Oregon, USA',
				bio: 'Veteran player and popular commentator known for his firebird shots.',
				gender: 'male',
				status: 'active',
				yearTurnedPro: 2007,
				primarySponsor: 'Innova',
				favoriteDisc: 'Firebird',
				signatureMove: 'Firebird flex shots',
				careerHighlights: 'Multiple tour wins, Commentator',
				tournamentsPlayed: 400,
				signedContract: true
			},
			{
				name: 'Eveliina Salonen',
				nickname: 'Eveliina',
				worldRanking: 5,
				country: 'Finland',
				residence: 'Finland',
				bio: 'Finnish rising star making waves in the FPO division.',
				gender: 'female',
				status: 'active',
				yearTurnedPro: 2016,
				primarySponsor: 'Discmania',
				favoriteDisc: 'P2',
				signatureMove: 'Consistent putting',
				careerHighlights: 'European Champion, Multiple tour wins',
				tournamentsPlayed: 180,
				signedContract: true
			},
			{
				name: 'Ken Climo',
				nickname: 'The Champ',
				worldRanking: null,
				country: 'United States',
				residence: 'Florida, USA',
				bio: 'Legendary 12-time World Champion, now retired from competitive play.',
				gender: 'male',
				status: 'retired',
				yearTurnedPro: 1986,
				primarySponsor: 'Innova',
				favoriteDisc: 'Aviar',
				signatureMove: 'Putting mastery',
				careerHighlights: '12x World Champion, Hall of Fame',
				tournamentsPlayed: 600,
				signedContract: false
			},
			{
				name: 'Juliana Korver',
				nickname: 'Juli',
				worldRanking: null,
				country: 'United States',
				residence: 'California, USA',
				bio: 'Four-time World Champion, now retired from competitive play.',
				gender: 'female',
				status: 'retired',
				yearTurnedPro: 2003,
				primarySponsor: 'Innova',
				favoriteDisc: 'Aviar',
				signatureMove: 'Smooth putting',
				careerHighlights: '4x World Champion, Hall of Fame',
				tournamentsPlayed: 350,
				signedContract: false
			}
		];

		for (const player of players) {
			try {
				await pb.collection('pros').create(player);
				console.log(`  ✓ Created player: ${player.name} (${player.country})`);
			} catch (err: any) {
				console.log(`  ✗ Failed to create player ${player.name}:`, err.message);
			}
		}

		console.log('\n✅ Player data seeding completed!\n');
		console.log('Summary:');
		console.log(`  - ${players.length} players created`);
		console.log(`  - ${players.filter(p => p.status === 'active').length} active players`);
		console.log(`  - ${players.filter(p => p.status === 'retired').length} retired players`);
		console.log(`  - ${players.filter(p => p.gender === 'male').length} male players`);
		console.log(`  - ${players.filter(p => p.gender === 'female').length} female players`);
		console.log(`  - ${players.filter(p => p.signedContract).length} with contracts`);
		console.log(`  - ${players.filter(p => p.worldRanking && p.worldRanking <= 100).length} in top 100`);

	} catch (error: any) {
		console.error('❌ Error seeding player data:', error.message);
		process.exit(1);
	}
}

seedPlayerData();
