import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { PortholeFactory } from '$lib/domain/porthole/RolePorthole';
import { getRoleRoutePolicy, getRolePortalNav } from '$lib/domain/routing/RoleRouteManifest';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	if (!ctx?.userId) {
		throw redirect(303, '/auth/login');
	}

	const routePolicy = getRoleRoutePolicy(ctx.role);

	// Route users to their role shell when portal layout is not allowed.
	if (!routePolicy.allowPortalLayout) {
		throw redirect(303, routePolicy.homeHref);
	}

	const role    = ctx.role ?? 'admin';
	const porthole = PortholeFactory.for(role);

	// Merge config with nav that includes the injected profile link
	const config = {
		...porthole.config,
		nav: getRolePortalNav(role),
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
