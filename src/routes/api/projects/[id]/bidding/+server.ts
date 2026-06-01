/**
 * PATCH /api/projects/[id]/bidding
 * Toggles biddingOpen on a project. Restricted to admin, leader, and manager roles.
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	if (!['admin', 'leader', 'manager'].includes(ctx.role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json().catch(() => ({})) as Record<string, any>;
	const { biddingOpen } = body;

	if (typeof biddingOpen !== 'boolean') {
		return json({ message: 'biddingOpen must be a boolean' }, { status: 400 });
	}

	try {
		const project = await ctx.pb.collection('projects').update(params.id, { biddingOpen });
		return json({ id: project.id, biddingOpen: project.biddingOpen });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to update project' }, { status: 500 });
	}
};
