/**
 * Adds franchiseTrackStatus and franchiseTrackDate fields to the sponsors collection.
 * Safe to run multiple times — skips fields that already exist.
 */
import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function run() {
	await pb.admins.authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
	console.log('✅ Authenticated');

	// Fetch the existing sponsors collection
	const collection = await pb.collections.getOne('sponsors');
	const existingFields = (collection.schema ?? []).map((f: any) => f.name);
	console.log('Existing fields:', existingFields.join(', '));

	const newFields: any[] = [];

	if (!existingFields.includes('franchiseTrackStatus')) {
		newFields.push({
			name: 'franchiseTrackStatus',
			type: 'select',
			required: false,
			options: {
				maxSelect: 1,
				values: ['franchise_interest', 'discovery_call', 'loi_signed', 'due_diligence', 'contract', 'closed']
			}
		});
	}

	if (!existingFields.includes('franchiseTrackDate')) {
		newFields.push({
			name: 'franchiseTrackDate',
			type: 'date',
			required: false
		});
	}

	if (newFields.length === 0) {
		console.log('✅ All fields already exist — nothing to do');
		return;
	}

	await pb.collections.update(collection.id, {
		schema: [...(collection.schema ?? []), ...newFields]
	});

	console.log(`✅ Added fields: ${newFields.map(f => f.name).join(', ')}`);
}

run().catch(err => { console.error('❌', err); process.exit(1); });
