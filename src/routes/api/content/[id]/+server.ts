/**
 * PATCH  /api/content/[id] — update stage or any field
 * DELETE /api/content/[id] — delete item
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

const ALLOWED = [
	'title', 'contentType', 'stage', 'description', 'talent', 'assignedTo',
	'dueDate', 'budget', 'actualCost', 'requiresApproval', 'approvalStatus',
	'approvedBy', 'approvedAt', 'publishedUrl', 'paymentStatus', 'notes'
];

export const PATCH: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => ({}));

	const patch: Record<string, any> = {};
	for (const key of ALLOWED) {
		if (key in body) patch[key] = body[key];
	}
	if (!Object.keys(patch).length) return json({ message: 'Nothing to update' }, { status: 400 });

	// Auto-set approvedAt when approving
	if (patch.approvalStatus === 'approved' && !patch.approvedAt) {
		patch.approvedAt = new Date().toISOString();
		patch.approvedBy = ctx.userId;
	}

	try {
		const record = await ctx.pb.collection('content_production').update(params.id, patch);
		return json(record);
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	ctx.requireRole('admin', 'leader');
	try {
		await ctx.pb.collection('content_production').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed' }, { status: 500 });
	}
};
