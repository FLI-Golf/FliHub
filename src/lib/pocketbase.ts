// Re-export PocketBase client for convenience
import { getPocketBase } from '$lib/infra/pocketbase/pbClient';
export const pb = getPocketBase();
