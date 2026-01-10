import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const POCKETBASE_URL = process.env.POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

const vendors = [
	// Venues
	{ name: 'Sloan Park', type: 'venue', active: true },
	{ name: 'Turf Paradise', type: 'venue', active: true },
	{ name: 'Snapdragon Stadium', type: 'venue', active: true },
	{ name: 'Chicken Ranch Casino', type: 'venue', active: true },
	{ name: 'Santa Anita Park', type: 'venue', active: true },
	{ name: 'Del Mar Race Track', type: 'venue', active: true },
	
	// Product Suppliers
	{ name: 'GoVision', type: 'product_supplier', active: true },
	{ name: 'Longines', type: 'product_supplier', active: true },
	{ name: 'Zuca', type: 'product_supplier', active: true },
	{ name: 'Big Bully Turf', type: 'product_supplier', active: true },
	
	// Beverages
	{ name: 'Rat Bastard Energy Drink', type: 'beverage', active: true },
	{ name: 'Long Drink', type: 'beverage', active: true },
	{ name: 'Bacardi', type: 'beverage', active: true },
	
	// Technology
	{ name: 'Udisc', type: 'technology', active: true },
	{ name: 'Netflix', type: 'technology', active: true },
	{ name: 'Amazon Prime', type: 'technology', active: true },
	
	// Gaming
	{ name: 'Prizepicks', type: 'gaming', active: true },
	{ name: 'Fanduel', type: 'gaming', active: true },
	
	// Service Providers
	{ name: 'Crash-call-Ash Law firm', type: 'service_provider', active: true }
];

async function seedVendors() {
	console.log('🌱 Starting vendor seeding...\n');

	if (!POCKETBASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('❌ Missing environment variables');
		process.exit(1);
	}

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		// Authenticate
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated as admin\n');

		let created = 0;
		let skipped = 0;
		let failed = 0;

		console.log(`📊 Seeding ${vendors.length} vendors...\n`);

		for (const vendor of vendors) {
			try {
				// Check if vendor already exists
				const existing = await pb.collection('vendors').getFullList({
					filter: `name = "${vendor.name}"`
				});

				if (existing.length > 0) {
					console.log(`⚠️  Skipped "${vendor.name}" - already exists`);
					skipped++;
					continue;
				}

				// Create vendor
				await pb.collection('vendors').create(vendor);
				console.log(`✅ Created "${vendor.name}" (${vendor.type})`);
				created++;
			} catch (error: any) {
				console.error(`❌ Failed to create "${vendor.name}":`, error.message);
				failed++;
			}
		}

		console.log('\n📈 Seeding Summary:');
		console.log(`   ✅ Created: ${created}`);
		console.log(`   ⚠️  Skipped: ${skipped}`);
		console.log(`   ❌ Failed: ${failed}`);
		console.log(`   Total: ${vendors.length}`);

		console.log('\n✅ Vendor seeding completed!');
		process.exit(0);
	} catch (error: any) {
		console.error('❌ Seeding failed:', error.message || error);
		process.exit(1);
	}
}

seedVendors();
