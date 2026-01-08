import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import { collections } from './collections.js';

dotenv.config();

/**
 * Migration: Fix collection schemas
 * 
 * Some collections were created without their schema fields.
 * This migration applies the proper schemas from collections.ts
 */

async function fixCollectionSchemas() {
	const pb = new PocketBase(
		process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app/'
	);

	try {
		// Authenticate
		await pb.admins.authWithPassword(
			process.env.POCKETBASE_ADMIN_EMAIL || 'ddinsmore8@gmail.com',
			process.env.POCKETBASE_ADMIN_PASSWORD || 'MADcap(123)'
		);
		console.log('✅ Authenticated\n');

		// Get existing collections
		const existingCollections = await pb.collections.getFullList();
		
		let updated = 0;
		let skipped = 0;
		let errors = 0;

		for (const schemaCollection of collections) {
			const existing = existingCollections.find((c) => c.name === schemaCollection.name);

			if (!existing) {
				console.log(`⏭️  Skipped: ${schemaCollection.name} (does not exist)`);
				skipped++;
				continue;
			}

			// Check if collection has schema (more than just the id field)
			const fieldCount = existing.fields?.length || 0;
			if (fieldCount > 1) {
				console.log(`⏭️  Skipped: ${schemaCollection.name} (already has schema)`);
				skipped++;
				continue;
			}

			try {
				console.log(`🔄 Updating ${schemaCollection.name} schema...`);

				// PocketBase v0.26+ uses 'fields' instead of 'schema'
				// We need to import the existing fields and append new ones
				const existingFields = existing.fields || [];
				const systemFields = existingFields.filter((f: any) => f.system);
				
				// Convert schema to fields format (without IDs, PocketBase will generate them)
				const newFields = schemaCollection.schema.map((field: any) => ({
					...field,
					system: false,
					hidden: false,
					presentable: false,
					primaryKey: false
				}));
				
				const response = await fetch(`${pb.baseUrl}/api/collections/${existing.id}`, {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						Authorization: pb.authStore.token
					},
					body: JSON.stringify({
						schema: [...systemFields, ...newFields]
					})
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(`Failed to update: ${JSON.stringify(error)}`);
				}

				console.log(`✅ Updated: ${schemaCollection.name}\n`);
				updated++;
			} catch (error: any) {
				console.error(`❌ Error updating ${schemaCollection.name}:`, error.message);
				errors++;
			}
		}

		console.log('\n📊 Migration Summary:');
		console.log(`   Updated: ${updated}`);
		console.log(`   Skipped: ${skipped}`);
		console.log(`   Errors: ${errors}`);

		if (errors === 0) {
			console.log('\n✅ Migration completed successfully!');
		} else {
			console.log('\n⚠️  Migration completed with errors');
		}
	} catch (error: any) {
		console.error('❌ Migration failed:', error.message);
		if (error.data) {
			console.error('Details:', JSON.stringify(error.data, null, 2));
		}
		throw error;
	}
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	fixCollectionSchemas().catch(() => process.exit(1));
}

export { fixCollectionSchemas };
