import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';

let pbInstance: PocketBase | null = null;

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
let _adminToken: string | null = null;
let _adminTokenExpiry = 0;

async function getAdminToken(): Promise<string> {
	// Reuse token for up to 10 minutes
	if (_adminToken && Date.now() < _adminTokenExpiry) return _adminToken;

	const baseUrl = (env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app').replace(/\/$/, '');
	const res = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
		method:  'POST',
		headers: { 'Content-Type': 'application/json' },
		body:    JSON.stringify({ identity: env.POCKETBASE_ADMIN_EMAIL, password: env.POCKETBASE_ADMIN_PASSWORD }),
	});
	const data = await res.json();
	_adminToken = data.token;
	_adminTokenExpiry = Date.now() + 10 * 60 * 1000;
	return _adminToken as string;
}

export async function getAdminPocketBase(): Promise<PocketBase> {
	const baseUrl = (env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app').replace(/\/$/, '');
	const pb = new PocketBase(baseUrl);
	pb.autoCancellation(false);

	const token = await getAdminToken();

	// Inject the token via beforeSend so the SDK never tries to re-auth
	pb.beforeSend = (url, options) => {
		options.headers = { ...(options.headers ?? {}), Authorization: token };
		return { url, options };
	};

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
	const baseUrl = (env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app').replace(/\/$/, '');
	const token   = await getAdminToken();

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
