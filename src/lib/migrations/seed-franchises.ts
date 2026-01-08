import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seed franchises with initial data and assign pros (1 male + 1 female each)
 */

interface FranchiseData {
	name: string;
	slug: string;
	tagline: string;
	primaryColor: string;
	secondaryColor: string;
	territory: string;
	status: string;
	franchiseFee: number;
	royaltyPercentage: number;
	marketingFeePercentage: number;
	targetSaleDate: string;
	priority: number;
}

const franchiseData: FranchiseData[] = [
	{
		name: 'Hyzer Heroes',
		slug: 'hyzer-heroes',
		tagline: 'Masters of the Fade',
		primaryColor: '#1E40AF', // Blue
		secondaryColor: '#FBBF24', // Gold
		territory: 'Northeast United States',
		status: 'available',
		franchiseFee: 250000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2027-06-01',
		priority: 1
	},
	{
		name: 'Huk-a-Mania',
		slug: 'huk-a-mania',
		tagline: 'Unleash the Power',
		primaryColor: '#DC2626', // Red
		secondaryColor: '#000000', // Black
		territory: 'Southeast United States',
		status: 'available',
		franchiseFee: 250000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2027-07-01',
		priority: 2
	},
	{
		name: 'Flight Squad',
		slug: 'flight-squad',
		tagline: 'Precision in Motion',
		primaryColor: '#7C3AED', // Purple
		secondaryColor: '#F59E0B', // Amber
		territory: 'Midwest United States',
		status: 'available',
		franchiseFee: 250000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2027-08-01',
		priority: 3
	},
	{
		name: 'Birdie Storm',
		slug: 'birdie-storm',
		tagline: 'Raining Birdies',
		primaryColor: '#059669', // Green
		secondaryColor: '#FFFFFF', // White
		territory: 'Pacific Northwest',
		status: 'available',
		franchiseFee: 250000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2027-09-01',
		priority: 4
	},
	{
		name: 'Chain Breakers',
		slug: 'chain-breakers',
		tagline: 'Breaking Through',
		primaryColor: '#EA580C', // Orange
		secondaryColor: '#1F2937', // Dark Gray
		territory: 'Southwest United States',
		status: 'available',
		franchiseFee: 250000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2027-10-01',
		priority: 5
	},
	{
		name: 'Disc Jesters',
		slug: 'disc-jesters',
		tagline: 'Fun Meets Competition',
		primaryColor: '#EC4899', // Pink
		secondaryColor: '#8B5CF6', // Purple
		territory: 'Rocky Mountain Region',
		status: 'available',
		franchiseFee: 250000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2027-11-01',
		priority: 6
	},
	{
		name: 'Midas Touch',
		slug: 'midas-touch',
		tagline: 'Everything We Touch Turns Gold',
		primaryColor: '#F59E0B', // Gold
		secondaryColor: '#78350F', // Brown
		territory: 'California',
		status: 'available',
		franchiseFee: 300000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2027-12-01',
		priority: 7
	},
	{
		name: 'Chain Seekers',
		slug: 'chain-seekers',
		tagline: 'Always Finding the Basket',
		primaryColor: '#0891B2', // Cyan
		secondaryColor: '#F97316', // Orange
		territory: 'Great Lakes Region',
		status: 'available',
		franchiseFee: 250000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2028-01-01',
		priority: 8
	},
	{
		name: 'Fairway Bombers',
		slug: 'fairway-bombers',
		tagline: 'Distance is Our Game',
		primaryColor: '#DC2626', // Red
		secondaryColor: '#FBBF24', // Yellow
		territory: 'Texas',
		status: 'available',
		franchiseFee: 275000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2028-02-01',
		priority: 9
	},
	{
		name: 'Disc Dynasty',
		slug: 'disc-dynasty',
		tagline: 'Building a Legacy',
		primaryColor: '#7C3AED', // Purple
		secondaryColor: '#FBBF24', // Gold
		territory: 'Mid-Atlantic',
		status: 'available',
		franchiseFee: 250000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2028-03-01',
		priority: 10
	},
	{
		name: 'Ace Makers',
		slug: 'ace-makers',
		tagline: 'Perfection Every Throw',
		primaryColor: '#10B981', // Emerald
		secondaryColor: '#FFFFFF', // White
		territory: 'Florida',
		status: 'available',
		franchiseFee: 275000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2028-04-01',
		priority: 11
	},
	{
		name: 'Glide Masters',
		slug: 'glide-masters',
		tagline: 'Smooth and Steady',
		primaryColor: '#6366F1', // Indigo
		secondaryColor: '#F472B6', // Pink
		territory: 'New England',
		status: 'available',
		franchiseFee: 250000,
		royaltyPercentage: 6,
		marketingFeePercentage: 2,
		targetSaleDate: '2028-05-01',
		priority: 12
	}
];

