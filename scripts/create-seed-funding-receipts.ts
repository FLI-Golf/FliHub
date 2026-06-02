/**
 * Creates the seed_funding_receipts collection for tracking gross raise vs.
 * net cash received after commissions, bank fees, and closing costs.
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

async function run() {
	await pb.admins.authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
	console.log('✅ Authenticated');

	if (await collectionExists('seed_funding_receipts')) {
		console.log('⚠️  seed_funding_receipts already exists');
		return;
	}

	await pb.collections.create({
		name: 'seed_funding_receipts',
		type: 'base',
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""',
		fields: [
			{ name: 'grossAmount', type: 'number', required: true, min: 0 },
			{ name: 'netReceived', type: 'number', required: true, min: 0 },
			{ name: 'bankFees', type: 'number', required: false, min: 0 },
			{ name: 'brokerCommission', type: 'number', required: false, min: 0 },
			{ name: 'legalClosingFees', type: 'number', required: false, min: 0 },
			{ name: 'otherDeductions', type: 'number', required: false, min: 0 },
			{ name: 'receivedDate', type: 'date', required: true },
			{ name: 'bankAccount', type: 'text', required: false, max: 255 },
			{ name: 'referenceNumber', type: 'text', required: false, max: 255 },
			{
				name: 'status',
				type: 'select',
				required: true,
				maxSelect: 1,
				values: ['draft', 'received', 'reconciled']
			},
			{ name: 'notes', type: 'text', required: false, max: 2000 },
			{ name: 'attachments', type: 'file', required: false, maxSelect: 5, maxSize: 5242880 },
			{ name: 'recordedBy', type: 'text', required: false, max: 255 }
		]
	});
	console.log('✅ Created seed_funding_receipts');
}

run().catch((err) => {
	console.error('❌ Failed to create seed funding receipts schema:', err?.message ?? err);
	if (err?.data) console.error(JSON.stringify(err.data, null, 2));
	process.exit(1);
});
