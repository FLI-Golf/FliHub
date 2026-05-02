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

	try {
		await pb.collections.create({
			name: 'trademark_filings',
			type: 'base',
			listRule:   '@request.auth.id != ""',
			viewRule:   '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.id != ""',
			deleteRule: null,
			schema: [
				{
					name: 'franchiseId',
					type: 'relation',
					required: true,
					options: { collectionId: 'franchises', cascadeDelete: false, maxSelect: 1 }
				},
				{
					name: 'markType',
					type: 'select',
					required: true,
					options: { maxSelect: 1, values: ['word_mark', 'design_mark', 'composite_mark'] }
				},
				{
					name: 'logoVariant',
					type: 'select',
					required: false,
					options: { maxSelect: 1, values: ['none', 'logoFull', 'logoMini', 'logoHorizontal', 'logoVertical', 'logoMonochrome', 'logoWordmark'] }
				},
				{
					name: 'trademarkClass',
					type: 'select',
					required: false,
					options: { maxSelect: 1, values: ['ic_028', 'ic_041', 'ic_025', 'ic_035', 'ic_038', 'ic_009', 'other'] }
				},
				{
					name: 'status',
					type: 'select',
					required: true,
					options: { maxSelect: 1, values: ['not_filed', 'attorney_review', 'filed', 'published', 'opposition', 'approved', 'rejected', 'abandoned'] }
				},
				{ name: 'usptoAppNumber',    type: 'text',   required: false, options: { max: 50 } },
				{ name: 'usptoSerialNumber', type: 'text',   required: false, options: { max: 50 } },
				{ name: 'filedDate',         type: 'date',   required: false },
				{ name: 'publishedDate',     type: 'date',   required: false },
				{ name: 'approvedDate',      type: 'date',   required: false },
				{ name: 'rejectedDate',      type: 'date',   required: false },
				{ name: 'renewalDate',       type: 'date',   required: false },
				{ name: 'attorneyNotes',     type: 'editor', required: false },
				{ name: 'internalNotes',     type: 'editor', required: false },
				{ name: 'oppositionDetail',  type: 'text',   required: false }
			]
		});
		console.log('✅ Created trademark_filings collection');
	} catch (err: any) {
		if (err?.status === 400 && err?.message?.includes('already exists')) {
			console.log('⚠️  trademark_filings already exists — skipping');
		} else {
			throw err;
		}
	}
}

run().catch(err => { console.error('❌', err); process.exit(1); });
