import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);
	const pb = ctx.pb;

	const sponsor = await pb.collection('sponsors')
		.getOne(params.id, { expand: 'assignedTo' })
		.catch(() => null);

	if (!sponsor) throw error(404, 'Sponsor not found');

	const [payments, purchaseOrders, bridgeRecords, userProfiles, territories, activity] = await Promise.all([
		pb.collection('sponsor_payments')
			.getFullList({ filter: `sponsor = "${params.id}"`, sort: '-dueDate', expand: 'poId' })
			.catch(() => []),
		pb.collection('sponsor_purchase_orders')
			.getFullList({ filter: `sponsorId = "${params.id}"`, sort: '-created' })
			.catch(() => []),
		pb.collection('sponsor_franchise_bridge')
			.getFullList({ filter: `sponsorId = "${params.id}"`, expand: 'franchiseId', sort: '-created' })
			.catch(() => []),
		pb.collection('user_profiles')
			.getFullList({ filter: 'role = "leader" || role = "sales"', sort: 'firstName,lastName', fields: 'id,firstName,lastName,email' })
			.catch(() => []),
		pb.collection('franchise_territories')
			.getFullList({ sort: 'name', fields: 'id,name,code,state,city,status' })
			.catch(() => []),
		pb.collection('sponsor_activity')
			.getFullList({ filter: `sponsorId = "${params.id}"`, sort: '-created' })
			.catch(() => [])
	]);

	return { sponsor, payments, purchaseOrders, bridgeRecords, userProfiles, territories, activity };
};

export const actions: Actions = {
	update: async ({ locals, url, params, request }) => {
		const ctx = await RequestContext.from(locals, url);
		const data = await request.formData();
		try {
			await ctx.pb.collection('sponsors').update(params.id, {
				companyName:         data.get('companyName')         || '',
				type:                data.get('type')                || '',
				tier:                data.get('tier')                || '',
				status:              data.get('status')              || '',
				primaryContactName:  data.get('primaryContactName')  || '',
				primaryContactEmail: data.get('primaryContactEmail') || '',
				primaryContactPhone: data.get('primaryContactPhone') || '',
				location:            data.get('location')            || '',
				territory:           data.get('territory')           || '',
				contractStartDate:   data.get('contractStartDate')   || null,
				contractEndDate:     data.get('contractEndDate')     || null,
				annualCommitment:    data.get('annualCommitment')    ? Number(data.get('annualCommitment'))   : null,
				dealProbability:     data.get('dealProbability')     ? Number(data.get('dealProbability'))    : null,
				lastContactDate:     data.get('lastContactDate')     || null,
				nextFollowUpDate:    data.get('nextFollowUpDate')    || null,
				franchiseInterest:    data.get('franchiseInterest') === 'true',
				franchiseTrackStatus: data.get('franchiseTrackStatus') || null,
				franchiseTrackDate:   data.get('franchiseTrackDate')   || null,
				assignedTo:           data.get('assignedTo')           || null,
				notes:               data.get('notes')               || ''
			});
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Failed to update sponsor' });
		}
		throw redirect(303, `/dashboard/sponsors/${params.id}`);
	},

	assignTerritory: async ({ locals, url, params, request }) => {
		const ctx = await RequestContext.from(locals, url);
		const data = await request.formData();
		const territory = (data.get('territory') as string | null)?.trim() || null;
		try {
			await ctx.pb.collection('sponsors').update(params.id, { territory: territory || '' });
			return { success: true };
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Failed to assign territory' });
		}
	},

	assignRep: async ({ locals, url, params, request }) => {
		const ctx = await RequestContext.from(locals, url);
		const data = await request.formData();
		const userId = data.get('userId') as string | null;
		try {
			const updated = await ctx.pb.collection('sponsors').update(
				params.id,
				{ assignedTo: userId || null },
				{ expand: 'assignedTo' }
			);
			return { success: true, sponsor: updated };
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Failed to assign rep' });
		}
	},

	delete: async ({ locals, url, params }) => {
		const ctx = await RequestContext.from(locals, url);
		await ctx.pb.collection('sponsors').delete(params.id);
		throw redirect(303, '/dashboard/sponsors');
	}
};
