import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx     = await RequestContext.from(locals, url);
	const pb      = ctx.pb;
	const profile = ctx.profile;
	const isAdmin = profile?.role === 'admin' || profile?.role === 'leader';

	try {
		// Vendors for the optional vendor picker
		const vendors = await pb.collection('vendors').getFullList({
			sort: 'name', fields: 'id,name'
		}).catch(() => []);

		// Tax-Exempt Reimbursements department + Ina's profile
		const reimbDept = await pb.collection('departments').getFirstListItem(
			`name = "Tax-Exempt Reimbursements"`, { expand: 'headOfDepartment' }
		).catch(() => null);
		const cpa = (reimbDept as any)?.expand?.headOfDepartment ?? null;

		// My claims — always load for the current user
		const myClaims = await pb.collection('reimbursement_claims').getFullList({
			filter:  `claimant = "${profile?.id}"`,
			sort:    '-created',
			expand:  'claimant'
		}).catch(() => []);

		// Load items for each of my claims (expand vendorId for display)
		const myClaimIds = (myClaims as any[]).map(c => c.id);
		const myItems = myClaimIds.length
			? await pb.collection('reimbursement_items').getFullList({
				filter: myClaimIds.map(id => `claim = "${id}"`).join(' || '),
				sort:   'claim,date',
				expand: 'vendorId'
			}).catch(() => [])
			: [];

		// Admin: load all claims from everyone
		let allClaims: any[] = [];
		let allItems:  any[] = [];
		if (isAdmin) {
			allClaims = await pb.collection('reimbursement_claims').getFullList({
				sort:   '-created',
				expand: 'claimant,paidBy'
			}).catch(() => []);

			const allIds = (allClaims as any[]).map(c => c.id);
			allItems = allIds.length
				? await pb.collection('reimbursement_items').getFullList({
					filter: allIds.map(id => `claim = "${id}"`).join(' || '),
					sort:   'claim,date',
					expand: 'vendorId'
				}).catch(() => [])
				: [];
		}

		// Summary metrics (admin)
		const pendingCount   = (allClaims as any[]).filter(c => c.status === 'submitted' || c.status === 'under_review').length;
		const approvedTotal  = (allClaims as any[]).filter(c => c.status === 'approved').reduce((s, c) => s + (c.totalAmount || 0), 0);
		const paidTotal      = (allClaims as any[]).filter(c => c.status === 'paid').reduce((s, c) => s + (c.totalAmount || 0), 0);

		return {
			profile,
			isAdmin,
			vendors,
			myClaims,
			myItems,
			allClaims,
			allItems,
			metrics: { pendingCount, approvedTotal, paidTotal, totalClaims: (allClaims as any[]).length },
			reimbDept,
			cpa,
		};
	} catch {
		return { profile, isAdmin, vendors: [], myClaims: [], myItems: [], allClaims: [], allItems: [], metrics: null, reimbDept: null, cpa: null };
	}
};
