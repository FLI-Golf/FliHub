/**
 * PATCH /api/bids/[id] — advance bid stage (admin only)
 * Valid transitions: submitted → under_review → shortlisted → awarded | rejected
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

const VALID_STATUSES = ['submitted', 'under_review', 'shortlisted', 'awarded', 'rejected'] as const;

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx  = await RequestContext.from(locals, url);
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

		// If awarded, link vendor to the project
		if (status === 'awarded') {
			const full = await ctx.pb.collection('bids').getOne(params.id, { fields: 'projectId,vendorId' });
			await ctx.pb.collection('projects').update(full.projectId, {
				vendors: { '+': [full.vendorId] }
			}).catch(() => {}); // non-fatal if projects.vendors is not a multi-relation
		}

		return json(bid);
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to update bid' }, { status: 500 });
	}
};
