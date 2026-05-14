import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId } = ctx;

	try {
		const [approvals, settings, draftExpenses] = await Promise.all([
			pb.collection('approvals').getFullList({
				expand: 'requestedBy,approver,expenseId',
				sort: '-requestedDate'
			}).catch(() => []),
			pb.collection('settings').getFullList({ fields: 'id,key,value,label' }).catch(() => []),
			pb.collection('expenses').getFullList({
				filter: `status="draft"`,
				sort: '-date'
			}).catch(() => []),
		]);

		const userProfiles = await pb.collection('user_profiles').getFullList({
			filter: `userId = "${userId}"`
		}).catch(() => []);
		const userProfile = (userProfiles as any[])[0] ?? null;

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
			return {
				...a,
				voters,
				voteCount: voters.length,
				hasVoted: userProfile ? voters.includes(userProfile.id) : false,
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
