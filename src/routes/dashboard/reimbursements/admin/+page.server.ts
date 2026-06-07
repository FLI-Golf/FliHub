import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx     = await RequestContext.from(locals, url);
	const profile = ctx.profile;
	const isAdmin = profile?.role === 'admin' || profile?.role === 'leader';

	if (!isAdmin) redirect(302, '/dashboard/reimbursements');

	const adminPb = await getAdminPocketBase();

	const [claims, items, workOrders] = await Promise.all([
		adminPb.collection('reimbursement_claims').getFullList({
			sort:   '-id',
			expand: 'claimant,paidBy,department'
		}).catch(() => []),
		adminPb.collection('reimbursement_items').getFullList({
			sort: 'date'
		}).catch(() => []),
		adminPb.collection('work_orders').getFullList({
			filter: 'source="reimbursement"',
			sort: '-created',
			fields: 'id,claimId,work_order_number,status,approvedDate,paidDate,paymentMethod,qb_transaction_id,qb_entered_date,qb_account,qb_notes'
		}).catch(() => []),
	]);

	const metrics = {
		total:       claims.length,
		draft:       claims.filter((c: any) => c.status === 'draft').length,
		submitted:   claims.filter((c: any) => c.status === 'submitted').length,
		under_review:claims.filter((c: any) => c.status === 'under_review').length,
		approved:    claims.filter((c: any) => c.status === 'approved').length,
		paid:        claims.filter((c: any) => c.status === 'paid').length,
		rejected:    claims.filter((c: any) => c.status === 'rejected').length,
		totalPaid:   claims.filter((c: any) => c.status === 'paid').reduce((s: number, c: any) => s + (c.totalAmount || 0), 0),
		totalApproved: claims.filter((c: any) => c.status === 'approved').reduce((s: number, c: any) => s + (c.totalAmount || 0), 0),
		totalPending:  claims.filter((c: any) => c.status === 'submitted' || c.status === 'under_review').reduce((s: number, c: any) => s + (c.totalAmount || 0), 0),
	};

	return { claims, items, workOrders, metrics, profile, isAdmin };
};
