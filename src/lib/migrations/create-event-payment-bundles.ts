/**
 * Collection blueprint: event_payment_bundles
 *
 * This file documents the expected schema for the event payment bundling pipeline.
 * Apply via your existing PocketBase migration/import workflow before using bundle APIs.
 */

export const eventPaymentBundleCollections = [
	{
		name: 'event_payment_bundles',
		type: 'base',
		schema: [
			{ name: 'bundleNumber', type: 'text', required: true, options: { min: 1, max: 80 } },
			{ name: 'name', type: 'text', required: false, options: { max: 255 } },
			{
				name: 'status',
				type: 'select',
				required: true,
				options: {
					maxSelect: 1,
					values: ['draft', 'ready', 'posted', 'paid', 'cancelled']
				}
			},
			{ name: 'department', type: 'relation', required: false, options: { collectionId: 'departments', maxSelect: 1 } },
			{ name: 'departmentName', type: 'text', required: false, options: { max: 255 } },
			{ name: 'accountLabel', type: 'text', required: false, options: { max: 255 } },
			{ name: 'paymentIds', type: 'relation', required: false, options: { collectionId: 'event_payments', maxSelect: 500 } },
			{ name: 'itemCount', type: 'number', required: false, options: { min: 0 } },
			{ name: 'totalAmount', type: 'number', required: false, options: { min: 0 } },
			{ name: 'maxItemCount', type: 'number', required: false, options: { min: 1 } },
			{ name: 'maxAmountThreshold', type: 'number', required: false, options: { min: 1 } },
			{ name: 'snapshotJson', type: 'json', required: false },
			{ name: 'snapshotChecksum', type: 'text', required: false, options: { max: 128 } },
			{ name: 'postedAt', type: 'date', required: false },
			{ name: 'paidAt', type: 'date', required: false },
			{ name: 'notes', type: 'editor', required: false }
		],
		indexes: [
			'CREATE UNIQUE INDEX idx_event_payment_bundles_number ON event_payment_bundles (bundleNumber)',
			'CREATE INDEX idx_event_payment_bundles_status ON event_payment_bundles (status)'
		],
		listRule: '@request.auth.id != ""',
		viewRule: '@request.auth.id != ""',
		createRule: '@request.auth.id != ""',
		updateRule: '@request.auth.id != ""',
		deleteRule: '@request.auth.id != ""'
	}
];

export const eventPaymentBundleRelationTargets = {
	department: 'departments',
	paymentIds: 'event_payments'
} as const;

export function resolveEventPaymentBundleCollectionDefinition(collectionIdByName: Map<string, string>) {
	const def = eventPaymentBundleCollections[0];
	const schema = Array.isArray(def.schema) ? def.schema : [];

	return {
		name: def.name,
		type: def.type,
		schema: schema.map((field) => {
			if (field.type !== 'relation') return field;
			const targetName = String(field.options?.collectionId ?? '').trim();
			const explicitTargetName =
				targetName === eventPaymentBundleRelationTargets.department
					? eventPaymentBundleRelationTargets.department
					: targetName === eventPaymentBundleRelationTargets.paymentIds
						? eventPaymentBundleRelationTargets.paymentIds
						: targetName;
			const explicitCollectionId = collectionIdByName.get(explicitTargetName) ?? explicitTargetName;
			return {
				...field,
				options: {
					...field.options,
					collectionId: explicitCollectionId
				}
			};
		}),
		indexes: def.indexes ?? [],
		listRule: def.listRule ?? null,
		viewRule: def.viewRule ?? null,
		createRule: def.createRule ?? null,
		updateRule: def.updateRule ?? null,
		deleteRule: def.deleteRule ?? null
	};
}
