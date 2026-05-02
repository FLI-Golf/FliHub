import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// POST /api/reimbursements/:id/items/:itemId/receipts
// Accepts multipart/form-data with one or more 'receipts' file fields
export const POST: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.from(locals, url);

	try {
		const formData = await request.formData();
		const files = formData.getAll('receipts') as File[];

		if (!files.length) {
			return json({ message: 'No files provided' }, { status: 400 });
		}

		// PocketBase file upload via FormData
		const pb_form = new FormData();
		for (const file of files) {
			pb_form.append('receipts', file);
		}

		const record = await ctx.pb.collection('reimbursement_items').update(params.itemId, pb_form);
		return json({ ok: true, receipts: record.receipts });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Upload failed' }, { status: 500 });
	}
};
