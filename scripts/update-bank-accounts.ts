import PocketBase from 'pocketbase';
import * as dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

type BankAccountSeed = {
	code: string;
	name: string;
	groupType: 'operating' | 'reserve_treasury' | 'restricted';
	accountType: 'checking' | 'clearing' | 'reserve' | 'money_market' | 'treasury_bill' | 'escrow';
	purpose: string;
	allocation: number;
	isRestricted: boolean;
	isInterestBearing: boolean;
	sortOrder: number;
	notes?: string;
};

const BANK_ACCOUNTS: BankAccountSeed[] = [
	{
		code: '1000',
		name: 'Operating Checking',
		groupType: 'operating',
		accountType: 'checking',
		purpose: 'Daily operations, payroll, vendor payments, reimbursements',
		allocation: 750000,
		isRestricted: false,
		isInterestBearing: false,
		sortOrder: 10,
	},
	{
		code: '1010',
		name: 'Payroll Account',
		groupType: 'operating',
		accountType: 'checking',
		purpose: 'Dedicated payroll funding, employee taxes and benefits',
		allocation: 250000,
		isRestricted: false,
		isInterestBearing: false,
		sortOrder: 20,
	},
	{
		code: '1020',
		name: 'Accounts Receivable Clearing',
		groupType: 'operating',
		accountType: 'clearing',
		purpose: 'Incoming customer payments and merchant deposits',
		allocation: 0,
		isRestricted: false,
		isInterestBearing: false,
		sortOrder: 30,
	},
	{
		code: '1030',
		name: 'Sponsorship Revenue Account',
		groupType: 'operating',
		accountType: 'checking',
		purpose: 'League sponsorship deposits and marketing partner payments',
		allocation: 0,
		isRestricted: false,
		isInterestBearing: false,
		sortOrder: 40,
	},
	{
		code: '1040',
		name: 'Event Operations Account',
		groupType: 'operating',
		accountType: 'checking',
		purpose: 'Tournament/event expenses, prize payouts, venue expenses',
		allocation: 500000,
		isRestricted: false,
		isInterestBearing: false,
		sortOrder: 50,
	},
	{
		code: '1100',
		name: 'Cash Reserve Fund',
		groupType: 'reserve_treasury',
		accountType: 'reserve',
		purpose: 'Emergency operating reserve (6-12 months)',
		allocation: 2000000,
		isRestricted: false,
		isInterestBearing: false,
		sortOrder: 60,
	},
	{
		code: '1110',
		name: 'Growth & Expansion Fund',
		groupType: 'reserve_treasury',
		accountType: 'reserve',
		purpose: 'New markets, product development, strategic initiatives',
		allocation: 1500000,
		isRestricted: false,
		isInterestBearing: false,
		sortOrder: 70,
	},
	{
		code: '1120',
		name: 'Treasury Money Market Account',
		groupType: 'reserve_treasury',
		accountType: 'money_market',
		purpose: 'Short-term cash holdings, interest-bearing',
		allocation: 1500000,
		isRestricted: false,
		isInterestBearing: true,
		sortOrder: 80,
	},
	{
		code: '1130',
		name: 'Treasury Bill Account',
		groupType: 'reserve_treasury',
		accountType: 'treasury_bill',
		purpose: 'U.S. Treasury investments (3-12 month maturities)',
		allocation: 1000000,
		isRestricted: false,
		isInterestBearing: true,
		sortOrder: 90,
	},
	{
		code: '1200',
		name: 'Investor Proceeds Account',
		groupType: 'restricted',
		accountType: 'checking',
		purpose: 'Initial capital raise deposits and use-of-funds tracking',
		allocation: 0,
		isRestricted: true,
		isInterestBearing: false,
		sortOrder: 100,
	},
	{
		code: '1210',
		name: 'Escrow Account',
		groupType: 'restricted',
		accountType: 'escrow',
		purpose: 'Funds held for specific obligations',
		allocation: 0,
		isRestricted: true,
		isInterestBearing: false,
		sortOrder: 110,
	},
	{
		code: '1220',
		name: 'Prize Purse Reserve',
		groupType: 'restricted',
		accountType: 'reserve',
		purpose: 'Future tournament prize payouts',
		allocation: 0,
		isRestricted: true,
		isInterestBearing: false,
		sortOrder: 120,
	},
	{
		code: '1230',
		name: 'Refund Reserve',
		groupType: 'restricted',
		accountType: 'reserve',
		purpose: 'Customer refunds and dispute coverage',
		allocation: 0,
		isRestricted: true,
		isInterestBearing: false,
		sortOrder: 130,
	},
];

