import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration: add franchisePayout relation field to work_orders
 *
 * work_orders already has a proPayment multi-relation for pro/manager payments.
 * This adds a parallel franchisePayout relation so franchise WOs carry a typed
 * reference back to the franchise_payouts record instead of relying solely on
 * the [FP:id] notes marker.
 */
async function addFranchisePayoutField() {
	let url = process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app';
	url = url.replace(/\/$/, '');

	const pb = new PocketBase(url);

	const email = process.env.POCKETBASE_ADMIN_EMAIL;
	const password = process.env.POCKETBASE_ADMIN_PASSWORD;
	if (!email || !password) {
		throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in .env');
	}

	console.log(`🔐 Authenticating to ${url}...`);
	await (pb as any).admins.authWithPassword(email, password);
	console.log('✅ Authenticated\n');

	const collections = await pb.collections.getFullList();

	const workOrdersCollection = collections.find((c: any) => c.name === 'work_orders');
	if (!workOrdersCollection) throw new Error('work_orders collection not found');

	const franchisePayoutsCollection = collections.find((c: any) => c.name === 'franchise_payouts');
	if (!franchisePayoutsCollection) throw new Error('franchise_payouts collection not found');

	const existing = (workOrdersCollection.schema as any[])?.find((f: any) => f.name === 'franchisePayout');
	if (existing) {
		console.log('⚠️  franchisePayout field already exists on work_orders — nothing to do.');
		return;
	}

	console.log('➕ Adding franchisePayout relation field to work_orders...');

	const updatedSchema = [
		...(workOrdersCollection.schema || []),
		{
			name: 'franchisePayout',
			type: 'relation',
			required: false,
			presentable: false,
			system: false,
			hidden: false,
			options: {
				collectionId: franchisePayoutsCollection.id,
				cascadeDelete: false,
				minSelect: null,
				maxSelect: 1,
				displayFields: null,
			},
		},
	];

	await pb.collections.update(workOrdersCollection.id, { schema: updatedSchema });
	console.log('✅ franchisePayout field added to work_orders.\n');
}

addFranchisePayoutField().catch((err) => {
	console.error('❌ Migration failed:', err);
	process.exit(1);
});
