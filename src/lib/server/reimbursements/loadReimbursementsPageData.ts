import { RequestContext } from '$lib/infra/RequestContext';
import {
	DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL,
	REIMBURSEMENT_MAX_TOTAL_SETTING_KEY
} from '$lib/domain/schemas/reimbursement.schema';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { FetchReimbursementsForThisUser } from '$lib/domain/services/FetchReimbursementsForThisUser';

export async function loadReimbursementsPageData(locals: App.Locals, url: URL) {
	const ctx = await RequestContext.from(locals, url);

	const pb = ctx.pb;
	const profile = ctx.profile;
	const isAdmin = profile?.role === 'admin';

	try {
		const vendors = await pb.collection('vendors').getFullList({
			sort: 'name',
			fields: 'id,name'
		}).catch(() => []);

		const reimbDept = await pb.collection('departments').getFirstListItem(
			`name = "Tax-Exempt Reimbursements"`,
			{ expand: 'headOfDepartment' }
		).catch(() => null);
		const cpa = (reimbDept as any)?.expand?.headOfDepartment ?? null;

		const adminPb = await getAdminPocketBase();
		const reimbursementFetcher = new FetchReimbursementsForThisUser(adminPb);
		const { resolvedProfile, myClaims, myItems, myBankStatements } = await reimbursementFetcher.execute({
			profileId: profile?.id ?? null,
			sessionUserId: ctx.userId
		});

		let allClaims: any[] = [];
		let allItems: any[] = [];
		const settings = await adminPb.collection('settings').getFullList({ fields: 'id,key,value,label' }).catch(() => []);
		const maxClaimTotalSetting = (settings as any[]).find((setting: any) => setting.key === REIMBURSEMENT_MAX_TOTAL_SETTING_KEY);
		const maxClaimTotalParsed = Number(maxClaimTotalSetting?.value);
		const maxClaimTotal = Number.isFinite(maxClaimTotalParsed) && maxClaimTotalParsed > 0
			? maxClaimTotalParsed
			: DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL;

		if (isAdmin) {
			allClaims = await adminPb.collection('reimbursement_claims').getFullList({
				sort: '-id',
				expand: 'claimant,paidBy,department'
			}).catch(() => []);

			const allIds = allClaims.map((claim: any) => claim.id);
			if (allIds.length) {
				allItems = await adminPb.collection('reimbursement_items').getFullList({
					filter: allIds.map((id: string) => `claim="${id}"`).join('||'),
					sort: 'date',
					expand: 'vendorId'
				}).catch(() => []);
			}
		}

		const pendingCount = allClaims.filter((claim) => claim.status === 'submitted' || claim.status === 'under_review').length;
		const approvedTotal = allClaims.filter((claim) => claim.status === 'approved').reduce((sum, claim) => sum + (claim.totalAmount || 0), 0);
		const paidTotal = allClaims.filter((claim) => claim.status === 'paid').reduce((sum, claim) => sum + (claim.totalAmount || 0), 0);

		return {
			profile,
			resolvedProfile,
			isAdmin,
			vendors,
			myClaims,
			myItems,
			myBankStatements,
			allClaims,
			allItems,
			metrics: { pendingCount, approvedTotal, paidTotal, totalClaims: allClaims.length },
			reimbDept,
			cpa,
			maxClaimTotal,
			maxClaimTotalSettingId: maxClaimTotalSetting?.id ?? null
		};
	} catch (error: any) {
		console.error('[reimb] load error:', error?.message);
		return {
			profile,
			resolvedProfile: null,
			isAdmin,
			vendors: [],
			myClaims: [],
			myItems: [],
			myBankStatements: [],
			allClaims: [],
			allItems: [],
			metrics: null,
			reimbDept: null,
			cpa: null,
			maxClaimTotal: DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL,
			maxClaimTotalSettingId: null
		};
	}
}