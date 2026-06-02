/**
 * Adds department/project ownership to content_production and lets tasks attach
 * directly to a content production item.
 *
 * Safe to run multiple times.
 */
import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

function fieldsFor(collection: any): any[] {
	return collection.fields ?? collection.schema ?? [];
}

function fieldNames(collection: any): string[] {
	return fieldsFor(collection).map((field: any) => field.name);
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
		fields: [...fieldsFor(collection), ...missing]
	});
	console.log(`✅ Added ${missing.map((field) => field.name).join(', ')} to ${collectionName}`);
}

async function run() {
	await pb.admins.authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
	console.log('✅ Authenticated');

	const departments = await pb.collections.getOne('departments');
	const projects = await pb.collections.getOne('projects');
	const contentProduction = await pb.collections.getOne('content_production');

	await updateFields('content_production', [
		{
			name: 'department',
			type: 'relation',
			required: false,
			collectionId: departments.id,
			cascadeDelete: false,
			maxSelect: 1
		},
		{
			name: 'project',
			type: 'relation',
			required: false,
			collectionId: projects.id,
			cascadeDelete: false,
			maxSelect: 1
		}
	]);

	await updateFields('tasks', [
		{
			name: 'contentProductionId',
			type: 'relation',
			required: false,
			collectionId: contentProduction.id,
			cascadeDelete: false,
			maxSelect: 1
		}
	]);
}

run().catch((err) => {
	console.error('❌ Failed to update content production workflow schema:', err?.message ?? err);
	if (err?.data) console.error(JSON.stringify(err.data, null, 2));
	process.exit(1);
});
