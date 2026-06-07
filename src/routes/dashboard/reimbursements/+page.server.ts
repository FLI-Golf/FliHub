import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx     = await RequestContext.from(locals, url);
	const pb      = ctx.pb;
	const profile = ctx.profile;
	const isAdmin = profile?.role === 'admin' || profile?.role === 'leader';

	try {
		const vendors = await pb.collection('vendors').getFullList({
			sort: 'name', fields: 'id,name'
		}).catch(() => []);

		const reimbDept = await pb.collection('departments').getFirstListItem(
			`name = "Tax-Exempt Reimbursements"`, { expand: 'headOfDepartment' }
		).catch(() => null);
		const cpa = (reimbDept as any)?.expand?.headOfDepartment ?? null;

		const adminPb = await getAdminPocketBase();

		// My claims
		const myClaims = profile?.id
			? await adminPb.collection('reimbursement_claims').getFullList({
				filter:  `claimant="${profile.id}"`,
				sort: '-id',
				expand:  'claimant'
			}).catch(() => [])
			: [];

		const myClaimIds = (myClaims as any[]).map((c: any) => c.id);
		const myItems = myClaimIds.length
			? await adminPb.collection('reimbursement_items').getFullList({
				filter: myClaimIds.map((id: string) => `claim="${id}"`).join('||'),
				sort:   'date',
				expand: 'vendorId'
			}).catch(() => [])
			: [];

		// All claims (admin/leader only)
		let allClaims: any[] = [];
		let allItems:  any[] = [];
		if (isAdmin) {
			allClaims = await adminPb.collection('reimbursement_claims').getFullList({
				sort: '-id',
				expand: 'claimant,paidBy,department'
			}).catch(() => []);

			const allIds = allClaims.map((c: any) => c.id);
			if (allIds.length) {
				allItems = await adminPb.collection('reimbursement_items').getFullList({
					filter: allIds.map((id: string) => `claim="${id}"`).join('||'),
					sort:   'date',
					expand: 'vendorId'
				}).catch(() => []);
			}
		}

		const pendingCount  = allClaims.filter(c => c.status === 'submitted' || c.status === 'under_review').length;
		const approvedTotal = allClaims.filter(c => c.status === 'approved' || c.status === 'approval_submittedto').reduce((s, c) => s + (c.totalAmount || 0), 0);
		const paidTotal     = allClaims.filter(c => c.status === 'paid').reduce((s, c) => s + (c.totalAmount || 0), 0);

		return {
			profile,
			isAdmin,
			vendors,
			myClaims,
			myItems,
			allClaims,
			allItems,
			metrics: { pendingCount, approvedTotal, paidTotal, totalClaims: allClaims.length },
			reimbDept,
			cpa,
		};
	} catch (e: any) {
		console.error('[reimb] load error:', e?.message);
		return { profile, isAdmin, vendors: [], myClaims: [], myItems: [], allClaims: [], allItems: [], metrics: null, reimbDept: null, cpa: null };
	}
};
