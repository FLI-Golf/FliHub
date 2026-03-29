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
	const pb = new PocketBase(env.POCKETBASE_URL || 'http://127.0.0.1:8090');
	try {
		await pb.admins.authWithPassword(
			env.POCKETBASE_ADMIN_EMAIL!,
			env.POCKETBASE_ADMIN_PASSWORD!
		);
	} catch (err: any) {
		console.error('Admin auth failed:', err.message);
	}
	return pb;
}
