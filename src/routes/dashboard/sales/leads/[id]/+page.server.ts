import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	const lead = await pb.collection('franchise_leads')
		.getOne(params.id, { expand: 'assignedTo,sponsorId' })
		.catch(() => null);

	if (!lead) throw error(404, 'Lead not found');

	const [territories, userProfiles, sponsors] = await Promise.all([
		pb.collection('franchise_territories').getFullList({ sort: 'name', fields: 'id,name,code,state,city,status' }).catch(() => []),
		pb.collection('user_profiles').getFullList({ filter: 'role = "leader" || role = "sales"', sort: 'firstName,lastName', fields: 'id,firstName,lastName,email' }).catch(() => []),
		pb.collection('sponsors').getFullList({ sort: 'companyName', fields: 'id,companyName,status' }).catch(() => []),
	]);

	return { lead, territories, userProfiles, sponsors };
};
