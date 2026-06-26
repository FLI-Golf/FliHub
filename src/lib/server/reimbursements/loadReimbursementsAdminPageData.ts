import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import {
	DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL,
	REIMBURSEMENT_MAX_TOTAL_SETTING_KEY
} from '$lib/domain/schemas/reimbursement.schema';
import { FetchReimbursementsForThisUser } from '$lib/domain/services/FetchReimbursementsForThisUser';

type LoadScope = 'all' | 'session';

export async function loadReimbursementsAdminPageData(
	locals: App.Locals,
	url: URL,
	options: { scope?: LoadScope } = {}
) {
	const ctx = await RequestContext.from(locals, url);
	const profile = ctx.profile;
	const isAdmin = profile?.role === 'admin' || profile?.role === 'leader';
	const scope = options.scope ?? 'all';

	const adminPb = await getAdminPocketBase();
	const reimbursementFetcher = new FetchReimbursementsForThisUser(adminPb);

	const [settings, sessionData] = await Promise.all([
		adminPb.collection('settings').getFullList({ fields: 'id,key,value,label' }).catch(() => []),
		scope === 'session'
			? reimbursementFetcher.execute({ profileId: profile?.id ?? null, sessionUserId: ctx.userId })
			: Promise.resolve(null)
	]);

	const claims = scope === 'session'
		? ((sessionData?.myClaims ?? []) as any[])
		: await adminPb.collection('reimbursement_claims').getFullList({
			sort: '-id',
			expand: 'claimant,paidBy,department'
		}).catch(() => []);

	const items = scope === 'session'
		? ((sessionData?.myItems ?? []) as any[])
		: await adminPb.collection('reimbursement_items').getFullList({
			sort: 'date'
		}).catch(() => []);

	const maxClaimTotalSetting = (settings as any[]).find((setting: any) => setting.key === REIMBURSEMENT_MAX_TOTAL_SETTING_KEY);
	const maxClaimTotalParsed = Number(maxClaimTotalSetting?.value);
	const maxClaimTotal = Number.isFinite(maxClaimTotalParsed) && maxClaimTotalParsed > 0
		? maxClaimTotalParsed
		: DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL;

	const metrics = {
		total: claims.length,
		draft: claims.filter((claim: any) => claim.status === 'draft').length,
		submitted: claims.filter((claim: any) => claim.status === 'submitted').length,
		under_review: claims.filter((claim: any) => claim.status === 'under_review').length,
		approved: claims.filter((claim: any) => claim.status === 'approved').length,
		paid: claims.filter((claim: any) => claim.status === 'paid').length,
		rejected: claims.filter((claim: any) => claim.status === 'rejected').length,
		totalPaid: claims.filter((claim: any) => claim.status === 'paid').reduce((sum: number, claim: any) => sum + (claim.totalAmount || 0), 0),
		totalApproved: claims.filter((claim: any) => claim.status === 'approved').reduce((sum: number, claim: any) => sum + (claim.totalAmount || 0), 0),
		totalPending: claims
			.filter((claim: any) => claim.status === 'submitted' || claim.status === 'under_review')
			.reduce((sum: number, claim: any) => sum + (claim.totalAmount || 0), 0)
	};

	const allUsers = await reimbursementFetcher.fetchAllUsers();
	const claimantBreakdown = reimbursementFetcher.buildClaimantBreakdown(claims as any[]);
	const rollupSummary = reimbursementFetcher.buildRollupSummary(claims as any[]);
	const actorLabel = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || profile?.email || 'unknown';
	const actorClaimCount = (claims as any[]).filter((claim: any) => claim.claimant === profile?.id).length;

	const debugClaimant = {
		enabled: true,
		scope,
		path: url.pathname,
		query: url.search,
		userId: ctx.userId,
		actorProfileId: profile?.id ?? null,
		actorLabel,
		actorRole: profile?.role ?? null,
		actorClaimCount,
		totalClaims: claims.length,
		claimantBreakdown,
		rollupSummary,
		sessionIds: { userId: ctx.userId, profileId: profile?.id ?? null },
		allUsers,
		matchSessionUser: reimbursementFetcher.matchSessionUser({
			sessionUserId: ctx.userId,
			profileId: profile?.id ?? null,
			allUsers,
			claimantBreakdown
		})
	};

	return {
		claims,
		items,
		metrics,
		profile,
		isAdmin,
		maxClaimTotal,
		debugClaimant
	};
}