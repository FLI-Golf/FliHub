/**
 * PATCH /api/sponsors/[id] — update sponsor fields (including pipeline stage)
 * DELETE /api/sponsors/[id] — delete a sponsor
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => ({}));

	const allowed = [
		'status', 'tier', 'type', 'companyName', 'primaryContactName',
		'primaryContactEmail', 'primaryContactPhone', 'location', 'territory',
		'annualCommitment', 'dealProbability', 'lastContactDate', 'nextFollowUpDate',
		'franchiseInterest', 'franchiseTrackStatus', 'franchiseTrackDate',
		'contractStartDate', 'contractEndDate', 'assignedTo', 'notes'
	];

	const patch: Record<string, any> = {};
	for (const key of allowed) {
		if (key in body) patch[key] = body[key];
	}

	if (Object.keys(patch).length === 0) {
		return json({ message: 'No valid fields to update' }, { status: 400 });
	}

	try {
		const record = await ctx.pb.collection('sponsors').update(params.id, patch);

		// Auto-log a pipeline stage change to the activity log
		if ('status' in patch) {
			await ctx.pb.collection('sponsor_activity').create({
				sponsorId: params.id,
				type: 'stage_change',
				note: `Stage moved to ${patch.status}`,
				createdBy: ctx.userId
			}).catch(() => {}); // non-fatal if collection doesn't exist yet
		}

		return json(record);
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to update sponsor';
		return json({ message: msg }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	ctx.requireRole('admin');

	try {
		await ctx.pb.collection('sponsors').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to delete sponsor';
		return json({ message: msg }, { status: 500 });
	}
};
