import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { RequestContext } from '$lib/infra/RequestContext';
import { getRoleHomeHref } from '$lib/domain/routing/RoleRouteManifest';
import type { LayoutServerLoad } from './$types';

const VENDOR_ROLE = env.VENDOR_ROLE ?? 'vendor';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) {
		throw redirect(303, `/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	if (ctx.role !== VENDOR_ROLE) {
		throw redirect(303, getRoleHomeHref(ctx.role));
	}

	const user = locals.pb?.authStore?.model;
	const pb = await getAdminPocketBase();

	let profile: any = null;
	try {
		const records = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${ctx.userId}"`,
			expand: 'vendorId',
		});
		profile = records[0] ?? null;
	} catch {
		// profile may not exist yet
	}

	return { user, profile, vendor: profile?.expand?.vendorId ?? null };
};
