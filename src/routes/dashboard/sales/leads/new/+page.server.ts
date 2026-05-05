import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile: currentUser } = ctx;

	const [territories, userProfiles, sponsors, franchises] = await Promise.all([
		pb.collection('franchise_territories').getFullList({ sort: 'name', fields: 'id,name,code,state,city,status' }).catch(() => []),
		pb.collection('user_profiles').getFullList({ filter: 'role = "leader" || role = "sales"', sort: 'firstName,lastName', fields: 'id,firstName,lastName,email' }).catch(() => []),
		pb.collection('sponsors').getFullList({ sort: 'companyName', fields: 'id,companyName,status,primaryContactName,primaryContactEmail,primaryContactPhone,location,territory' }).catch(() => []),
		pb.collection('franchises').getFullList({ sort: 'name', fields: 'id,name,territory' }).catch(() => []),
	]);

	return { territories, userProfiles, sponsors, franchises, currentUserId: currentUser?.id ?? null };
};
