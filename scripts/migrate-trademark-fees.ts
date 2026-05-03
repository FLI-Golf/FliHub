/**
 * Creates trademark_billing_groups and trademark_expenses collections,
 * and adds fee fields to trademark_filings.
 * Safe to run multiple times — skips anything that already exists.
 */
import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

async function collectionExists(name: string): Promise<boolean> {
	try { await pb.collections.getOne(name); return true; }
	catch { return false; }
}

async function run() {
	await pb.admins.authWithPassword(
		process.env.POCKETBASE_ADMIN_EMAIL!,
		process.env.POCKETBASE_ADMIN_PASSWORD!
	);
	console.log('✅ Authenticated');

	// ── 1. trademark_billing_groups ───────────────────────────────────────────
	if (await collectionExists('trademark_billing_groups')) {
		console.log('⚠️  trademark_billing_groups already exists — skipping');
	} else {
		await pb.collections.create({
			name: 'trademark_billing_groups',
			type: 'base',
			listRule:   '@request.auth.id != ""',
			viewRule:   '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.id != ""',
			deleteRule: null,
			fields: [
				{ name: 'name',          type: 'text',   required: true,  max: 200 },
				{ name: 'description',   type: 'text',   required: false, max: 1000 },
				{ name: 'attorneyName',  type: 'text',   required: false, max: 200 },
				{ name: 'invoiceNumber', type: 'text',   required: false, max: 100 },
				{ name: 'invoiceDate',   type: 'date',   required: false },
				{ name: 'dueDate',       type: 'date',   required: false },
				{ name: 'paidDate',      type: 'date',   required: false },
				{ name: 'totalFee',      type: 'number', required: true,  min: 0 },
				{
					name: 'status', type: 'select', required: true,
					maxSelect: 1,
					values: ['quoted', 'invoiced', 'paid', 'disputed']
				},
				{ name: 'notes', type: 'text', required: false, max: 2000 }
			]
		});
		console.log('✅ Created trademark_billing_groups');
	}

	// ── 2. trademark_expenses ─────────────────────────────────────────────────
	if (await collectionExists('trademark_expenses')) {
		console.log('⚠️  trademark_expenses already exists — skipping');
	} else {
		const filingsCol = await pb.collections.getOne('trademark_filings');
		const groupsCol  = await pb.collections.getOne('trademark_billing_groups');

		await pb.collections.create({
			name: 'trademark_expenses',
			type: 'base',
			listRule:   '@request.auth.id != ""',
			viewRule:   '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.id != ""',
			deleteRule: null,
			fields: [
				{
					name: 'filingId', type: 'relation', required: false,
					collectionId: filingsCol.id, cascadeDelete: false, maxSelect: 1
				},
				{
					name: 'billingGroupId', type: 'relation', required: false,
					collectionId: groupsCol.id, cascadeDelete: false, maxSelect: 1
				},
				{
					name: 'expenseType', type: 'select', required: true,
					maxSelect: 1,
					values: ['uspto_filing', 'attorney_filing', 'search_fee', 'office_action', 'opposition_defense', 'renewal', 'bundle', 'other']
				},
				{ name: 'amount',        type: 'number', required: true,  min: 0 },
				{
					name: 'status', type: 'select', required: true,
					maxSelect: 1,
					values: ['pending', 'approved', 'paid', 'disputed']
				},
				{ name: 'description',   type: 'text', required: false, max: 500 },
				{ name: 'invoiceNumber', type: 'text', required: false, max: 100 },
				{ name: 'invoiceDate',   type: 'date', required: false },
				{ name: 'paidDate',      type: 'date', required: false },
				{ name: 'notes',         type: 'text', required: false, max: 2000 }
			]
		});
		console.log('✅ Created trademark_expenses');
	}

	// ── 3. Add fee fields to trademark_filings ────────────────────────────────
	const filingsCol   = await pb.collections.getOne('trademark_filings');
	const groupsCol    = await pb.collections.getOne('trademark_billing_groups');
	const existingNames = (filingsCol.fields ?? []).map((f: any) => f.name);

	const newFields: any[] = [];

	if (!existingNames.includes('usptoFee'))
		newFields.push({ name: 'usptoFee',       type: 'number', required: false, min: 0 });
	if (!existingNames.includes('attorneyFee'))
		newFields.push({ name: 'attorneyFee',     type: 'number', required: false, min: 0 });
	if (!existingNames.includes('otherFees'))
		newFields.push({ name: 'otherFees',       type: 'number', required: false, min: 0 });
	if (!existingNames.includes('feeNotes'))
		newFields.push({ name: 'feeNotes',        type: 'text',   required: false, max: 1000 });
	if (!existingNames.includes('billingGroupId'))
		newFields.push({
			name: 'billingGroupId', type: 'relation', required: false,
			collectionId: groupsCol.id, cascadeDelete: false, maxSelect: 1
		});

	if (newFields.length === 0) {
		console.log('✅ trademark_filings fee fields already exist — skipping');
	} else {
		await pb.collections.update(filingsCol.id, {
			fields: [...(filingsCol.fields ?? []), ...newFields]
		});
		console.log(`✅ Added to trademark_filings: ${newFields.map((f: any) => f.name).join(', ')}`);
	}
}

run().catch(err => { console.error('❌', err); process.exit(1); });
