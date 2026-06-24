import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const UNIQUE_INDEX_NAME = 'idx_work_orders_work_order_number_unique';
const UNIQUE_INDEX_SQL =
	'CREATE UNIQUE INDEX idx_work_orders_work_order_number_unique ON work_orders (work_order_number) WHERE work_order_number IS NOT NULL AND work_order_number != ""';

async function addWorkOrderNumberUniqueIndex() {
	const apply = process.argv.includes('--apply');
	let url = process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app';
	url = url.replace(/\/$/, '');

	const email = process.env.POCKETBASE_ADMIN_EMAIL;
	const password = process.env.POCKETBASE_ADMIN_PASSWORD;
	if (!email || !password) {
		throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in .env');
	}

	const pb = new PocketBase(url);
	console.log(`Connecting to ${url}...`);
	await (pb as any).admins.authWithPassword(email, password);
	console.log('Authenticated');

	const collections = await pb.collections.getFullList();
	const workOrders = collections.find((c: any) => c.name === 'work_orders');
	if (!workOrders) {
		throw new Error('work_orders collection not found');
	}

	const indexes: string[] = Array.isArray((workOrders as any).indexes) ? [...(workOrders as any).indexes] : [];
	const hasUniqueIndex = indexes.some((idx) => idx.includes(UNIQUE_INDEX_NAME));

	const rows = await pb.collection('work_orders').getFullList({
		fields: 'id,work_order_number',
	});

	const seen = new Map<string, string>();
	const duplicates: Array<{ number: string; firstId: string; duplicateId: string }> = [];

	for (const row of rows as any[]) {
		const wo = String(row.work_order_number || '').trim();
		if (!wo) continue;
		const firstId = seen.get(wo);
		if (!firstId) {
			seen.set(wo, row.id);
			continue;
		}
		duplicates.push({ number: wo, firstId, duplicateId: row.id });
	}

	if (duplicates.length > 0) {
		console.error(`Found ${duplicates.length} duplicate non-empty work_order_number values. Cannot add unique index.`);
		for (const d of duplicates.slice(0, 20)) {
			console.error(`  ${d.number}: ${d.firstId} and ${d.duplicateId}`);
		}
		if (duplicates.length > 20) {
			console.error(`  ...and ${duplicates.length - 20} more`);
		}
		process.exit(1);
	}

	if (hasUniqueIndex) {
		console.log('Unique index already exists. No changes needed.');
		return;
	}

	console.log('Unique index is missing and no duplicates were found.');
	if (!apply) {
		console.log('Dry run only. Re-run with --apply to update PocketBase schema.');
		console.log(`Would add index:\n  ${UNIQUE_INDEX_SQL}`);
		return;
	}

	indexes.push(UNIQUE_INDEX_SQL);
	await pb.collections.update((workOrders as any).id, { indexes });
	console.log('Added unique partial index on work_orders.work_order_number');
}

addWorkOrderNumberUniqueIndex().catch((err) => {
	console.error('Migration failed:', err?.message || err);
	process.exit(1);
});
