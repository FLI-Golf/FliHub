import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	const [assets, franchises, projects, campaigns] = await Promise.all([
		pb.collection('media_assets').getFullList({
			sort: '-created'
			// No expand — empty relation strings cause PocketBase to error
		}).catch((err: any) => {
			console.error('Failed to fetch media_assets:', err?.message, err?.status);
			return [];
		}),
		pb.collection('franchises').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
		pb.collection('projects').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
		pb.collection('campaigns').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => [])
	]);

	return { assets, franchises, projects, campaigns };
};
