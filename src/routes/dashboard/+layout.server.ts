import { isRedirect, redirect } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { LayoutServerLoad } from './$types';

const ROLE_DASHBOARD_PATHS: Record<string, string[]> = {
	pro: [
		'/dashboard/welcome',
		'/dashboard/onboarding',
		'/dashboard/player-profile',
		'/dashboard/my-payments',
		'/dashboard/reimbursements',
		'/dashboard/settings',
	],
	manager: [
		'/dashboard/welcome',
		'/dashboard/onboarding',
		'/dashboard/player-profile',
		'/dashboard/my-payments',
		'/dashboard/reimbursements',
		'/dashboard/settings',
	],
	broadcaster: [
		'/dashboard/welcome',
		'/dashboard/onboarding',
		'/dashboard/player-profile',
		'/dashboard/my-payments',
		'/dashboard/reimbursements',
		'/dashboard/settings',
	],
};

function isPathAllowedForRole(role: string, path: string): boolean {
	const allowed = ROLE_DASHBOARD_PATHS[role] ?? [];
	return allowed.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export const load: LayoutServerLoad = async ({ locals, url }) => {
	try {
		// RequestContext.from handles:
		//   - unauthenticated → redirect to /auth/login
		//   - vendor role     → redirect to /vendor/dashboard
		const ctx = await RequestContext.from(locals, url);
		const { pb, profile } = ctx;

		// Dashboard is mostly admin-oriented, but some roles have specific dashboard pages.
		if (ctx.role !== 'admin' && !isPathAllowedForRole(ctx.role, url.pathname)) {
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
