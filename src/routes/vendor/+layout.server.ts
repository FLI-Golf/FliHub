import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
const VENDOR_ROLE = env.VENDOR_ROLE ?? 'vendor';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user    = locals.pb?.authStore?.model;
	const isValid = locals.pb?.authStore?.isValid;

	if (!isValid || !user) {
		throw redirect(303, `/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	// Use admin client so collection rules don't block the profile/vendor lookup
	const pb = await getAdminPocketBase();

	let profile: any = null;
	try {
		const records = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${user.id}"`,
			expand: 'vendorId',
		});
		profile = records[0] ?? null;
	} catch { /* profile may not exist yet */ }

	// Only vendor-role users (and admins) can access the vendor portal
	if (profile && !([VENDOR_ROLE, 'admin'] as string[]).includes(profile.role)) {
		throw redirect(303, '/dashboard');
	}

	return { user, profile, vendor: profile?.expand?.vendorId ?? null };
};
