import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getRoleHomeHref } from '$lib/domain/routing/RoleRouteManifest';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) {
		throw redirect(303, `/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	if (ctx.role !== 'vendor') {
		throw redirect(303, getRoleHomeHref(ctx.role));
	}

	const target = `/portal/vendor${url.pathname.replace(/^\/vendor/, '') || '/dashboard'}${url.search}`;
	throw redirect(308, target);
};
