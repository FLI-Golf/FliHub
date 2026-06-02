/**
 * Creates the talent_groups collection and adds group-aware booking fields to
 * event_talent/event_payments.
 *
 * Safe to run multiple times.
 */
import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function collectionExists(name: string): Promise<boolean> {
	try {
		await pb.collections.getOne(name);
		return true;
	} catch {
		return false;
	}
}

function fieldNames(collection: any): string[] {
	return (collection.fields ?? collection.schema ?? []).map((field: any) => field.name);
}

async function updateFields(collectionName: string, additions: any[]) {
	const collection = await pb.collections.getOne(collectionName);
	const existing = fieldNames(collection);
	const missing = additions.filter((field) => !existing.includes(field.name));
	if (missing.length === 0) {
		console.log(`⚠️  ${collectionName} already has requested fields`);
		return;
	}

	await pb.collections.update(collection.id, {
		fields: [...(collection.fields ?? collection.schema ?? []), ...missing]
	});
	console.log(`✅ Added ${missing.map((field) => field.name).join(', ')} to ${collectionName}`);
}

async function setRequired(collectionName: string, fieldName: string, required: boolean) {
	const collection = await pb.collections.getOne(collectionName);
	const fields = collection.fields ?? collection.schema ?? [];
	const field = fields.find((item: any) => item.name === fieldName);
	if (!field || field.required === required) return;

	await pb.collections.update(collection.id, {
		fields: fields.map((item: any) => item.name === fieldName ? { ...item, required } : item)
	});
	console.log(`✅ Set ${collectionName}.${fieldName} required=${required}`);
}

async function run() {
	await pb.admins.authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
	console.log('✅ Authenticated');

	const talentCollection = await pb.collections.getOne('talent');

	if (await collectionExists('talent_groups')) {
		console.log('⚠️  talent_groups already exists');
	} else {
		await pb.collections.create({
			name: 'talent_groups',
			type: 'base',
			listRule: '@request.auth.id != ""',
			viewRule: '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.id != ""',
			deleteRule: '@request.auth.id != ""',
			fields: [
				{ name: 'name', type: 'text', required: true, max: 255 },
				{
					name: 'groupType',
					type: 'select',
					required: true,
					maxSelect: 1,
					values: ['band', 'music_group', 'celebrity_group', 'performance_act', 'agency_roster', 'other']
				},
				{ name: 'primaryContactName', type: 'text', required: false, max: 255 },
				{ name: 'primaryContactEmail', type: 'email', required: false },
				{ name: 'primaryContactPhone', type: 'text', required: false, max: 80 },
				{
					name: 'members',
					type: 'relation',
					required: false,
					collectionId: talentCollection.id,
					cascadeDelete: false,
					maxSelect: 50
				},
				{ name: 'memberCount', type: 'number', required: false, min: 0 },
				{ name: 'defaultFee', type: 'number', required: false, min: 0 },
				{ name: 'notes', type: 'text', required: false, max: 2000 }
			]
		});
		console.log('✅ Created talent_groups');
	}

	const groupCollection = await pb.collections.getOne('talent_groups');

	await updateFields('event_talent', [
		{
			name: 'bookingEntityType',
			type: 'select',
			required: false,
			maxSelect: 1,
			values: ['individual', 'group']
		},
		{
			name: 'talentGroup',
			type: 'relation',
			required: false,
			collectionId: groupCollection.id,
			cascadeDelete: false,
			maxSelect: 1
		}
	]);
	await setRequired('event_talent', 'talent', false);

	await updateFields('event_payments', [
		{
			name: 'talentGroup',
			type: 'relation',
			required: false,
			collectionId: groupCollection.id,
			cascadeDelete: false,
			maxSelect: 1
		}
	]);
	await setRequired('event_payments', 'talent', false);
}

run().catch((err) => {
	console.error('❌ Failed to create talent group schema:', err?.message ?? err);
	if (err?.data) console.error(JSON.stringify(err.data, null, 2));
	process.exit(1);
});
