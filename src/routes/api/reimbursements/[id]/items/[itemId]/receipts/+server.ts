import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// POST /api/reimbursements/:id/items/:itemId/receipts
// Accepts multipart/form-data with one or more 'receipts' file fields
export const POST: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		const formData = await request.formData();
		const files = formData.getAll('receipts') as File[];

		if (!files.length) {
			return json({ message: 'No files provided' }, { status: 400 });
		}

		// PocketBase file upload via FormData
		const pb_form = new FormData();
		for (const file of files) {
			pb_form.append('receipts+', file);
		}

		const record = await ctx.pb.collection('reimbursement_items').update(params.itemId, pb_form);
		return json({ ok: true, receipts: record.receipts });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Upload failed' }, { status: 500 });
	}
};

// DELETE /api/reimbursements/:id/items/:itemId/receipts
// Accepts JSON body: { receipts?: string[] }
// If receipts is omitted, removes all current receipts on the item.
export const DELETE: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		let filenames: string[] = [];

		try {
			const body = await request.json();
			if (Array.isArray(body?.receipts)) {
				filenames = body.receipts.filter((name: unknown) => typeof name === 'string' && !!name.trim());
			}
		} catch {
			// No JSON body provided; fallback to removing all existing receipts.
		}

		if (!filenames.length) {
			const item = await ctx.pb.collection('reimbursement_items').getOne(params.itemId);
			const current = Array.isArray((item as any).receipts) ? (item as any).receipts : [];
			filenames = current.filter((name: unknown) => typeof name === 'string' && !!name.trim());
		}

		if (!filenames.length) {
			return json({ ok: true, receipts: [] });
		}

		const pbForm = new FormData();
		for (const name of filenames) {
			pbForm.append('receipts-', name);
		}

		const record = await ctx.pb.collection('reimbursement_items').update(params.itemId, pbForm);
		return json({ ok: true, receipts: (record as any).receipts ?? [] });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Remove failed' }, { status: 500 });
	}
};
