import { RequestContext } from '$lib/infra/RequestContext';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	try {
		const ctx = await RequestContext.from(locals, url);
		const { pb, profile } = ctx;

		let userDepartment = null;
		if (profile?.role === 'leader' && profile?.id) {
			const depts = await pb.collection('departments')
				.getFullList({ filter: `headOfDepartment = "${profile.id}"` })
				.catch(() => []);
			userDepartment = depts[0] ?? null;
		}

		return {
			user: locals.pb?.authStore?.model ?? null,
			userProfile: profile,
			userDepartment
		};
	} catch (err: any) {
		console.error('Layout load error:', err?.message ?? err);
		return { user: null, userProfile: null, userDepartment: null };
	}
};
