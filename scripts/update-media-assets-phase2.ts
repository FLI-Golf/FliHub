import dotenv from 'dotenv';
import { collections } from '../src/lib/migrations/collections.js';

dotenv.config();

type FieldDef = Record<string, any>;

function toPocketBaseField(field: FieldDef, relationIds: Record<string, string>): FieldDef {
	const base = {
		hidden: false,
		name: field.name,
		presentable: false,
		required: field.required ?? false,
		system: false,
		type: field.type
	};

	switch (field.type) {
		case 'select':
			return {
				...base,
				maxSelect: field.options?.maxSelect ?? 1,
				values: field.options?.values ?? []
			};
		case 'relation':
			return {
				...base,
				cascadeDelete: field.options?.cascadeDelete ?? false,
				collectionId: relationIds[field.options?.collectionId] ?? field.options?.collectionId,
				maxSelect: field.options?.maxSelect ?? 1,
				minSelect: field.options?.minSelect ?? 0
			};
		case 'date':
			return {
				...base,
				max: field.options?.max ?? '',
				min: field.options?.min ?? ''
			};
		case 'number':
			return {
				...base,
				max: field.options?.max ?? null,
				min: field.options?.min ?? null,
				noDecimal: field.options?.noDecimal ?? false
			};
		case 'file':
			return {
				...base,
				maxSelect: field.options?.maxSelect ?? 1,
				maxSize: field.options?.maxSize ?? 10485760,
				mimeTypes: field.options?.mimeTypes ?? null,
				protected: field.options?.protected ?? false,
				thumbs: field.options?.thumbs ?? null
			};
		case 'editor':
			return {
				...base,
				convertURLs: field.options?.convertUrls ?? false,
				maxSize: field.options?.maxSize ?? 0
			};
		case 'text':
		default:
			return {
				...base,
				autogeneratePattern: field.options?.autogeneratePattern ?? '',
				max: field.options?.max ?? 0,
				min: field.options?.min ?? 0,
				pattern: field.options?.pattern ?? ''
			};
	}
}

async function requestJson(url: string, options: RequestInit = {}) {
	const response = await fetch(url, options);
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(`${response.status} ${JSON.stringify(payload)}`);
	}
	return payload;
}

const PHASE2_COLLECTIONS = [
	'media_asset_tags',
	'media_asset_people',
	'media_asset_teams',
	'media_asset_sponsors',
	'media_asset_events',
	'media_asset_markers'
] as const;

async function updateMediaAssetsPhase2() {
	const url = process.env.POCKETBASE_URL;
	const email = process.env.POCKETBASE_ADMIN_EMAIL;
	const password = process.env.POCKETBASE_ADMIN_PASSWORD;

	if (!url || !email || !password) {
		throw new Error('Missing PocketBase credentials in .env');
	}

	const baseUrl = url.replace(/\/$/, '');
	const auth = await requestJson(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identity: email, password })
	});
	const token = auth.token;

	const allCollections = await requestJson(`${baseUrl}/api/collections?page=1&perPage=200`, {
		headers: { Authorization: token }
	});

	const relationIds: Record<string, string> = Object.fromEntries(
		(allCollections.items ?? []).map((item: any) => [item.name, item.id])
	);

	for (const collectionName of PHASE2_COLLECTIONS) {
		const target = collections.find((item) => item.name === collectionName);
		if (!target) {
			throw new Error(`${collectionName} definition not found in collections.ts`);
		}

		const existing = (allCollections.items ?? []).find((item: any) => item.name === collectionName);
		const targetFields = target.schema.map((field: any) => toPocketBaseField(field, relationIds));

		if (existing) {
			const systemFields = (existing.fields || []).filter((field: any) => field.system);
			await requestJson(`${baseUrl}/api/collections/${existing.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: token
				},
				body: JSON.stringify({
					name: target.name,
					type: target.type,
					listRule: target.listRule,
					viewRule: target.viewRule,
					createRule: target.createRule,
					updateRule: target.updateRule,
					deleteRule: target.deleteRule,
					indexes: target.indexes || [],
					fields: [...systemFields, ...targetFields]
				})
			});
			console.log(`Updated: ${collectionName}`);
		} else {
			const created = await requestJson(`${baseUrl}/api/collections`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: token
				},
				body: JSON.stringify({
					name: target.name,
					type: target.type,
					listRule: target.listRule,
					viewRule: target.viewRule,
					createRule: target.createRule,
					updateRule: target.updateRule,
					deleteRule: target.deleteRule,
					indexes: target.indexes || [],
					fields: targetFields
				})
			});
			relationIds[target.name] = created.id;
			console.log(`Created: ${collectionName}`);
		}
	}

	console.log('Phase 2 media taxonomy collections are ready.');
}

updateMediaAssetsPhase2().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
