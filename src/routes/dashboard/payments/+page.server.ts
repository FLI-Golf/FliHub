import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, profile: userProfile } = ctx;

	try {
		const [payments, pendingClaims, pendingExpenses, sponsorPayments] = await Promise.all([
			pb.collection('payments').getFullList({
				sort: '-created',
				expand: 'reimbursementClaim,sponsor,vendor,franchise,processedBy,approvedBy',
			}).catch(() => []),

			// Approved reimbursement claims awaiting payment
			pb.collection('reimbursement_claims').getFullList({
				filter: "status = 'approved'",
				expand: 'claimant',
				sort: '-created',
			}).catch(() => []),

			// Approved expenses awaiting payment
			pb.collection('expenses').getFullList({
				filter: "status = 'approved'",
				expand: 'submittedBy,vendor',
				sort: '-created',
			}).catch(() => []),

			// Sponsor payments due or recent
			pb.collection('sponsor_payments').getFullList({
				sort: '-created',
				expand: 'sponsor',
				fields: 'id,sponsor,amount,status,dueDate,receivedDate,invoiceNumber,paymentType,expand',
			}).catch(() => []),
		]);

		const p = payments as any[];

		// Summary metrics
		const totalOutgoing  = p.filter(x => x.direction === 'outgoing' && x.status === 'paid').reduce((s, x) => s + x.amount, 0);
		const totalIncoming  = p.filter(x => x.direction === 'incoming' && x.status === 'received').reduce((s, x) => s + x.amount, 0);
		const pendingOut     = p.filter(x => x.direction === 'outgoing' && ['pending_approval','approved','scheduled'].includes(x.status)).reduce((s, x) => s + x.amount, 0);
		const pendingIn      = p.filter(x => x.direction === 'incoming' && ['pending_approval','approved','scheduled'].includes(x.status)).reduce((s, x) => s + x.amount, 0);

		// Action queue — approved claims + expenses not yet in payments
		const existingClaimIds = new Set(p.map(x => x.reimbursementClaim).filter(Boolean));
		const actionQueue = [
			...(pendingClaims as any[])
				.filter(c => !existingClaimIds.has(c.id))
				.map(c => ({
					sourceType: 'reimbursement',
					sourceId:   c.id,
					label:      c.referenceNumber ?? c.title,
					sublabel:   `${c.expand?.claimant?.firstName ?? ''} ${c.expand?.claimant?.lastName ?? ''}`.trim(),
					amount:     c.totalAmount ?? 0,
					status:     c.status,
				})),
			...(pendingExpenses as any[]).map(e => ({
				sourceType: 'expense',
				sourceId:   e.id,
				label:      e.description,
				sublabel:   e.expand?.vendor?.name ?? e.expand?.submittedBy?.firstName ?? '',
				amount:     e.amount ?? 0,
				status:     e.status,
			})),
		];

		return {
			userProfile,
			payments: p,
			pendingClaims,
			pendingExpenses,
			sponsorPayments,
			actionQueue,
			metrics: { totalOutgoing, totalIncoming, pendingOut, pendingIn, count: p.length },
		};
	} catch (err: any) {
		console.error('payments load error:', err?.message ?? err);
		return { payments: [], pendingClaims: [], pendingExpenses: [], sponsorPayments: [], actionQueue: [], metrics: null };
	}
};
