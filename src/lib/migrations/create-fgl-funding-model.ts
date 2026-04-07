import PocketBase from 'pocketbase';

// PocketBase v0.26 uses "fields" (not "schema") in the REST API.
// The JS SDK's collections.create() doesn't pass fields correctly,
// so we create the collection shell first, then PATCH fields via raw HTTP.

const PB_URL = 'https://pocketbase-production-6ab5.up.railway.app';
const pb = new PocketBase(PB_URL);

await pb.admins.authWithPassword('ddinsmore8@gmail.com', 'MADcap(123)');

const fields = [
	{ name: 'season',                     type: 'number', required: true },
	{ name: 'label',                      type: 'text',   required: true },
	{ name: 'tournament_ops_per_event',   type: 'number', required: false },
	{ name: 'tournament_count',           type: 'number', required: false },
	{ name: 'player_purse',               type: 'number', required: false },
	{ name: 'player_sponsorship_program', type: 'number', required: false },
	{ name: 'overhead_marketing',         type: 'number', required: false },
	{ name: 'overhead_staff_payroll',     type: 'number', required: false },
	{ name: 'overhead_tech_platform',     type: 'number', required: false },
	{ name: 'overhead_legal_admin',       type: 'number', required: false },
	{ name: 'rev_naming_rights',          type: 'number', required: false },
	{ name: 'rev_league_partners',        type: 'number', required: false },
	{ name: 'rev_on_course_activation',   type: 'number', required: false },
	{ name: 'rev_fan_interaction',        type: 'number', required: false },
	{ name: 'rev_ticket_presales',        type: 'number', required: false },
	{ name: 'rev_merchandise',            type: 'number', required: false },
	{ name: 'rev_subscriptions_fantasy',  type: 'number', required: false },
	{ name: 'rev_licensing_advances',     type: 'number', required: false },
	{ name: 'capital_raise_1',            type: 'number', required: false },
	{ name: 'capital_raise_2_equity',     type: 'number', required: false },
	{ name: 'capital_raise_2_debt',       type: 'number', required: false },
	{ name: 'notes',                      type: 'editor', required: false },
];

// Step 1: create or locate the collection
let collectionId: string;
try {
	const col = await pb.collections.create({
		name: 'fgl_funding_model',
		type: 'base',
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.role = "admin"',
		updateRule: '@request.auth.role = "admin"',
		deleteRule: '@request.auth.role = "admin"',
	});
	collectionId = col.id;
	console.log('Collection created, id:', collectionId);
} catch (err: any) {
	if (err?.response?.data?.name?.code === 'validation_collection_name_exists') {
		const col = await pb.collections.getOne('fgl_funding_model');
		collectionId = col.id;
		console.log('Collection already exists, id:', collectionId);
	} else {
		throw err;
	}
}

// Step 2: PATCH fields via raw HTTP (v0.26 API)
const patchRes = await fetch(`${PB_URL}/api/collections/${collectionId}`, {
	method: 'PATCH',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': pb.authStore.token,
	},
	body: JSON.stringify({ fields }),
});
const patchJson = await patchRes.json();
if (!patchRes.ok) {
	console.error('Field PATCH failed:', JSON.stringify(patchJson, null, 2));
	process.exit(1);
}
console.log('Fields applied, count:', patchJson.fields?.length);

// Step 3: seed the 2027 record (skip if one already exists for this season)
const existing = await pb.collection('fgl_funding_model').getFullList({ filter: 'season = 2027' });
if (existing.length > 0) {
	console.log('2027 record already exists, skipping seed');
} else {
	const record = await pb.collection('fgl_funding_model').create({
		season: 2027,
		label: 'FGL 2027 Launch Season',
		tournament_ops_per_event: 650000,
		tournament_count: 6,
		player_purse: 4000000,
		player_sponsorship_program: 300000,
		overhead_marketing: 1500000,
		overhead_staff_payroll: 1200000,
		overhead_tech_platform: 600000,
		overhead_legal_admin: 500000,
		rev_naming_rights: 1600000,
		rev_league_partners: 1500000,
		rev_on_course_activation: 600000,
		rev_fan_interaction: 150000,
		rev_ticket_presales: 1500000,
		rev_merchandise: 400000,
		rev_subscriptions_fantasy: 300000,
		rev_licensing_advances: 400000,
		capital_raise_1: 5000000,
		capital_raise_2_equity: 3500000,
		capital_raise_2_debt: 2500000,
		notes: 'Internal use only. FGL 2027 launch season funding model. Second capital layer covers the $5.55M gap after pre-season revenue is applied against the $12M total cash requirement.',
	});
	console.log('2027 record seeded, id:', record.id);
}
