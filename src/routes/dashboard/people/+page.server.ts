import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, role } = ctx;

	const isAdmin = role === 'admin';

	const filter = isAdmin ? '' : `userId = "${userId}"`;
	const [people, vendors, departments] = await Promise.all([
		pb.collection('user_profiles').getFullList({ filter, sort: 'firstName,lastName', expand: 'vendorId,proReference' }).catch(() => []),
		isAdmin ? pb.collection('vendors').getFullList({ sort: 'name', fields: 'id,name,active' }).catch(() => []) : Promise.resolve([]),
		isAdmin ? pb.collection('departments').getFullList({ sort: 'name', fields: 'id,name,status' }).catch(() => []) : Promise.resolve([])
	]);

	return { people, vendors, departments, isAdmin };
};
