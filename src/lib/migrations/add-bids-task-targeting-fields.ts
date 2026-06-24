import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

function getArgValue(flag: string): string | null {
	const idx = process.argv.findIndex((arg) => arg === flag);
	if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
	const inline = process.argv.find((arg) => arg.startsWith(`${flag}=`));
	return inline ? inline.slice(flag.length + 1) : null;
}

async function addBidsTaskTargetingFields() {
	const apply = process.argv.includes('--apply');
	const cliUrl = getArgValue('--url');
	let url = cliUrl || process.env.POCKETBASE_URL || '';
	url = url.replace(/\/$/, '');

	const email = process.env.POCKETBASE_ADMIN_EMAIL;
	const password = process.env.POCKETBASE_ADMIN_PASSWORD;
	if (!url || !email || !password) {
		throw new Error('POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, and POCKETBASE_ADMIN_PASSWORD are required');
	}

	const pb = new PocketBase(url);
	await (pb as any).admins.authWithPassword(email, password);

	const bidsCollection = await pb.collections.getOne('bids');
	const tasksCollection = await pb.collections.getOne('tasks');
	const fields: any[] = Array.isArray((bidsCollection as any).fields) ? [...(bidsCollection as any).fields] : [];

	const has = (name: string) => fields.some((f) => f.name === name);

	const toAdd: any[] = [];

	if (!has('taskId')) {
		toAdd.push({
			hidden: false,
			presentable: false,
			name: 'taskId',
			type: 'relation',
			required: false,
			collectionId: (tasksCollection as any).id,
			cascadeDelete: false,
			minSelect: 0,
			maxSelect: 1
		});
	}

	if (!has('referenceNumber')) {
		toAdd.push({
			name: 'referenceNumber',
			type: 'text',
			required: false,
			options: {
				min: null,
				max: 120,
				pattern: ''
			}
		});
	}

	if (!has('materialsAmount')) {
		toAdd.push({
			name: 'materialsAmount',
			type: 'number',
			required: false,
			options: { min: 0, max: null, noDecimal: false }
		});
	}

	if (!has('laborAmount')) {
		toAdd.push({
			name: 'laborAmount',
			type: 'number',
			required: false,
			options: { min: 0, max: null, noDecimal: false }
		});
	}

	if (!has('logisticsAmount')) {
		toAdd.push({
			name: 'logisticsAmount',
			type: 'number',
			required: false,
			options: { min: 0, max: null, noDecimal: false }
		});
	}

	if (!has('otherAmount')) {
		toAdd.push({
			name: 'otherAmount',
			type: 'number',
			required: false,
			options: { min: 0, max: null, noDecimal: false }
		});
	}

	if (toAdd.length === 0) {
		console.log('No schema changes needed. All bid task-targeting fields already exist.');
		return;
	}

	console.log(`Will add ${toAdd.length} fields to bids: ${toAdd.map((f) => f.name).join(', ')}`);
	if (!apply) {
		console.log('Dry run only. Re-run with --apply to persist changes.');
		return;
	}

	await pb.collections.update((bidsCollection as any).id, {
		fields: [...fields, ...toAdd]
	});

	console.log('Updated bids schema successfully.');
}

addBidsTaskTargetingFields().catch((err: any) => {
	console.error('Migration failed:', err?.message || err);
	if (err?.data) {
		console.error('Details:', JSON.stringify(err.data, null, 2));
	}
	process.exit(1);
});
