import PocketBase from 'pocketbase';
import { collections } from './collections';

/**
 * Migration script to create/update PocketBase collections
 * 
 * Usage:
 *   npm run migrate -- --url=https://your-pocketbase.com --email=admin@example.com --password=yourpassword
 */

interface MigrationOptions {
	url: string;
	email: string;
	password: string;
	dryRun?: boolean;
}

export async function migrate(options: MigrationOptions) {
	const { url, email, password, dryRun = false } = options;

	console.log(`🔄 Connecting to PocketBase at ${url}...`);
	const pb = new PocketBase(url);

	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(email, password);
		console.log('✅ Authenticated successfully\n');

		// Get existing collections
		const existingCollections = await pb.collections.getFullList();
		const existingNames = new Set(existingCollections.map((c) => c.name));

		console.log(`📊 Found ${existingCollections.length} existing collections\n`);

		// Process each collection
		for (const collection of collections) {
			const exists = existingNames.has(collection.name);

			if (dryRun) {
				console.log(
					`[DRY RUN] Would ${exists ? 'update' : 'create'} collection: ${collection.name}`
				);
				continue;
			}

			try {
				if (exists) {
					console.log(`🔄 Updating collection: ${collection.name}`);
					const existing = existingCollections.find((c) => c.name === collection.name);
					if (existing) {
						await pb.collections.update(existing.id, collection as any);
						console.log(`✅ Updated: ${collection.name}\n`);
					}
				} else {
					console.log(`➕ Creating collection: ${collection.name}`);
					await pb.collections.create(collection as any);
					console.log(`✅ Created: ${collection.name}\n`);
				}
			} catch (error: any) {
				console.error(`❌ Error processing ${collection.name}:`, error.message);
				if (error.data) {
					console.error('Details:', JSON.stringify(error.data, null, 2));
				}
			}
		}

		console.log('\n✅ Migration completed successfully!');
	} catch (error: any) {
		console.error('❌ Migration failed:', error.message);
		if (error.data) {
			console.error('Details:', JSON.stringify(error.data, null, 2));
		}
		throw error;
	}
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);
	const options: Partial<MigrationOptions> = {};

	args.forEach((arg) => {
		const [key, value] = arg.split('=');
		const cleanKey = key.replace('--', '');
		if (cleanKey === 'dry-run') {
			options.dryRun = true;
		} else {
			(options as any)[cleanKey] = value;
		}
	});

	if (!options.url || !options.email || !options.password) {
		console.error('❌ Missing required arguments');
		console.log('\nUsage:');
		console.log(
			'  npm run migrate -- --url=https://your-pocketbase.com --email=admin@example.com --password=yourpassword'
		);
		console.log('\nOptions:');
		console.log('  --dry-run    Show what would be done without making changes');
		process.exit(1);
	}

	migrate(options as MigrationOptions).catch(() => process.exit(1));
}
