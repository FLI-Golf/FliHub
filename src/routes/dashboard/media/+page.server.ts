import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;
	try {
		const fetchSponsors = async () => {
			const commonFields = 'id,name,companyName,company_name,status';

			const byCompanyName = await pb
				.collection('sponsors')
				.getFullList({ sort: 'companyName', fields: commonFields })
				.catch(() => null);
			if (byCompanyName) return byCompanyName;

			const byName = await pb
				.collection('sponsors')
				.getFullList({ sort: 'name', fields: commonFields })
				.catch(() => null);
			if (byName) return byName;

			return pb
				.collection('sponsors')
				.getFullList({ fields: commonFields })
				.catch((err: any) => {
					console.error('Failed to fetch sponsors for media:', err?.message, err?.status);
					return [];
				});
		};
		
		const [assets, franchises, projects, campaigns, sponsors, people] = await Promise.all([
			pb.collection('media_assets').getFullList().catch((err: any) => {
				console.error('Failed to fetch media_assets:', err?.message, err?.status);
				return [];
			}),
			pb.collection('franchises').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			pb.collection('projects').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			pb.collection('campaigns').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			fetchSponsors(),
			pb.collection('users').getFullList({ sort: 'email', fields: 'id,email,name' }).catch(() => [])
		]);
	
		// Pass PocketBase URL and auth token to the client so uploads go directly
		// to PocketBase, bypassing Netlify's 1MB function body limit.
		const pbUrl = env.POCKETBASE_URL || 'http://127.0.0.1:8090';
		const authToken = locals.pb.authStore.token || '';
	
		return { assets, franchises, projects, campaigns, sponsors, people, pbUrl, authToken };
	} catch (err: any) {
		console.error('media load error:', err?.message ?? err);
		return {};
	}
};
