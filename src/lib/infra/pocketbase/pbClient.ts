import PocketBase from 'pocketbase';
import { POCKETBASE_URL } from '$env/static/private';

let pbInstance: PocketBase | null = null;

export function getPocketBase(): PocketBase {
	if (!pbInstance) {
		pbInstance = new PocketBase(POCKETBASE_URL || 'http://127.0.0.1:8090');
		pbInstance.autoCancellation(false);
	}
	return pbInstance;
}

export function createPocketBaseClient(url?: string): PocketBase {
	return new PocketBase(url || POCKETBASE_URL || 'http://127.0.0.1:8090');
}
