import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	try {
		const adminPb = await getAdminPocketBase();

		const workOrders = await adminPb.collection('work_orders').getFullList({
			sort:   '-id',
			expand: 'claimId,expense,task,project,approver,submittedBy,qb_entered_by',
		}).catch(() => []);

		const enriched = await Promise.all((workOrders as any[]).map(async (wo) => {
			let claim       = wo.expand?.claimId    ?? null;
			let expense     = wo.expand?.expense    ?? null;
			let task        = wo.expand?.task       ?? null;
			let project     = wo.expand?.project    ?? null;
			let approver    = wo.expand?.approver   ?? null;
			let submittedBy = wo.expand?.submittedBy ?? null;
			let qbEnteredBy = wo.expand?.qb_entered_by ?? null;
			let claimItems: any[] = [];
			let approval: any = null;

			// Reimbursement: load line items
			if (wo.source === 'reimbursement' && claim?.id) {
				claimItems = await adminPb.collection('reimbursement_items')
					.getFullList({ filter: `claim="${claim.id}"`, sort: 'date' })
					.catch(() => []);
			}

			// Expense: load linked approval + resolve task/project if missing
			if (wo.source === 'expense' && expense?.id) {
				const approvals = await adminPb.collection('approvals')
					.getFullList({ filter: `expenseId="${expense.id}"`, expand: 'requestedBy,approver', sort: '-requestedDate' })
					.catch(() => []);
				approval = approvals[0] ?? null;

				if (!task && expense?.taskId) {
					task = await adminPb.collection('tasks').getOne(expense.taskId).catch(() => null);
				}
				if (!project && task?.projectId) {
					const pid = typeof task.projectId === 'string' ? task.projectId : task.projectId?.id;
					if (pid) project = await adminPb.collection('projects').getOne(pid).catch(() => null);
				}
			}

			return { ...wo, _claim: claim, _qbEnteredBy: qbEnteredBy, _expense: expense, _task: task, _project: project, _approver: approver, _submittedBy: submittedBy, _claimItems: claimItems, _approval: approval };
		}));

		const stats = {
			total:       enriched.length,
			open:        enriched.filter((w: any) => w.status === 'open').length,
			paid:        enriched.filter((w: any) => w.status === 'paid').length,
			cancelled:   enriched.filter((w: any) => w.status === 'cancelled').length,
			totalAmount: enriched.reduce((s: number, w: any) => s + (w.amount || 0), 0),
			openAmount:  enriched.filter((w: any) => w.status === 'open').reduce((s: number, w: any) => s + (w.amount || 0), 0),
		};

		return { workOrders: enriched, stats };
	} catch (e: any) {
		console.error('work-orders load error:', e.message);
		return { workOrders: [], stats: { total: 0, open: 0, paid: 0, cancelled: 0, totalAmount: 0, openAmount: 0 } };
	}
};
