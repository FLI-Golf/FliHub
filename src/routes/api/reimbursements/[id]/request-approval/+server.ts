import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

// POST /api/reimbursements/:id/request-approval
// Moves claim to under_review and creates a pending approval if one does not exist.
export const POST: RequestHandler = async ({ locals, url, params }) => {
	console.log(`[reimb] request-approval hit for claim ${params.id}`);
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (!['admin', 'leader'].includes(ctx.role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	try {
		const adminPb = await getAdminPocketBase();
		const claim = await adminPb.collection('reimbursement_claims').getOne(params.id);

		const requestedBy = claim?.claimant || ctx.profile?.id || null;
		if (!requestedBy) {
			return json({ message: 'Claimant is missing. Cannot create approval request.' }, { status: 400 });
		}

		const existingPending = await adminPb.collection('approvals').getFullList({
			filter: `entityType='expense' && entityId='${claim.id}' && status='pending'`,
			fields: 'id,status'
		}).catch(() => []);

		let approval: any = existingPending[0] ?? null;
		if (!approval) {
			approval = await adminPb.collection('approvals').create({
				entityType: 'expense',
				entityId: claim.id,
				status: 'pending',
				requestedBy,
				requestedDate: new Date().toISOString(),
				amount: claim.totalAmount || 0,
				comments: '<p>Reimbursement claim submitted for approval.</p>'
			});
			console.log(`[reimb] approval created: ${approval.id} for claim ${claim.id}`);
		} else {
			console.log(`[reimb] pending approval exists: ${approval.id} for claim ${claim.id}`);
		}

		if (claim.status !== 'under_review') {
			await adminPb.collection('reimbursement_claims').update(claim.id, {
				status: 'under_review'
			});
		}

		return json({ ok: true, approvalId: approval.id });
	} catch (err: any) {
		const message = err?.response?.message ?? err?.message ?? 'Failed to request approval';
		console.error('[reimb] request-approval failed', {
			claimId: params.id,
			message,
			data: err?.response?.data ?? null,
			status: err?.status ?? err?.response?.status ?? 500
		});
		return json({ message }, { status: err?.status ?? err?.response?.status ?? 500 });
	}
};
