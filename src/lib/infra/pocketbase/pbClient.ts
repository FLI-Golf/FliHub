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
export async function getAdminPocketBase(): Promise<PocketBase> {
	const baseUrl = (env.POCKETBASE_URL || 'https://pocketbase-production-6ab5.up.railway.app').replace(/\/$/, '');
	const pb = new PocketBase(baseUrl);
	pb.autoCancellation(false);
	try {
		// Authenticate via raw fetch to get the token, then load it into the store
		const res = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ identity: env.POCKETBASE_ADMIN_EMAIL, password: env.POCKETBASE_ADMIN_PASSWORD }),
		});
		if (res.ok) {
			const data = await res.json();
			pb.authStore.save(data.token, data.record);
		} else {
			console.error('Admin auth failed:', res.status, await res.text());
		}
	} catch (err: any) {
		console.error('Admin auth error:', err.message);
	}
	return pb;
}
