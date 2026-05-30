/**
 * POST /api/bids — submit a new bid from a vendor (multipart to support file attachments)
 */
import { json } from '@sveltejs/kit';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const isValid = locals?.pb?.authStore?.isValid ?? false;
	if (!isValid) return json({ message: 'Unauthorized' }, { status: 401 });

	const formData = await request.formData().catch(() => null);
	if (!formData) return json({ message: 'Invalid form data' }, { status: 400 });

	const projectId = formData.get('projectId') as string;
	const vendorId  = formData.get('vendorId')  as string;
	const amount    = formData.get('amount')    as string;
	const timeline  = formData.get('timeline')  as string;
	const scope     = formData.get('scope')     as string;
	const files     = formData.getAll('attachments') as File[];

	if (!projectId || !vendorId) {
		return json({ message: 'projectId and vendorId are required' }, { status: 400 });
	}
	if (!scope?.trim()) {
		return json({ message: 'Scope of work is required' }, { status: 400 });
	}

	const pb = await getAdminPocketBase();

	// Prevent duplicate bids
	const existing = await pb.collection('bids').getList(1, 1, {
		filter: `projectId="${projectId}"&&vendorId="${vendorId}"`,
		fields: 'id',
	}).catch(() => ({ items: [] }));

	if (existing.items.length > 0) {
		return json({ message: 'You have already submitted a bid for this project.' }, { status: 409 });
	}

	try {
		const payload = new FormData();
		payload.append('projectId',   projectId);
		payload.append('vendorId',    vendorId);
		payload.append('amount',      amount ? String(Number(amount)) : '');
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