async function seedFranchises() {
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
		const allPros = await pb.collection('pros').getFullList();
		const malePros = allPros.filter(p => p.gender === 'male');
		const femalePros = allPros.filter(p => p.gender === 'female');
		
		console.log(`📋 Found ${malePros.length} male pros and ${femalePros.length} female pros\n`);

		// Shuffle arrays for random assignment
		const shuffledMales = [...malePros].sort(() => Math.random() - 0.5);
		const shuffledFemales = [...femalePros].sort(() => Math.random() - 0.5);

		let created = 0;
		let skipped = 0;
		let errors = 0;

		for (let i = 0; i < franchiseData.length; i++) {
			const franchise = franchiseData[i];
			
			try {
				// Check if franchise already exists
				const existing = await pb.collection('franchises').getFullList({
					filter: `slug = "${franchise.slug}"`
				});

				if (existing.length > 0) {
					console.log(`⏭️  ${franchise.name}: Already exists`);
					skipped++;
					continue;
				}

				// Assign pros (1 male + 1 female)
				const malePro = shuffledMales[i % shuffledMales.length];
				const femalePro = shuffledFemales[i % shuffledFemales.length];

				// Create franchise
				const franchiseRecord = await pb.collection('franchises').create({
					...franchise,
					malePro: malePro?.id,
					femalePro: femalePro?.id,
					description: `<p>${franchise.tagline}</p><p>Representing ${franchise.territory}, the ${franchise.name} are ready to dominate the disc golf scene.</p>`,
					estimatedRevenue: franchise.franchiseFee * 0.15, // Estimate 15% annual revenue
					primaryMarket: franchise.territory,
					targetDemographic: 'Disc golf enthusiasts, ages 18-45, active lifestyle',
					contractTerm: 10 // 10-year initial term
				});

				console.log(`✅ Created: ${franchise.name}`);
				console.log(`   Male Pro: ${malePro?.name || 'None'}`);
				console.log(`   Female Pro: ${femalePro?.name || 'None'}`);
				console.log(`   Territory: ${franchise.territory}`);
				console.log(`   Franchise Fee: $${franchise.franchiseFee.toLocaleString()}`);
				console.log('');

				created++;

			} catch (error: any) {
				console.error(`❌ Error creating ${franchise.name}:`, error.message);
				if (error.data) {
					console.error('   Details:', JSON.stringify(error.data, null, 2));
				}
				errors++;
			}
		}

		console.log('\n📊 Seeding Summary:');
		console.log(`   Created: ${created}`);
		console.log(`   Skipped: ${skipped}`);
		console.log(`   Errors: ${errors}`);
		console.log('\n✅ Franchise seeding completed!');
		
		// Display franchise roster
		console.log('\n🏆 Franchise Roster:\n');
		const franchises = await pb.collection('franchises').getFullList({
			expand: 'malePro,femalePro',
			sort: 'priority'
		});

		franchises.forEach((f: any) => {
			console.log(`${f.name} (${f.territory})`);
			console.log(`  Male: ${f.expand?.malePro?.name || 'Unassigned'}`);
			console.log(`  Female: ${f.expand?.femalePro?.name || 'Unassigned'}`);
			console.log(`  Fee: $${f.franchiseFee?.toLocaleString() || '0'}`);
			console.log('');
		});
		
	} catch (error: any) {
		console.error('❌ Seeding failed:', error.message);
		throw error;
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	seedFranchises().catch(() => process.exit(1));
}

export { seedFranchises };
