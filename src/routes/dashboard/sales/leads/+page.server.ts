import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	const [leads, territories, userProfiles] = await Promise.all([
		pb.collection('franchise_leads').getFullList({ sort: '-created', expand: 'assignedTo' }).catch(() => []),
		pb.collection('franchise_territories').getFullList({ sort: 'name', fields: 'id,name,state' }).catch(() => []),
		pb.collection('user_profiles').getFullList({ filter: 'role = "leader" || role = "sales"', sort: 'firstName,lastName', fields: 'id,firstName,lastName' }).catch(() => []),
	]);

	return { leads, territories, userProfiles };
};
