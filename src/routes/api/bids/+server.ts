/**
 * POST /api/bids — submit a new bid from a vendor (multipart to support file attachments)
 */
import { json } from '@sveltejs/kit';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

function toAmount(value: FormDataEntryValue | null): number {
	const n = Number(String(value ?? '').trim());
	return Number.isFinite(n) && n > 0 ? n : 0;
}

export const POST: RequestHandler = async ({ locals, request }) => {
	const isValid = locals?.pb?.authStore?.isValid ?? false;
	if (!isValid) return json({ message: 'Unauthorized' }, { status: 401 });
	const userId = String(locals?.pb?.authStore?.model?.id ?? '');
	if (!userId) return json({ message: 'Unauthorized' }, { status: 401 });

	const formData = await request.formData().catch(() => null);
	if (!formData) return json({ message: 'Invalid form data' }, { status: 400 });

	const projectId = formData.get('projectId') as string;
	const vendorIdFromForm  = formData.get('vendorId')  as string;
	const taskId    = formData.get('taskId') as string;
	const amount    = formData.get('amount')    as string;
	const referenceNumber = formData.get('referenceNumber') as string;
	const materialsAmount = toAmount(formData.get('materialsAmount'));
	const laborAmount = toAmount(formData.get('laborAmount'));
	const logisticsAmount = toAmount(formData.get('logisticsAmount'));
	const otherAmount = toAmount(formData.get('otherAmount'));
	const timeline  = formData.get('timeline')  as string;
	const scope     = formData.get('scope')     as string;
	const files     = formData.getAll('attachments') as File[];

	if (!projectId || !taskId) {
		return json({ message: 'projectId and taskId are required' }, { status: 400 });
	}
	if (!scope?.trim()) {
		return json({ message: 'Scope of work is required' }, { status: 400 });
	}

	const pb = await getAdminPocketBase();
	const profiles = await pb.collection('user_profiles').getFullList({
		filter: `userId="${userId}"`,
		fields: 'id,userId,vendorId',
	});
	const profile = profiles[0] as any;
	const vendorId = String(profile?.vendorId || '');
	if (!vendorId) {
		return json({ message: 'Your user is not linked to a vendor account.' }, { status: 403 });
	}
	if (vendorIdFromForm && vendorIdFromForm !== vendorId) {
		return json({ message: 'Vendor mismatch for authenticated user.' }, { status: 403 });
	}

	const [project, task] = await Promise.all([
		pb.collection('projects').getOne(projectId, { fields: 'id,biddingOpen' }).catch(() => null),
		pb.collection('tasks').getOne(taskId, { fields: 'id,projectId,status,title' }).catch(() => null),
	]);

	if (!project) {
		return json({ message: 'Project not found.' }, { status: 404 });
	}
	if (!(project as any).biddingOpen) {
		return json({ message: 'Bidding is closed for this project.' }, { status: 400 });
	}
	if (!task) {
		return json({ message: 'Target task not found.' }, { status: 404 });
	}
	if ((task as any).projectId !== projectId) {
		return json({ message: 'Task does not belong to this project.' }, { status: 400 });
	}
	if (['completed', 'cancelled'].includes(String((task as any).status || ''))) {
		return json({ message: 'Task is not accepting bids.' }, { status: 400 });
	}

	const breakdownTotal = materialsAmount + laborAmount + logisticsAmount + otherAmount;
	const normalizedAmount = breakdownTotal > 0 ? breakdownTotal : toAmount(amount);
	if (normalizedAmount <= 0) {
		return json({ message: 'Enter at least one positive amount value.' }, { status: 400 });
	}

	// Prevent duplicate bids
	const existing = await pb.collection('bids').getList(1, 1, {
		filter: `projectId="${projectId}"&&vendorId="${vendorId}"&&taskId="${taskId}"`,
		fields: 'id',
	}).catch(() => ({ items: [] }));

	if (existing.items.length > 0) {
		return json({ message: 'You have already submitted a bid for this task.' }, { status: 409 });
	}

	try {
		const payload = new FormData();
		payload.append('projectId',   projectId);
		payload.append('taskId',      taskId);
		payload.append('vendorId',    vendorId);
		payload.append('amount',      String(normalizedAmount));
		payload.append('referenceNumber', String(referenceNumber || '').trim());
		payload.append('materialsAmount', String(materialsAmount));
		payload.append('laborAmount', String(laborAmount));
		payload.append('logisticsAmount', String(logisticsAmount));
		payload.append('otherAmount', String(otherAmount));
		payload.append('timeline',    timeline ?? '');
		payload.append('scope',       scope.trim());
		payload.append('status',      'submitted');
		payload.append('submittedAt', new Date().toISOString());

		for (const file of files) {
			if (file && file.size > 0) {
				payload.append('attachments', file);
			}
		}

		const bid = await pb.collection('bids').create(payload);
		return json(bid, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.message ?? 'Failed to submit bid' }, { status: 500 });
	}
};
