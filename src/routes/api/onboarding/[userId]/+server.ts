/**
 * PATCH /api/onboarding/[userId]
 * Admin-only: update a talent member's onboarding pipeline stage.
 *
 * Body: { stage: 'invited' | 'documents_sent' | 'documents_signed' | 'profile_complete' | 'approved' | 'rejected' }
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	ctx.requireRole('admin', 'leader');

	const body = await request.json().catch(() => ({}));
	const { stage, notes } = body;

	if (!stage) return json({ message: 'stage is required' }, { status: 400 });

	try {
		const existing = await ctx.pb.collection('onboarding_status').getFullList({
			filter: `userId = "${params.userId}"`
		});

		const now = new Date().toISOString();
		const payload: Record<string, any> = {
			pipelineStage: stage,
			updatedAt: now
		};
		if (notes !== undefined) payload.adminNotes = notes;
		if (stage === 'approved') payload.completedAt = now;

		if (existing.length > 0) {
			await ctx.pb.collection('onboarding_status').update(existing[0].id, payload);
		} else {
			await ctx.pb.collection('onboarding_status').create({
				userId: params.userId,
				pipelineStage: stage,
				welcomeSeen: false,
				documentsInitialed: false,
				contractSigned: false,
				profileCompleted: false,
				adminNotes: notes ?? '',
				updatedAt: now
			});
		}

		return json({ ok: true });
	} catch (err: any) {
		console.error('onboarding PATCH error:', err);
		return json({ message: err.message ?? 'Server error' }, { status: 500 });
	}
};
