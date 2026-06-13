import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	try {
		const adminPb = await getAdminPocketBase();

		const [workOrders, bankAccounts] = await Promise.all([
			adminPb.collection('work_orders').getFullList({
			sort:   '-id',
			expand: 'claimId,expense,task,project,approver,submittedBy,qb_entered_by',
			}).catch(() => []),
			adminPb.collection('bank_accounts').getFullList({
				filter: 'status = "active" || status = ""',
				sort: 'sortOrder,code',
				fields: 'id,code,name,accountType,groupType,status',
			}).catch(() => [])
		]);

		const enriched = await Promise.all((workOrders as any[]).map(async (wo) => {
			let claim       = wo.expand?.claimId       ?? null;
			let expense     = wo.expand?.expense       ?? null;
			let task        = wo.expand?.task          ?? null;
			let project     = wo.expand?.project       ?? null;
			let approver    = wo.expand?.approver      ?? null;
			let submittedBy = wo.expand?.submittedBy   ?? null;
			let qbEnteredBy = wo.expand?.qb_entered_by ?? null;
			let claimItems: any[] = [];
			let approval: any    = null;
			let bid: any         = null;
			let vendor: any      = null;
			let approvalVoters: any[] = [];

			// Reimbursement: load line items
			if (wo.source === 'reimbursement' && claim?.id) {
				const claimItemsRaw = await adminPb.collection('reimbursement_items')
					.getFullList({ filter: `claim="${claim.id}"`, sort: 'date' })
					.catch(() => []);

				claimItems = (claimItemsRaw as any[]).map((item: any) => {
					const receiptFiles = Array.isArray(item.receipts) ? item.receipts.filter(Boolean) : [];
					const receiptAssets = receiptFiles.map((filename: string) => {
						const lower = String(filename).toLowerCase();
						const isPdf = lower.endsWith('.pdf');
						const isImage = /\.(png|jpe?g|webp|gif|bmp|svg)$/.test(lower);
						return {
							filename,
							isPdf,
							isImage,
							url: adminPb.files.getURL(item, filename),
							thumbUrl: isImage ? adminPb.files.getURL(item, filename, { thumb: '320x0' }) : null,
						};
					});

					return {
						...item,
						_receiptAssets: receiptAssets,
					};
				});
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

			// Bid: load full bid, vendor, approval, voters, expense, project
			if (wo.source === 'bid' && wo.bidId) {
				bid = await adminPb.collection('bids').getOne(wo.bidId, {
					expand: 'projectId,vendorId',
				}).catch(() => null);

				vendor  = bid?.expand?.vendorId  ?? null;
				project = bid?.expand?.projectId ?? project;

				// Load the approval for this bid
				const bidApprovals = await adminPb.collection('approvals')
					.getFullList({
						filter: `bidId="${wo.bidId}"`,
						expand: 'requestedBy,approver',
						sort:   '-created',
					}).catch(() => []);
				approval = bidApprovals[0] ?? null;

				// Resolve each voter profile from the approvers JSON array
				if (approval) {
					let voterIds: string[] = [];
					try {
						const raw = approval.approvers;
						if (Array.isArray(raw)) voterIds = raw;
						else if (typeof raw === 'string' && raw.trim().startsWith('[')) voterIds = JSON.parse(raw);
					} catch { /* empty */ }

					approvalVoters = (await Promise.all(
						voterIds.map((id: string) =>
							adminPb.collection('user_profiles').getOne(id, {
								fields: 'id,firstName,lastName,email,role',
							}).catch(() => null)
						)
					)).filter(Boolean);
				}

				// Resolve expense linked to this WO
				if (!expense && wo.expenseId) {
					expense = await adminPb.collection('expenses').getOne(wo.expenseId).catch(() => null);
				}

				// Resolve submittedBy from approver profile if not already set
				if (!submittedBy && approval?.expand?.requestedBy) {
					submittedBy = approval.expand.requestedBy;
				}
			}

			return {
				...wo,
				_claim:          claim,
				_qbEnteredBy:    qbEnteredBy,
				_expense:        expense,
				_task:           task,
				_project:        project,
				_approver:       approver,
				_submittedBy:    submittedBy,
				_claimItems:     claimItems,
				_approval:       approval,
				_bid:            bid,
				_vendor:         vendor,
				_approvalVoters: approvalVoters,
			};
		}));

		const stats = {
			total:       enriched.length,
			open:        enriched.filter((w: any) => w.status === 'open').length,
			paid:        enriched.filter((w: any) => w.status === 'paid').length,
			cancelled:   enriched.filter((w: any) => w.status === 'cancelled').length,
			totalAmount: enriched.reduce((s: number, w: any) => s + (w.amount || 0), 0),
			openAmount:  enriched.filter((w: any) => w.status === 'open').reduce((s: number, w: any) => s + (w.amount || 0), 0),
		};

		return { workOrders: enriched, stats, bankAccounts };
	} catch (e: any) {
		console.error('work-orders load error:', e.message);
		return { workOrders: [], stats: { total: 0, open: 0, paid: 0, cancelled: 0, totalAmount: 0, openAmount: 0 }, bankAccounts: [] };
	}
};
