import { isRedirect, redirect } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	try {
		// RequestContext.from handles:
		//   - unauthenticated → redirect to /auth/login
		//   - vendor role     → redirect to /vendor/dashboard
		const ctx = await RequestContext.from(locals, url);
		const { pb, profile } = ctx;

		if (ctx.role !== 'admin') {
			throw redirect(303, '/portal');
		}

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
		// Always propagate redirects — never swallow them
		if (isRedirect(err)) throw err;
		console.error('Layout load error:', err?.message ?? err);
		return { user: null, userProfile: null, userDepartment: null };
	}
};
