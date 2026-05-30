/**
 * POST /api/bids — submit a new bid from a vendor
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json().catch(() => ({})) as Record<string, any>;

	const { projectId, vendorId, amount, timeline, scope } = body;

	if (!projectId || !vendorId) {
		return json({ message: 'projectId and vendorId are required' }, { status: 400 });
	}
	if (!scope?.trim()) {
		return json({ message: 'Scope of work is required' }, { status: 400 });
	}

	// Prevent duplicate bids from the same vendor on the same project
	const existing = await ctx.pb.collection('bids').getFullList({
		filter: `projectId = "${projectId}" && vendorId = "${vendorId}"`,
		fields: 'id',
	}).catch(() => []);

	if (existing.length > 0) {
		return json({ message: 'You have already submitted a bid for this project.' }, { status: 409 });
	}

	try {
		const bid = await ctx.pb.collection('bids').create({
			projectId,
			vendorId,
			amount:      amount ? Number(amount) : null,
			timeline:    timeline ?? '',
			scope:       scope.trim(),
			status:      'submitted',
			submittedAt: new Date().toISOString(),
		});
		return json(bid, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to submit bid' }, { status: 500 });
	}
};
