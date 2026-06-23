import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

const EVENT_PAYMENT_MARKER = /\[EP:([^\]]+)\]/;

function formatPaymentTypeLabel(paymentType: string | undefined | null): string {
	switch (paymentType) {
		case 'broadcast_fee': return 'Broadcast fee';
		case 'appearance_fee': return 'Appearance fee';
		case 'bonus': return 'Attendance bonus';
		default: return paymentType ? paymentType.replace(/_/g, ' ') : 'Event payment';
	}
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId } = ctx;

	try {
		const [approvals, settings, draftExpenses] = await Promise.all([
			pb.collection('approvals').getFullList({
				expand: 'requestedBy,approver,expenseId,bidId',
				sort: '-requestedDate'
			}).catch((err: any) => { console.error('[approvals load] fetch failed:', err?.message); return []; }),
			pb.collection('settings').getFullList({ fields: 'id,key,value,label' }).catch(() => []),
			pb.collection('expenses').getFullList({
				filter: `status="draft"`,
				sort: '-date'
			}).catch(() => []),
		]);

		console.log('[approvals load] fetched', (approvals as any[]).length, 'approvals');
		const userProfiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		}).catch(() => []);
		const userProfile = (userProfiles as any[])[0] ?? null;

		// Backfill legacy direct-override event approvals that may have approved expenses
		// and work orders but no approvals row (needed for accurate dashboard counts).
		const approvedEventExpenses = await pb.collection('expenses').getFullList({
			filter: 'status = "approved" && notes ~ "[EP:"',
			fields: 'id,amount,approvedDate,created,submittedBy,notes'
		}).catch(() => [] as any[]);

		const fallbackRequesterId = userProfile?.id
			?? await pb.collection('user_profiles').getFirstListItem('id != ""', { fields: 'id' })
				.then((p: any) => p.id)
				.catch(() => null);

		// Reconcile approved direct event payments that might have been approved without
		// creating their audit artifacts (expense + approval row).
		const approvedDirectPayments = await pb.collection('event_payments').getFullList({
			filter: 'status = "approved" && approvalRoute = "direct"',
			expand: 'event,eventTalent,eventTalent.talent,eventTalent.talentGroup,talent,talentGroup',
			fields: 'id,amount,paymentType,recipient,description,expand.event.name,expand.eventTalent.expand.talent.name,expand.eventTalent.expand.talentGroup.name,expand.talent.name,expand.talentGroup.name'
		}).catch(() => [] as any[]);

		const approvalByExpenseId = new Set((approvals as any[])
			.filter((a: any) => a.entityType === 'expense' && a.entityId)
			.map((a: any) => String(a.entityId)));

		for (const payment of approvedDirectPayments as any[]) {
			const marker = `[EP:${payment.id}]`;
			let expense = await pb.collection('expenses').getFirstListItem(
				`notes ~ "${marker}"`,
				{ fields: 'id,amount,status,submittedBy,created,approvedDate' }
			).catch(() => null as any);

			if (!expense) {
				const eventName = payment?.expand?.event?.name ?? 'Event Payment';
				const payeeName = payment.recipient === 'manager'
					? (payment?.expand?.eventTalent?.expand?.talent?.name
						?? payment?.expand?.talent?.name
						?? 'Manager')
					: (payment?.expand?.eventTalent?.expand?.talentGroup?.name
						?? payment?.expand?.talentGroup?.name
						?? payment?.expand?.eventTalent?.expand?.talent?.name
						?? payment?.expand?.talent?.name
						?? 'Talent');
				const recipientLabel = payment.recipient === 'manager' ? 'Manager' : 'Talent';
				const paymentTypeLabel = formatPaymentTypeLabel(payment.paymentType);

				expense = await pb.collection('expenses').create({
					description: `${eventName} - ${recipientLabel}: ${payeeName} (${paymentTypeLabel})`,
					amount: Number(payment.amount) || 0,
					status: 'approved',
					date: new Date().toISOString().slice(0, 10),
					category: 'Executive/Management Staff',
					notes: `${marker} Auto-reconciled from approved direct event payment.`,
					approvedDate: new Date().toISOString(),
					...(fallbackRequesterId ? { submittedBy: fallbackRequesterId } : {})
				}).catch(() => null as any);
			}

			if (!expense) continue;
			if (approvalByExpenseId.has(String(expense.id))) continue;

			const createdApproval = await pb.collection('approvals').create({
				entityType: 'expense',
				entityId: expense.id,
				expenseId: expense.id,
				status: 'approved',
				amount: Number(expense.amount ?? payment.amount) || 0,
				requestedBy: expense.submittedBy || fallbackRequesterId || null,
				requestedDate: expense.created || new Date().toISOString(),
				reviewedDate: expense.approvedDate || new Date().toISOString(),
				comments: '<p>Reconciled approved event payment audit record.</p>'
			}).catch(() => null as any);

			if (createdApproval) {
				(approvals as any[]).push(createdApproval);
				approvalByExpenseId.add(String(expense.id));
			}
		}

		for (const expense of approvedEventExpenses as any[]) {
			if (approvalByExpenseId.has(String(expense.id))) continue;
			const createdApproval = await pb.collection('approvals').create({
				entityType: 'expense',
				entityId: expense.id,
				expenseId: expense.id,
				status: 'approved',
				amount: Number(expense.amount) || 0,
				requestedBy: expense.submittedBy || fallbackRequesterId || null,
				requestedDate: expense.created || new Date().toISOString(),
				reviewedDate: expense.approvedDate || new Date().toISOString(),
				comments: '<p>Backfilled approved event payment audit record.</p>'
			}).catch(() => null as any);
			if (createdApproval) {
				(approvals as any[]).push(createdApproval);
				approvalByExpenseId.add(String(expense.id));
			}
		}

		const approvalLinkedPayments = new Map<string, any>();
		const eventPaymentIds = Array.from(new Set((approvals as any[])
			.map((approval: any) => String(approval?.expand?.expenseId?.notes ?? '').match(EVENT_PAYMENT_MARKER)?.[1])
			.filter(Boolean) as string[]));

		await Promise.all(eventPaymentIds.map(async (paymentId) => {
			const payment = await pb.collection('event_payments').getOne(paymentId, {
				expand: 'event,eventTalent,eventTalent.talent,eventTalent.talentGroup,talent,talentGroup'
			}).catch(() => null) as any;
			if (payment) approvalLinkedPayments.set(paymentId, payment);
		}));

		const quorumSetting = (settings as any[]).find((s: any) => s.key === 'approval_quorum');
		const quorum = quorumSetting ? Math.max(1, Number(quorumSetting.value)) : 2;
		const quorumSettingId = quorumSetting?.id ?? null;

		// Finalize any pending approvals that already meet quorum (e.g. after quorum was lowered)
		for (const a of approvals as any[]) {
			if (a.status !== 'pending') continue;
			let voters: string[] = [];
			try {
				const raw = a.approvers;
				if (Array.isArray(raw)) voters = raw;
				else if (typeof raw === 'string' && raw.trim().startsWith('[')) voters = JSON.parse(raw);
			} catch { /* empty */ }

			if (voters.length >= quorum) {
				try {
					await pb.collection('approvals').update(a.id, {
						status: 'approved',
						reviewedDate: new Date().toISOString(),
						comments: `<p>Quorum reached — approved by ${voters.length} ${voters.length === 1 ? 'approver' : 'approvers'}.</p>`
					});
					a.status = 'approved'; // update in-memory so stats are correct
					if (a.entityType === 'expense') {
						await pb.collection('expenses').update(a.entityId, {
							status: 'approved',
							approvedDate: new Date().toISOString()
						}).catch(() => {});
					} else if (a.entityType === 'project') {
						await pb.collection('projects').update(a.entityId, {
							status: 'in_progress'
						}).catch(() => {});
					}
				} catch (e: any) {
					console.warn('Could not finalize approval', a.id, e.message);
				}
			}
		}

		// Annotate each approval with parsed voters list and whether current user has voted
		const annotated = (approvals as any[]).map(a => {
			let voters: string[] = [];
			try {
				const raw = a.approvers;
				if (Array.isArray(raw)) voters = raw;
				else if (typeof raw === 'string' && raw.trim().startsWith('[')) voters = JSON.parse(raw);
			} catch { /* empty */ }

			const eventPaymentId = String(a?.expand?.expenseId?.notes ?? '').match(EVENT_PAYMENT_MARKER)?.[1] ?? null;
			const linkedPayment = eventPaymentId ? approvalLinkedPayments.get(eventPaymentId) ?? null : null;
			const linkedTalent = linkedPayment?.expand?.eventTalent?.expand?.talentGroup?.name
				?? linkedPayment?.expand?.talentGroup?.name
				?? linkedPayment?.expand?.eventTalent?.expand?.talent?.name
				?? linkedPayment?.expand?.talent?.name
				?? null;
			return {
				...a,
				voters,
				voteCount: voters.length,
				hasVoted: userProfile ? voters.includes(userProfile.id) : false,
				eventPayment: linkedPayment ? {
					id: linkedPayment.id,
					paymentType: linkedPayment.paymentType,
					paymentTypeLabel: formatPaymentTypeLabel(linkedPayment.paymentType),
					recipient: linkedPayment.recipient,
					amount: linkedPayment.amount,
					description: linkedPayment.description,
					eventName: linkedPayment.expand?.event?.name ?? null,
					talentName: linkedTalent,
					approvalRoute: linkedPayment.approvalRoute,
					isBonus: !!linkedPayment.isBonus,
				} : null,
			};
		});

		const stats = {
			total: annotated.length,
			pending: annotated.filter((a: any) => a.status === 'pending').length,
			approved: annotated.filter((a: any) => a.status === 'approved').length,
			rejected: annotated.filter((a: any) => a.status === 'rejected').length,
			revisionRequested: annotated.filter((a: any) => a.status === 'revision_requested').length,
			byType: {
				expense: annotated.filter((a: any) => a.entityType === 'expense').length,
				project: annotated.filter((a: any) => a.entityType === 'project').length,
				budget: annotated.filter((a: any) => a.entityType === 'budget').length
			},
			totalAmount: annotated.reduce((s: number, a: any) => s + (a.amount || 0), 0),
			pendingAmount: annotated.filter((a: any) => a.status === 'pending').reduce((s: number, a: any) => s + (a.amount || 0), 0),
		};

		return { approvals: annotated, draftExpenses, stats, userProfile, quorum, quorumSettingId };
	} catch (error: any) {
		console.error('Error loading approvals:', error);
		return {
			approvals: [],
			draftExpenses: [],
			stats: { total: 0, pending: 0, approved: 0, rejected: 0, revisionRequested: 0, byType: { expense: 0, project: 0, budget: 0 }, totalAmount: 0, pendingAmount: 0 },
			userProfile: null,
			quorum: 2,
			quorumSettingId: null,
		};
	}
};
