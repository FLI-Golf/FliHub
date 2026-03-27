import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import PocketBase from 'pocketbase';

export const load: PageServerLoad = async ({ locals }) => {
	// media_assets has public listRule — no auth needed to read
	const pb = new PocketBase(env.POCKETBASE_URL);

	const [assets, franchises, projects, campaigns] = await Promise.all([
		pb.collection('media_assets').getFullList().catch((err: any) => {
			console.error('Failed to fetch media_assets:', err?.message, err?.status);
			return [];
		}),
		locals.pb.collection('franchises').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
		locals.pb.collection('projects').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
		locals.pb.collection('campaigns').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => [])
	]);

	// Pass PocketBase URL and auth token to the client so uploads go directly
	// to PocketBase, bypassing Netlify's 1MB function body limit.
	const pbUrl = env.POCKETBASE_URL || 'http://127.0.0.1:8090';
	const authToken = locals.pb.authStore.token || '';

	return { assets, franchises, projects, campaigns, pbUrl, authToken };
};
