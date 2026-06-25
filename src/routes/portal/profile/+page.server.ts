import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent(); // ensure layout auth ran
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) return { profile: null, roleExtra: {} };

	const profile = await ctx.pb.collection('user_profiles')
		.getFirstListItem(`userId = "${ctx.userId}"`, {
			expand: 'departmentId,vendorId',
		})
		.catch(() => null);

	// Role-specific relational labels
	const roleExtra: Record<string, string | null> = {};

	if (profile?.expand?.departmentId) {
		roleExtra.departmentName = profile.expand.departmentId.name ?? null;
	}
	if (profile?.expand?.vendorId) {
		roleExtra.vendorName = (profile.expand.vendorId as any).name ?? null;
	}

	return { profile, roleExtra };
};

export const actions: Actions = {
	update: async ({ request, locals, url }) => {
		const ctx = await RequestContext.from(locals, url);
		if (!ctx?.userId) return fail(401, { error: 'Unauthorized' });

		const form = await request.formData();

		const profile = await ctx.pb.collection('user_profiles')
			.getFirstListItem(`userId = "${ctx.userId}"`)
			.catch(() => null);

		if (!profile) return fail(404, { error: 'Profile not found' });

		const patch: Record<string, unknown> = {};

		const str = (key: string) => {
			const v = form.get(key);
			return v !== null ? String(v).trim() : undefined;
		};

		// Common fields
		const firstName = str('firstName');
		const lastName  = str('lastName');
		const phone     = str('phone');
		const bio       = str('bio');
		const organization = str('organization');

		if (firstName !== undefined) patch.firstName    = firstName;
		if (lastName  !== undefined) patch.lastName     = lastName;
		if (phone     !== undefined) patch.phone        = phone;
		if (bio       !== undefined) patch.bio          = bio;
		if (organization !== undefined) patch.organization = organization;

		// Role-specific writable fields
		const role = ctx.role;
		if (role === 'broadcaster') {
			const ref = str('broadcasterReference');
			if (ref !== undefined) patch.broadcasterReference = ref || null;
		}
		if (role === 'pro') {
			const ref = str('proReference');
			if (ref !== undefined) patch.proReference = ref || null;
		}

		if (Object.keys(patch).length === 0) {
			return fail(400, { error: 'Nothing to update' });
		}

		try {
			await ctx.pb.collection('user_profiles').update(profile.id, patch);
			return { success: true };
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Save failed' });
		}
	},
};
