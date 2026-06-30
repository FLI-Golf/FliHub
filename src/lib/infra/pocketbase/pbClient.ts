import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';

let pbInstance: PocketBase | null = null;

function requireEnv(name: 'POCKETBASE_URL' | 'POCKETBASE_ADMIN_EMAIL' | 'POCKETBASE_ADMIN_PASSWORD'): string {
	const value = env[name];
	if (!value || !String(value).trim()) {
		throw new Error(`${name} is required in environment configuration`);
	}
	return String(value).trim();
}

export function getPocketBase(): PocketBase {
	if (!pbInstance) {
		const url = env.POCKETBASE_URL || 'http://127.0.0.1:8090';
		pbInstance = new PocketBase(url);
		pbInstance.autoCancellation(false);
	}
	return pbInstance;
}

export function createPocketBaseClient(url?: string): PocketBase {
	const pbUrl = url || env.POCKETBASE_URL || 'http://127.0.0.1:8090';
	return new PocketBase(pbUrl);
}

/**
 * Returns a fresh PocketBase client authenticated as admin.
 * Use this in server load functions that need to read collections
 * regardless of the logged-in user's role permissions.
 */
const _adminTokenByBase = new Map<string, { token: string; expiry: number }>();

function normalizeBaseUrl(input: string): string {
	return String(input).trim().replace(/\/$/, '');
}

async function getAdminToken(baseUrlInput?: string): Promise<string> {
	const baseUrl = normalizeBaseUrl(baseUrlInput || requireEnv('POCKETBASE_URL'));

	// Reuse token briefly per base URL to limit auth requests while avoiding stale-token issues.
	const cached = _adminTokenByBase.get(baseUrl);
	if (cached && Date.now() < cached.expiry) return cached.token;

	const identity = requireEnv('POCKETBASE_ADMIN_EMAIL');
	const password = requireEnv('POCKETBASE_ADMIN_PASSWORD');
	const res = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
		method:  'POST',
		headers: { 'Content-Type': 'application/json' },
		body:    JSON.stringify({ identity, password }),
	});
	const data = await res.json().catch(() => ({} as any));
	if (!res.ok || typeof data?.token !== 'string' || !data.token) {
		throw new Error(
			`Failed superuser auth (${res.status}): ${data?.message ?? 'Unknown PocketBase auth error'}`
		);
	}

	const token = String(data.token);
	_adminTokenByBase.set(baseUrl, {
		token,
		expiry: Date.now() + 2 * 60 * 1000,
	});
	return token;
}

export async function getAdminPocketBase(): Promise<PocketBase> {
	const baseUrl = normalizeBaseUrl(requireEnv('POCKETBASE_URL'));
	const pb = await getAdminPocketBaseForBaseUrl(baseUrl);
	return pb;
}

export async function getAdminPocketBaseForBaseUrl(baseUrlInput: string): Promise<PocketBase> {
	const baseUrl = normalizeBaseUrl(baseUrlInput);
	if (!baseUrl) {
		throw new Error('PocketBase base URL is required');
	}

	const pb = new PocketBase(baseUrl);
	pb.autoCancellation(false);

	const token = await getAdminToken(baseUrl);
	pb.authStore.save(token, null);

	return pb;
}

/**
 * Fetch a PocketBase collection using raw HTTP — bypasses SDK filter encoding.
 * Use when the SDK's URL encoding breaks boolean/complex filters.
 *
 * Note: `sort` is applied client-side because combining sort + filter in the
 * query string causes Railway's PocketBase to reject the request.
 */
export async function adminFetch(
	collection: string,
	params: Record<string, string | number> = {}
): Promise<any[]> {
	const baseUrl = normalizeBaseUrl(requireEnv('POCKETBASE_URL'));
	const token   = await getAdminToken(baseUrl);

	// Build query string — omit sort (applied client-side) and filter (appended raw)
	const qs = new URLSearchParams();
	qs.set('perPage', String(params.perPage ?? 200));
	qs.set('page',    String(params.page    ?? 1));
	if (params.fields) qs.set('fields', String(params.fields));
	if (params.expand) qs.set('expand', String(params.expand));

	// Append filter without encoding — PocketBase rejects %3D in filter values
	const filterStr = params.filter ? `&filter=${params.filter}` : '';
	const url = `${baseUrl}/api/collections/${collection}/records?${qs.toString()}${filterStr}`;

	const res  = await fetch(url, { headers: { Authorization: token } });
	const data = await res.json();
	let items: any[] = data.items ?? [];

	// Client-side sort (e.g. '-created' → descending by created)
	if (params.sort) {
		const sortKey = String(params.sort);
		const desc    = sortKey.startsWith('-');
		const field   = sortKey.replace(/^[-+]/, '');
		items = items.sort((a, b) => {
			const av = a[field] ?? '';
			const bv = b[field] ?? '';
			return desc ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
		});
	}

	return items;
}
