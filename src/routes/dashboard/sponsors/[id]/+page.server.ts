import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const pb = ctx.pb;

	const sponsor = await pb
		.collection('sponsors')
		.getOne(params.id, { expand: 'assignedTo,franchiseDealId' })
		.catch(() => null);

	if (!sponsor) throw error(404, 'Sponsor not found');

	const [bridgeRecords, payments] = await Promise.all([
		pb
			.collection('sponsor_franchise_bridge')
			.getFullList({ filter: `sponsorId = "${params.id}"`, expand: 'franchiseId', sort: '-created' })
			.catch(() => []),
		pb
			.collection('sponsor_payments')
			.getFullList({ filter: `sponsorId = "${params.id}"`, sort: '-paymentDate' })
			.catch(() => [])
	]);

	return { sponsor, bridgeRecords, payments };
};

export const actions: Actions = {
	update: async ({ locals, url, params, request }) => {
		const ctx = await RequestContext.from(locals, url);
		const data = await request.formData();

		try {
			await ctx.pb.collection('sponsors').update(params.id, {
				companyName:          data.get('companyName')          || '',
				type:                 data.get('type')                 || '',
				tier:                 data.get('tier')                 || '',
				status:               data.get('status')               || '',
				primaryContactName:   data.get('primaryContactName')   || '',
				primaryContactEmail:  data.get('primaryContactEmail')  || '',
				location:             data.get('location')             || '',
				territory:            data.get('territory')            || '',
				contractStartDate:    data.get('contractStartDate')    || null,
				contractEndDate:      data.get('contractEndDate')      || null,
				annualCommitment:     data.get('annualCommitment')     ? Number(data.get('annualCommitment'))  : null,
				totalPaid:            data.get('totalPaid')            ? Number(data.get('totalPaid'))         : null,
				franchiseInterest:    data.get('franchiseInterest') === 'true',
				notes:                data.get('notes')                || ''
			});
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Failed to update sponsor' });
		}

		throw redirect(303, `/dashboard/sponsors/${params.id}`);
	},

	delete: async ({ locals, url, params }) => {
		const ctx = await RequestContext.from(locals, url);
		await ctx.pb.collection('sponsors').delete(params.id);
		throw redirect(303, '/dashboard/sponsors');
	}
};
