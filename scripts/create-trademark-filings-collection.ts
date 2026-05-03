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

	// Fetch franchises collection id for the relation field
	const franchisesCol = await pb.collections.getOne('franchises');

	// Delete and recreate if it exists with no fields (empty shell from first run)
	let existing: any = null;
	try {
		existing = await pb.collections.getOne('trademark_filings');
		if ((existing.fields ?? []).length <= 1) {
			// Only has the system id field — delete and recreate properly
			await pb.collections.delete(existing.id);
			console.log('🗑️  Deleted empty trademark_filings shell');
			existing = null;
		} else {
			console.log('✅ trademark_filings already exists with fields — skipping');
			return;
		}
	} catch {
		// doesn't exist yet — fine
	}

	await pb.collections.create({
		name: 'trademark_filings',
		type: 'base',
		listRule:   '@request.auth.id != ""',
		viewRule:   '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: null,
		fields: [
			{
				name: 'franchiseId',
				type: 'relation',
				required: true,
				collectionId: franchisesCol.id,
				cascadeDelete: false,
				maxSelect: 1
			},
			{
				name: 'markType',
				type: 'select',
				required: true,
				maxSelect: 1,
				values: ['word_mark', 'design_mark', 'composite_mark']
			},
			{
				name: 'logoVariant',
				type: 'select',
				required: false,
				maxSelect: 1,
				values: ['none', 'logoFull', 'logoMini', 'logoHorizontal', 'logoVertical', 'logoMonochrome', 'logoWordmark']
			},
			{
				name: 'trademarkClass',
				type: 'select',
				required: false,
				maxSelect: 1,
				values: ['ic_028', 'ic_041', 'ic_025', 'ic_035', 'ic_038', 'ic_009', 'other']
			},
			{
				name: 'status',
				type: 'select',
				required: true,
				maxSelect: 1,
				values: ['not_filed', 'attorney_review', 'filed', 'published', 'opposition', 'approved', 'rejected', 'abandoned']
			},
			{ name: 'usptoAppNumber',    type: 'text',   required: false, max: 50 },
			{ name: 'usptoSerialNumber', type: 'text',   required: false, max: 50 },
			{ name: 'filedDate',         type: 'date',   required: false },
			{ name: 'publishedDate',     type: 'date',   required: false },
			{ name: 'approvedDate',      type: 'date',   required: false },
			{ name: 'rejectedDate',      type: 'date',   required: false },
			{ name: 'renewalDate',       type: 'date',   required: false },
			{ name: 'attorneyNotes',     type: 'text',   required: false },
			{ name: 'internalNotes',     type: 'text',   required: false },
			{ name: 'oppositionDetail',  type: 'text',   required: false }
		]
	});
	console.log('✅ Created trademark_filings collection with all fields');
}

run().catch(err => { console.error('❌', err); process.exit(1); });
