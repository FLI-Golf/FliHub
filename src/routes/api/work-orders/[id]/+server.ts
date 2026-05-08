import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.from(locals, url);
	const profile = ctx.profile;
	if (profile?.role !== 'admin' && profile?.role !== 'leader') {
		return json({ message: 'Unauthorized' }, { status: 403 });
	}

	try {
		const body    = await request.json();
		const adminPb = await getAdminPocketBase();

		const update: Record<string, any> = {};

		// QB transaction fields
		if (body.qb_transaction_id !== undefined) update.qb_transaction_id = body.qb_transaction_id;
		if (body.qb_entered_by     !== undefined) update.qb_entered_by     = body.qb_entered_by;
		if (body.qb_entered_date   !== undefined) update.qb_entered_date   = body.qb_entered_date;
		if (body.qb_account        !== undefined) update.qb_account        = body.qb_account;
		if (body.qb_notes          !== undefined) update.qb_notes          = body.qb_notes;

		// Status update
		if (body.status !== undefined) update.status = body.status;
		if (body.paidDate !== undefined) update.paidDate = body.paidDate;

		const record = await adminPb.collection('work_orders').update(params.id, update);
		return json(record);
	} catch (e: any) {
		return json({ message: e?.message ?? 'Failed' }, { status: 500 });
	}
};
