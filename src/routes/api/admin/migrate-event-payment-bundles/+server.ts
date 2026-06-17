import { json } from '@sveltejs/kit';
import { requireAdminApi } from '$lib/infra/api-route-guards';
import {
	eventPaymentBundleCollections,
	resolveEventPaymentBundleCollectionDefinition
} from '$lib/migrations/create-event-payment-bundles';
import type { RequestHandler } from './$types';

const COLLECTION_NAME = 'event_payment_bundles';
const REQUIRED_FIELDS = [
	'bundleNumber',
	'name',
	'status',
	'department',
	'departmentName',
	'accountLabel',
	'paymentIds',
	'itemCount',
	'totalAmount',
	'maxItemCount',
	'maxAmountThreshold',
	'snapshotJson',
	'snapshotChecksum',
	'postedAt',
	'paidAt',
	'notes'
];

function normalizeDefinition(def: any) {
	const fields = Array.isArray(def?.fields)
		? def.fields
		: (Array.isArray(def?.schema) ? def.schema : []);

	return {
		name: def.name,
		type: def.type,
		fields,
		indexes: def.indexes ?? [],
		listRule: def.listRule ?? null,
		viewRule: def.viewRule ?? null,
		createRule: def.createRule ?? null,
		updateRule: def.updateRule ?? null,
		deleteRule: def.deleteRule ?? null
	};
}

function buildCollectionIdMap(collections: any[]) {
	return new Map(collections.map((collection: any) => [String(collection?.name ?? ''), String(collection?.id ?? '')]));
}

function getFieldNames(collection: any): string[] {
	const fields = Array.isArray(collection?.fields)
		? collection.fields
		: (Array.isArray(collection?.schema) ? collection.schema : []);
	return fields
		.map((f: any) => String(f?.name ?? '').trim())
		.filter(Boolean);
}

function isCollectionComplete(collection: any): boolean {
	const names = new Set(getFieldNames(collection));
	return REQUIRED_FIELDS.every((name) => names.has(name));
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const guard = await requireAdminApi(locals, url);
	if (guard.error) return guard.error;

	try {
		const pb = guard.ctx.pb;
		const collections = await pb.collections.getFullList();
		const found = collections.find((c: any) => c.name === COLLECTION_NAME) ?? null;
		const fieldNames = found ? getFieldNames(found) : [];
		return json({
			exists: !!found,
			isComplete: found ? isCollectionComplete(found) : false,
			collection: found
				? {
					id: found.id,
					name: found.name,
					type: found.type,
					fieldCount: fieldNames.length,
					fields: fieldNames,
					indexes: found.indexes ?? []
				}
				: null
		});
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to verify event payment bundle collection' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, url }) => {
	const guard = await requireAdminApi(locals, url);
	if (guard.error) return guard.error;

	try {
		const pb = guard.ctx.pb;
		const existing = await pb.collections.getFullList();
		const collectionIdByName = buildCollectionIdMap(existing);
		const current = existing.find((c: any) => c.name === COLLECTION_NAME);
		const definition = normalizeDefinition(resolveEventPaymentBundleCollectionDefinition(collectionIdByName));
		if (current) {
			if (isCollectionComplete(current)) {
				return json({
					success: true,
					action: 'skipped',
					message: `${COLLECTION_NAME} already exists`,
					collectionId: current.id
				});
			}

			await pb.collections.update(current.id, definition as any);
			const refreshed = await pb.collections.getOne(current.id);
			return json({
				success: true,
				action: 'updated',
				message: `${COLLECTION_NAME} existed but was incomplete; schema repaired`,
				collectionId: current.id,
				fieldCount: getFieldNames(refreshed).length
			});
		}

		const created = await pb.collections.create(definition as any);
		return json({
			success: true,
			action: 'created',
			message: `${COLLECTION_NAME} collection created`,
			collectionId: created.id,
			fieldCount: getFieldNames(created).length
		});
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to create event payment bundle collection' }, { status: 500 });
	}
};
