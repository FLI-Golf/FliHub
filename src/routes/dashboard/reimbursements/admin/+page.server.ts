import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { redirect } from '@sveltejs/kit';
import {
	groupSuspectedDuplicates,
	requiresBusinessPurposeReview,
	toDateOnly
} from '$lib/domain/reimbursements/integrity';
import {
	DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL,
	REIMBURSEMENT_MAX_TOTAL_SETTING_KEY
} from '$lib/domain/schemas/reimbursement.schema';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx     = await RequestContext.from(locals, url);
	const profile = ctx.profile;
	const role = profile?.role;
	const isAdmin = role === 'admin' || role === 'leader' || role === 'marketing_lead' || role === 'sales' || role === 'franchise_owner' || role === 'pro' || role === 'broadcaster' || role === 'league_owner';
	const canViewAllClaims = role === 'admin' || role === 'leader';

	if (!isAdmin) redirect(302, '/dashboard/reimbursements');

	const adminPb = await getAdminPocketBase();

	const claimFilter = !canViewAllClaims && profile?.id
		? `claimant="${profile.id}"`
		: '';

	const [claims, settings] = await Promise.all([
		adminPb.collection('reimbursement_claims').getFullList({
			sort: '-id',
			filter: claimFilter,
			expand: 'claimant,paidBy,department'
		}).catch(() => []),
		adminPb.collection('settings').getFullList({ fields: 'id,key,value,label' }).catch(() => []),
	]);

	const claimIds = (claims as any[]).map((c: any) => c.id);
	const loadedItems = claimIds.length
		? await adminPb.collection('reimbursement_items').getFullList({
			filter: claimIds.map((id: string) => `claim="${id}"`).join('||'),
			sort: 'date',
			expand: 'vendorId,bankStatement'
		}).catch(() => [])
		: [];
	const items = (loadedItems as any[]).filter((item: any) => item.isArchived !== true);
	const canAudit = role === 'admin' || role === 'leader';
	const claimById = new Map((claims as any[]).map((claim: any) => [claim.id, claim]));
	const auditTransactions = items.map((item: any) => {
		const claim = claimById.get(item.claim);
		const claimant = claim?.expand?.claimant;
		return {
			...item,
			claimantId: claim?.claimant ?? '',
			claimantName: [claimant?.firstName, claimant?.lastName].filter(Boolean).join(' ') || claimant?.email || '—',
			claimTitle: claim?.title ?? '—',
			claimStatus: claim?.status ?? '',
			transactionDate: toDateOnly(item.date) ?? '',
			bankStatement: item.expand?.bankStatement ?? item.bankStatement ?? null
		};
	});
	const duplicateGroups = canAudit ? groupSuspectedDuplicates(auditTransactions) : [];
	const businessPurposeItems = canAudit
		? auditTransactions.filter((item: any) =>
			item.businessPurposeStatus === 'unconfirmed'
			|| (item.businessPurposeStatus !== 'confirmed' && requiresBusinessPurposeReview(item))
		)
		: [];

	const maxClaimTotalSetting = (settings as any[]).find((s: any) => s.key === REIMBURSEMENT_MAX_TOTAL_SETTING_KEY);
	const maxClaimTotalParsed = Number(maxClaimTotalSetting?.value);
	const maxClaimTotal = Number.isFinite(maxClaimTotalParsed) && maxClaimTotalParsed > 0
		? maxClaimTotalParsed
		: DEFAULT_REIMBURSEMENT_MAX_CLAIM_TOTAL;

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

	return { claims, items, metrics, profile, isAdmin, canAudit, duplicateGroups, businessPurposeItems, maxClaimTotal };
};
