import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;
	try {
	
		const [departments, userProfiles] = await Promise.all([
			pb.collection('departments').getFullList({ sort: 'name', expand: 'headOfDepartment' }).catch(() => []),
			pb.collection('user_profiles').getFullList({ filter: 'role = "leader"', sort: 'firstName,lastName' }).catch(() => [])
		]);
	
		return { departments, userProfiles };
	} catch (err: any) {
		console.error('departments load error:', err?.message ?? err);
		return {};
	}
};
