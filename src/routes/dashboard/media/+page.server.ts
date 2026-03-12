import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	const [assets, franchises, projects, campaigns] = await Promise.all([
		pb.collection('media_assets').getFullList({
			sort: '-created',
			expand: 'franchise,project,campaign'
		}).catch(() => []),
		pb.collection('franchises').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
		pb.collection('projects').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
		pb.collection('campaigns').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => [])
	]);

	return { assets, franchises, projects, campaigns };
};
