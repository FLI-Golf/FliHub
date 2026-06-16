import * as dotenv from 'dotenv';
import PocketBase from 'pocketbase';
import { collections } from '../src/lib/migrations/collections';

dotenv.config({ path: '/workspaces/FliHub/.env' });

const PB_URL = (process.env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
	throw new Error('Missing POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD in .env');
}

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

type MigrationCollection = {
	name: string;
	type: string;
	schema?: Array<Record<string, unknown>>;
	listRule?: string | null;
	viewRule?: string | null;
	createRule?: string | null;
	updateRule?: string | null;
	deleteRule?: string | null;
};

function toPbField(field: Record<string, unknown>) {
	const type = String(field.type ?? 'text');
	const name = String(field.name ?? '');
	const required = Boolean(field.required ?? false);
	const options = (field.options as Record<string, unknown>) ?? {};

	const base: Record<string, unknown> = { name, type, required };

	if (type === 'text') {
		base.min = Number(options.min ?? 0);
		base.max = Number(options.max ?? 0);
		base.pattern = String(options.pattern ?? '');
		base.autogeneratePattern = String(options.autogeneratePattern ?? '');
	}
	if (type === 'number') {
		base.min = options.min ?? null;
		base.max = options.max ?? null;
		base.onlyInt = Boolean(options.onlyInt ?? false);
	}
	if (type === 'date') {
		base.min = String(options.min ?? '');
		base.max = String(options.max ?? '');
	}
	if (type === 'select') {
		base.maxSelect = Number(options.maxSelect ?? 1);
		base.values = Array.isArray(options.values) ? options.values : [];
	}
	if (type === 'email' || type === 'url') {
		base.onlyDomains = Array.isArray(options.onlyDomains) ? options.onlyDomains : [];
		base.exceptDomains = Array.isArray(options.exceptDomains) ? options.exceptDomains : [];
	}

	return base;
}

async function main() {
	await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL!, ADMIN_PASSWORD!);

	const target = (collections as MigrationCollection[]).find((c) => c.name === 'document_signatures');
	if (!target || !Array.isArray(target.schema)) {
		throw new Error('document_signatures schema not found in migrations file');
	}

	const live = await pb.collections.getOne('document_signatures');
	const before = Array.isArray((live as any).fields) ? (live as any).fields : [];
	console.log(`Before: document_signatures has ${before.length} field(s)`);

	await pb.collections.update(live.id, {
		name: target.name,
		type: target.type,
		listRule: target.listRule ?? '@request.auth.id != ""',
		viewRule: target.viewRule ?? '@request.auth.id != ""',
		createRule: target.createRule ?? '@request.auth.id != ""',
		updateRule: target.updateRule ?? '@request.auth.id != ""',
		deleteRule: target.deleteRule ?? null,
		fields: target.schema.map((f) => toPbField(f))
	} as any);

	const repaired = await pb.collections.getOne('document_signatures');
	const after = Array.isArray((repaired as any).fields) ? (repaired as any).fields : [];
	console.log(`After: document_signatures has ${after.length} field(s)`);
	console.log(`After fields: ${after.map((f: any) => f.name).join(', ')}`);
}

main().catch((err: any) => {
	console.error('Failed to repair document_signatures schema:', err?.response?.message || err?.message || err);
	if (err?.response) {
		console.error('Response details:', JSON.stringify(err.response, null, 2));
	}
	process.exit(1);
});
