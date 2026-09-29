import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const apply = process.argv.includes('--apply');
const baseUrl = String(process.env.POCKETBASE_URL || '').trim().replace(/\/$/, '');
const identity = String(process.env.POCKETBASE_ADMIN_EMAIL || '').trim();
const password = String(process.env.POCKETBASE_ADMIN_PASSWORD || '');

async function authenticate(pb: PocketBase): Promise<void> {
	if (!baseUrl || !identity || !password) throw new Error('PocketBase server configuration is incomplete');
	const response = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identity, password })
	});
	const data = await response.json().catch(() => ({}));
	if (!response.ok || !data.token) throw new Error(`PocketBase authentication failed (${response.status})`);
	pb.authStore.save(data.token, null);
}

function missingFields(existingFields: any[], desiredFields: any[]): any[] {
	const names = new Set(existingFields.map((field) => field.name));
	return desiredFields.filter((field) => !names.has(field.name));
}

async function run(): Promise<void> {
	const pb = new PocketBase(baseUrl);
	pb.autoCancellation(false);
	await authenticate(pb);

	const [itemsCollection, profilesCollection, statementsCollection] = await Promise.all([
		pb.collections.getOne('reimbursement_items'),
		pb.collections.getOne('user_profiles'),
		pb.collections.getOne('bank_statements')
	]);

	const desiredItemFields = [
		{ name: 'sourceTransactionId', type: 'text', required: false, max: 255 },
		{ name: 'importBatchId', type: 'text', required: false, max: 255 },
		{ name: 'bankStatement', type: 'relation', required: false, collectionId: statementsCollection.id, maxSelect: 1, cascadeDelete: false },
		{ name: 'businessPurposeStatus', type: 'select', required: false, maxSelect: 1, values: ['not_required', 'unconfirmed', 'confirmed'] },
		{ name: 'businessPurposeConfirmedAt', type: 'date', required: false },
		{ name: 'businessPurposeConfirmedBy', type: 'relation', required: false, collectionId: profilesCollection.id, maxSelect: 1, cascadeDelete: false },
		{ name: 'duplicateReviewStatus', type: 'select', required: false, maxSelect: 1, values: ['pending', 'keep', 'archived'] },
		{ name: 'isArchived', type: 'bool', required: false },
		{ name: 'archivedAt', type: 'date', required: false },
		{ name: 'archivedBy', type: 'relation', required: false, collectionId: profilesCollection.id, maxSelect: 1, cascadeDelete: false },
		{ name: 'archiveReason', type: 'text', required: false, max: 2000 }
	];
	const itemFieldsToAdd = missingFields(itemsCollection.fields, desiredItemFields);
	const desiredItemIndexes = [
		'CREATE INDEX IF NOT EXISTS idx_reimbursement_items_source_txn ON reimbursement_items (sourceTransactionId)',
		'CREATE INDEX IF NOT EXISTS idx_reimbursement_items_import_batch ON reimbursement_items (importBatchId)',
		'CREATE INDEX IF NOT EXISTS idx_reimbursement_items_archived ON reimbursement_items (isArchived)'
	];
	const existingItemIndexes = new Set(itemsCollection.indexes ?? []);
	const itemIndexesToAdd = desiredItemIndexes.filter((index) => !existingItemIndexes.has(index));

	let auditCollection: any = null;
	try {
		auditCollection = await pb.collections.getOne('reimbursement_item_audit');
	} catch {
		// Expected before the first migration run.
	}

	console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
	console.log(`reimbursement_items fields to add: ${itemFieldsToAdd.map((field) => field.name).join(', ') || 'none'}`);
	console.log(`reimbursement_items indexes to add: ${itemIndexesToAdd.length}`);
	console.log(`reimbursement_item_audit: ${auditCollection ? 'already exists' : 'will be created'}`);
	if (!apply) {
		console.log('No schema changes made. Re-run with --apply after reviewing this plan.');
		return;
	}

	if (itemFieldsToAdd.length > 0 || itemIndexesToAdd.length > 0) {
		await pb.collections.update(itemsCollection.id, {
			fields: [...itemsCollection.fields, ...itemFieldsToAdd],
			indexes: [
				...(itemsCollection.indexes ?? []),
				...itemIndexesToAdd
			]
		});
		console.log('Updated reimbursement_items schema.');
	}

	if (!auditCollection) {
		await pb.collections.create({
			name: 'reimbursement_item_audit',
			type: 'base',
			fields: [
				{ name: 'itemRecordId', type: 'text', required: true, max: 32 },
				{ name: 'claimRecordId', type: 'text', required: true, max: 32 },
				{ name: 'action', type: 'select', required: true, maxSelect: 1, values: ['keep', 'archive', 'restore', 'confirm_business_purpose', 'mark_business_purpose_unconfirmed'] },
				{ name: 'performedBy', type: 'relation', required: false, collectionId: profilesCollection.id, maxSelect: 1, cascadeDelete: false },
				{ name: 'eventAt', type: 'date', required: true },
				{ name: 'reason', type: 'text', required: true, max: 2000 },
				{ name: 'snapshot', type: 'json', required: true, maxSize: 200000 }
			],
			indexes: [
				'CREATE INDEX idx_reimbursement_audit_item ON reimbursement_item_audit (itemRecordId)',
				'CREATE INDEX idx_reimbursement_audit_claim ON reimbursement_item_audit (claimRecordId)',
				'CREATE INDEX idx_reimbursement_audit_event ON reimbursement_item_audit (eventAt)'
			],
			listRule: null,
			viewRule: null,
			createRule: null,
			updateRule: null,
			deleteRule: null
		});
		console.log('Created reimbursement_item_audit collection.');
	}

	console.log('Migration complete. No reimbursement records were modified.');
}

run().catch((error: any) => {
	console.error(`Reimbursement integrity migration failed: ${error?.message ?? 'Unknown error'}`);
	process.exitCode = 1;
});