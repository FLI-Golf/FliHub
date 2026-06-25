import type { PageServerLoad } from './$types';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async () => {
	try {
		const adminPb = await getAdminPocketBase();
			const [departments, userProfiles, vendors, projects] = await Promise.all([
			adminPb.collection('departments').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
			adminPb.collection('user_profiles').getFullList({ sort: 'firstName,lastName', fields: 'id,firstName,lastName,email' }).catch(() => []),
			adminPb.collection('vendors').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => []),
				adminPb.collection('projects').getFullList({ sort: 'name', fields: 'id,name,status,type,department' }).catch(() => []),
		]);
			return { departments, userProfiles, vendors, projects };
	} catch {
			return { departments: [], userProfiles: [], vendors: [], projects: [] };
	}
};
