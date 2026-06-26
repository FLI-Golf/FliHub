import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getRoleHomeHref } from '$lib/domain/routing/RoleRouteManifest';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) throw redirect(303, '/auth/login');

	throw redirect(303, getRoleHomeHref(ctx.role));
};
