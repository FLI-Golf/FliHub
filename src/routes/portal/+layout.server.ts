import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { PortholeFactory } from '$lib/domain/porthole/RolePorthole';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	if (!ctx?.userId) {
		throw redirect(303, '/auth/login');
	}

	// Admin users belong in /dashboard, not /portal
	if (ctx.role === 'admin') {
		throw redirect(303, '/dashboard');
	}

	const role    = ctx.role ?? 'admin';
	const porthole = PortholeFactory.for(role);

	// Merge config with nav that includes the injected profile link
	const config = {
		...porthole.config,
		nav: porthole.getNavItems(),
	};

	return {
		portalRole:    role,
		portalConfig:  config,
		portalProfile: {
			firstName: ctx.profile?.firstName ?? null,
			lastName:  ctx.profile?.lastName  ?? null,
			email:     ctx.profile?.email     ?? null,
		},
	};
};
