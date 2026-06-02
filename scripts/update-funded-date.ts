/**
 * Pushes the funded date from June 15, 2026 to June 30, 2026 in live records.
 *
 * Safe to run multiple times. It only updates exact date/string references.
 */
import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

const OLD_DATE = '2026-06-15';
const NEW_DATE = '2026-06-30';
const OLD_LABEL = 'June 15, 2026';
const NEW_LABEL = 'June 30, 2026';

function replaceFundedText(value: unknown): unknown {
	if (typeof value !== 'string') return value;
	return value
		.replaceAll(OLD_DATE, NEW_DATE)
		.replaceAll(OLD_LABEL, NEW_LABEL)
		.replaceAll('Jun 15', 'Jun 30');
}

async function updateDateFields(collection: string, fields: string[]) {
	const records = await pb.collection(collection).getFullList({ batch: 500 });
	let count = 0;

	for (const record of records as any[]) {
		const patch: Record<string, unknown> = {};
		for (const field of fields) {
			const next = replaceFundedText(record[field]);
			if (next !== record[field]) patch[field] = next;
		}

		if (Object.keys(patch).length) {
			await pb.collection(collection).update(record.id, patch);
			count++;
		}
	}

	console.log(`✅ ${collection}: updated ${count} records`);
}

async function run() {
	await pb.admins.authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
	console.log('✅ Authenticated');

	await updateDateFields('projects', ['startDate', 'endDate', 'description', 'notes']);
	await updateDateFields('tasks', ['startDate', 'dueDate', 'description', 'notes', 'subTasksChecklist']);
	await updateDateFields('fgl_funding_model', ['label', 'notes']);
}

run().catch((err) => {
	console.error('❌ Failed to update funded date:', err?.message ?? err);
	if (err?.data) console.error(JSON.stringify(err.data, null, 2));
	process.exit(1);
});
