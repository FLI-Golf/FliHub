import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const pb = ctx.pb;

	const bridge = await pb
		.collection('sponsor_franchise_bridge')
		.getOne(params.id, { expand: 'sponsorId,franchiseId' })
		.catch(() => null);

	if (!bridge) throw error(404, 'Bridge record not found');

	return { bridge };
};

export const actions: Actions = {
	update: async ({ locals, url, params, request }) => {
		const ctx = await RequestContext.from(locals, url);
		const data = await request.formData();

		try {
			await ctx.pb.collection('sponsor_franchise_bridge').update(params.id, {
				sponsorshipLevel: data.get('sponsorshipLevel') || '',
				annualAmount:     data.get('annualAmount')     ? Number(data.get('annualAmount'))  : null,
				dealValue:        data.get('dealValue')        ? Number(data.get('dealValue'))     : null,
				startDate:        data.get('startDate')        || null,
				endDate:          data.get('endDate')          || null,
				status:           data.get('status')           || ''
			});
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Failed to update' });
		}

		throw redirect(303, `/dashboard/sponsors/bridge/${params.id}`);
	},

	delete: async ({ locals, url, params }) => {
		const ctx = await RequestContext.from(locals, url);
		const bridge = await ctx.pb
			.collection('sponsor_franchise_bridge')
			.getOne(params.id, { fields: 'sponsorId' })
			.catch(() => null);

		await ctx.pb.collection('sponsor_franchise_bridge').delete(params.id);
		throw redirect(303, bridge?.sponsorId
			? `/dashboard/sponsors/${bridge.sponsorId}`
			: '/dashboard/sponsors');
	}
};
