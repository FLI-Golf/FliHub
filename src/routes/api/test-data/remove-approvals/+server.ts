import { json } from '@sveltejs/kit';
import { requireAdminNonProductionApi } from '$lib/infra/api-route-guards';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	const guard = await requireAdminNonProductionApi(locals, url);
	if (guard.error) return guard.error;
	const pb = guard.ctx.pb;

	try {
		console.log('Removing test approval data...');
		
		// Get all approvals
		const approvals = await pb.collection('approvals').getFullList();

		let approvalsDeleted = 0;

		// Delete all approvals
		for (const approval of approvals) {
			try {
				await pb.collection('approvals').delete(approval.id);
				approvalsDeleted++;
			} catch (err: any) {
				console.warn(`Could not delete approval ${approval.id}: ${err.message}`);
			}
		}

		console.log(`✅ Deleted ${approvalsDeleted} approval requests`);

		return json({ 
			success: true, 
			message: `Removed ${approvalsDeleted} approval requests`,
			deleted: {
				approvals: approvalsDeleted
			}
		});
	} catch (error: any) {
		console.error('Error removing approval data:', error);
		return json({ 
			error: 'Failed to remove approval data', 
			details: error.message 
		}, { status: 500 });
	}
};
