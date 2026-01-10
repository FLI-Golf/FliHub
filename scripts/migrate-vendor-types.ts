import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const POCKETBASE_URL = process.env.POCKETBASE_URL;
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

// Vendor categorization mapping
const vendorTypeMapping: Record<string, string> = {
	// Venues
	'Sloan Park': 'venue',
	'Turf Paradise': 'venue',
	'Snapdragon Stadium': 'venue',
	'Chicken Ranch Casino': 'venue',
	'Santa Anita Park': 'venue',
	'Del Mar Race Track': 'venue',
	
	// Product Suppliers
	'GoVision': 'product_supplier',
	'Longines': 'product_supplier',
	'Zuca': 'product_supplier',
	'Big Bully Turf': 'product_supplier',
	
	// Beverages
	'Rat Bastard Energy Drink': 'beverage',
	'Long Drink': 'beverage',
	'Bacardi': 'beverage',
	
	// Technology
	'Udisc': 'technology',
	'Netflix': 'technology',
	'Amazon Prime': 'technology',
	
	// Gaming
	'Prizepicks': 'gaming',
	'Fanduel': 'gaming',
	
	// Service Providers
	'Crash-call-Ash Law firm': 'service_provider',
};

async function migrateVendorTypes() {
	console.log('🚀 Starting vendor type migration...\n');

	if (!POCKETBASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error('❌ Missing environment variables');
		process.exit(1);
	}

	const pb = new PocketBase(POCKETBASE_URL);

	try {
		// Authenticate
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated as admin\n');

		// Fetch all vendors
		const vendors = await pb.collection('vendors').getFullList();
		console.log(`📊 Found ${vendors.length} vendors\n`);

		let updated = 0;
		let skipped = 0;
		let notFound = 0;

		// Update each vendor with type
		for (const vendor of vendors) {
			const vendorName = vendor.name;
			const mappedType = vendorTypeMapping[vendorName];

			if (mappedType) {
				try {
					await pb.collection('vendors').update(vendor.id, {
						type: mappedType
					});
					console.log(`✅ Updated "${vendorName}" → ${mappedType}`);
					updated++;
				} catch (error: any) {
					console.error(`❌ Failed to update "${vendorName}":`, error.message);
				}
			} else {
				console.log(`⚠️  No mapping found for "${vendorName}" - skipping`);
				notFound++;
			}
		}

		console.log('\n📈 Migration Summary:');
		console.log(`   ✅ Updated: ${updated}`);
		console.log(`   ⚠️  Not mapped: ${notFound}`);
		console.log(`   Total vendors: ${vendors.length}`);

		if (notFound > 0) {
			console.log('\n💡 Vendors without type mapping:');
			for (const vendor of vendors) {
				if (!vendorTypeMapping[vendor.name]) {
					console.log(`   - ${vendor.name}`);
				}
			}
			console.log('\nYou can manually update these in PocketBase or add them to the mapping.');
		}

		console.log('\n✅ Migration completed successfully!');
		process.exit(0);
	} catch (error: any) {
		console.error('❌ Migration failed:', error.message || error);
		process.exit(1);
	}
}

migrateVendorTypes();
