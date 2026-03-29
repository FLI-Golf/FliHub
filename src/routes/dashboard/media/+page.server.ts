import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;
	try {
		
		const [assets, franchises, projects, campaigns] = await Promise.all([
			pb.collection('media_assets').getFullList().catch((err: any) => {
				console.error('Failed to fetch media_assets:', err?.message, err?.status);
				return [];
			}),
			pb.collection('franchises').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			pb.collection('projects').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			pb.collection('campaigns').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => [])
		]);
	
		// Pass PocketBase URL and auth token to the client so uploads go directly
		// to PocketBase, bypassing Netlify's 1MB function body limit.
		const pbUrl = env.POCKETBASE_URL || 'http://127.0.0.1:8090';
		const authToken = locals.pb.authStore.token || '';
	
		return { assets, franchises, projects, campaigns, pbUrl, authToken };
	} catch (err: any) {
		console.error('media load error:', err?.message ?? err);
		return {};
	}
};
