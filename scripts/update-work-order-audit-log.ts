import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

const COLLECTION = 'work_order_audit_log';

const WORK_ORDER_AUDIT_FIELDS = [
	{ name: 'workOrderId', type: 'text', required: true, options: { min: 1, max: 32 } },
	{ name: 'workOrderNumber', type: 'text', required: false, options: { max: 80 } },
	{
		name: 'action',
		type: 'select',
		required: true,
		maxSelect: 1,
		values: ['qb_entry_saved', 'marked_paid', 'status_updated', 'note_added'],
	},
	{ name: 'fromStatus', type: 'text', required: false, options: { max: 60 } },
	{ name: 'toStatus', type: 'text', required: false, options: { max: 60 } },
	{ name: 'qbTransactionId', type: 'text', required: false, options: { max: 120 } },
	{ name: 'qbAccount', type: 'text', required: false, options: { max: 120 } },
	{ name: 'qbEnteredDate', type: 'date', required: false },
	{ name: 'paidDate', type: 'date', required: false },
	{ name: 'amount', type: 'number', required: false, options: { min: 0 } },
	{ name: 'performedBy', type: 'text', required: false, options: { max: 32 } },
	{ name: 'eventAt', type: 'date', required: false },
	{ name: 'notes', type: 'text', required: false },
];

const WORK_ORDER_AUDIT_INDEXES = [
	'CREATE INDEX IF NOT EXISTS idx_wo_audit_work_order_id ON work_order_audit_log (workOrderId)',
	'CREATE INDEX IF NOT EXISTS idx_wo_audit_action ON work_order_audit_log (action)',
	'CREATE INDEX IF NOT EXISTS idx_wo_audit_event_at ON work_order_audit_log (eventAt)',
	'CREATE INDEX IF NOT EXISTS idx_wo_audit_qb_txn_id ON work_order_audit_log (qbTransactionId)',
];

async function ensureCollection() {
	let collectionId = '';

	try {
		const created = await pb.collections.create({
			name: COLLECTION,
			type: 'base',
			listRule: '@request.auth.id != ""',
			viewRule: '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.id != ""',
			deleteRule: '@request.auth.id != ""',
		});
		collectionId = created.id;
		console.log(`✅ Created ${COLLECTION} collection shell`);
	} catch (err: any) {
		const nameExistsCode = err?.response?.data?.name?.code;
		const alreadyExistsMsg = String(err?.message || '').toLowerCase().includes('already exists');

		if ((err?.status === 400 && alreadyExistsMsg) || nameExistsCode === 'validation_collection_name_exists') {
			const existing = await pb.collections.getOne(COLLECTION);
			collectionId = existing.id;
			console.log(`⚠️  ${COLLECTION} already exists, applying schema patch`);
		} else {
			throw err;
		}
	}

	const baseUrl = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
	const patchRes = await fetch(`${baseUrl}/api/collections/${collectionId}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: pb.authStore.token,
		},
		body: JSON.stringify({
			fields: WORK_ORDER_AUDIT_FIELDS,
			indexes: WORK_ORDER_AUDIT_INDEXES,
			listRule: '@request.auth.id != ""',
			viewRule: '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.id != ""',
			deleteRule: '@request.auth.id != ""',
		}),
	});

	const patchJson = await patchRes.json().catch(() => ({}));
	if (!patchRes.ok) {
		throw new Error(`Failed to patch ${COLLECTION} schema: ${JSON.stringify(patchJson)}`);
	}

	console.log(`✅ Applied ${COLLECTION} fields (${(patchJson.fields || []).length})`);
	console.log(`✅ Applied ${COLLECTION} indexes (${(patchJson.indexes || []).length})`);
}

async function run() {
	const email = process.env.POCKETBASE_ADMIN_EMAIL;
	const password = process.env.POCKETBASE_ADMIN_PASSWORD;
	if (!email || !password) {
		throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD are required');
	}

	await pb.admins.authWithPassword(email, password);
	console.log('✅ Authenticated as admin');

	await ensureCollection();
}

run().catch((err: any) => {
	console.error('❌ Failed to update work_order_audit_log:', err?.message ?? err);
	if (err?.data) console.error(JSON.stringify(err.data, null, 2));
	if (err?.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
	process.exit(1);
});
