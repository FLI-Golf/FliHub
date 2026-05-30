/**
 * PATCH /api/bids/[id] — advance bid stage (admin only)
 * Valid transitions: submitted → under_review → shortlisted → awarded | not_selected → closed
 * On award: links vendor to project, creates a draft expense, raises a pending approval.
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

const VALID_STATUSES = ['submitted', 'under_review', 'shortlisted', 'awarded', 'not_selected', 'closed'] as const;

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const body = await request.json().catch(() => ({})) as Record<string, any>;

	if (!['admin', 'leader'].includes(ctx.role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	const { status, notes } = body;

	if (status && !VALID_STATUSES.includes(status)) {
		return json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
	}

	const now = new Date().toISOString();
	const extra: Record<string, any> = {};
	if (status === 'awarded')      extra.awardedAt   = now;
	if (status === 'under_review') extra.reviewedAt  = now;

	try {
		const bid = await ctx.pb.collection('bids').update(params.id, {
			...(status !== undefined && { status }),
			...(notes  !== undefined && { notes }),
			...extra,
		});

		// On award: link vendor to project, create a draft expense, then raise an approval
		if (status === 'awarded') {
			const full = await ctx.pb.collection('bids').getOne(params.id, {
				expand: 'projectId,vendorId',
			});

			const project = (full as any).expand?.projectId;
			const vendor  = (full as any).expand?.vendorId;

			// 1. Append vendor to project
			await ctx.pb.collection('projects').update(full.projectId, {
				'vendors+': [full.vendorId],
			}).catch(() => {});

			// 2. Create a draft expense representing the bid value
			const expense = await ctx.pb.collection('expenses').create({
				description:  `Vendor bid — ${vendor?.name ?? 'Vendor'}: ${(full as any).scope ?? ''}`.slice(0, 255),
				amount:       (full as any).amount ?? 0,
				category:     'Consultants',
				status:       'submitted',
				date:         now.slice(0, 10),
				notes:        `Awarded bid. Project: ${project?.name ?? ''}. Scope: ${(full as any).scope ?? ''}`,
				vendor:       full.vendorId,
				bidId:        params.id,
			}).catch(() => null);

			// 3. Raise an approval for the expense
			let approvalId: string | null = null;
			if (expense) {
				const approval = await ctx.pb.collection('approvals').create({
					entityType:    'bid',
					entityId:      params.id,
					bidId:         params.id,
					expenseId:     expense.id,
					projectId:     full.projectId,
					status:        'pending',
					requestedBy:   ctx.profile?.id ?? null,
					requestedDate: now.slice(0, 10),
					amount:        (full as any).amount ?? 0,
					comments:      `Bid awarded to ${vendor?.name ?? 'vendor'} for project "${project?.name ?? ''}". Pending approval before PO is generated.`,
					approvers:     [],
				}).catch(() => null);
				approvalId = approval?.id ?? null;
			}

			return json({ ...bid, expenseId: expense?.id ?? null, approvalId });
		}

		return json(bid);
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to update bid' }, { status: 500 });
	}
};