const BANK_ACCOUNT_FIELDS = [
	{ name: 'code', type: 'text', required: true, options: { min: 4, max: 10, pattern: '^[0-9]+$' } },
	{ name: 'name', type: 'text', required: true, options: { min: 1, max: 255 } },
	{
		name: 'groupType',
		type: 'select',
		required: true,
		maxSelect: 1,
		values: ['operating', 'reserve_treasury', 'restricted'],
	},
	{
		name: 'accountType',
		type: 'select',
		required: true,
		maxSelect: 1,
		values: ['checking', 'clearing', 'reserve', 'money_market', 'treasury_bill', 'escrow'],
	},
	{ name: 'purpose', type: 'text', required: false },
	{ name: 'allocation', type: 'number', required: false, options: { min: 0 } },
	{ name: 'isRestricted', type: 'bool', required: false },
	{ name: 'isInterestBearing', type: 'bool', required: false },
	{ name: 'chartCategory', type: 'text', required: false, options: { max: 120 } },
	{ name: 'status', type: 'select', required: false, maxSelect: 1, values: ['active', 'inactive'] },
	{ name: 'sortOrder', type: 'number', required: false },
	{ name: 'notes', type: 'text', required: false },
];

async function ensureCollection() {
	let collectionId = '';
	try {
		const created = await pb.collections.create({
			name: 'bank_accounts',
			type: 'base',
			listRule: '@request.auth.id != ""',
			viewRule: '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.id != ""',
			deleteRule: '@request.auth.id != ""',
		});
		collectionId = created.id;
		console.log('✅ Created bank_accounts collection shell');
	} catch (err: any) {
		const nameExistsCode = err?.response?.data?.name?.code;
		const alreadyExistsMsg = String(err?.message || '').toLowerCase().includes('already exists');
		if ((err?.status === 400 && alreadyExistsMsg) || nameExistsCode === 'validation_collection_name_exists') {
			const existing = await pb.collections.getOne('bank_accounts');
			collectionId = existing.id;
			console.log('⚠️  bank_accounts collection already exists, applying schema patch');
		} else {
			throw err;
		}
	}

	const baseUrl = (process.env.POCKETBASE_URL || 'http://127.0.0.1:8090').replace(/\/$/, '');
	const patchRes = await fetch(`${baseUrl}/api/collections/${collectionId}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': pb.authStore.token,
		},
		body: JSON.stringify({
			fields: BANK_ACCOUNT_FIELDS,
			listRule: '@request.auth.id != ""',
			viewRule: '@request.auth.id != ""',
			createRule: '@request.auth.id != ""',
			updateRule: '@request.auth.id != ""',
			deleteRule: '@request.auth.id != ""',
		}),
	});

	const patchJson = await patchRes.json().catch(() => ({}));
	if (!patchRes.ok) {
		throw new Error(`Failed to patch bank_accounts schema: ${JSON.stringify(patchJson)}`);
	}
	console.log(`✅ Applied bank_accounts fields (${(patchJson.fields || []).length})`);
}

async function upsertAccounts() {
	let created = 0;
	let updated = 0;

	for (const account of BANK_ACCOUNTS) {
		const existing = await pb.collection('bank_accounts').getFullList({
			filter: `code = "${account.code}"`,
			fields: 'id,code',
		}).catch(() => []);

		const payload = {
			...account,
			chartCategory: 'Assets > Current Assets',
			status: 'active',
		};

		if ((existing as any[]).length > 0) {
			await pb.collection('bank_accounts').update((existing as any[])[0].id, payload);
			console.log(`🔄 Updated ${account.code} - ${account.name}`);
			updated++;
		} else {
			await pb.collection('bank_accounts').create(payload);
			console.log(`✅ Created ${account.code} - ${account.name}`);
			created++;
		}
	}

	const total = BANK_ACCOUNTS.reduce((sum, a) => sum + (a.allocation || 0), 0);
	console.log(`\n💰 Seeded allocation total: $${total.toLocaleString('en-US')}`);
	if (total !== 7500000) {
		console.log('⚠️  Allocation total is not exactly $7,500,000');
	}

	console.log(`\n📊 Bank accounts upsert complete: ${created} created, ${updated} updated`);
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
	await upsertAccounts();
}

run().catch((err: any) => {
	console.error('❌ Failed to update bank accounts:', err?.message ?? err);
	if (err?.data) console.error(JSON.stringify(err.data, null, 2));
	if (err?.response?.data) console.error(JSON.stringify(err.response.data, null, 2));
	process.exit(1);
});
