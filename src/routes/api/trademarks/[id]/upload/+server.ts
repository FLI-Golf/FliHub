import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// POST /api/trademarks/:id/upload
// Accepts multipart/form-data with fields: pdf (File), pdfLabel (string)
export const POST: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		const formData = await request.formData();
		const pdf      = formData.get('pdf');
		const pdfLabel = formData.get('pdfLabel')?.toString().trim() ?? '';

		if (!pdf || !(pdf instanceof File)) {
			return json({ message: 'pdf file is required' }, { status: 400 });
		}

		// Build a FormData payload for PocketBase
		const pbForm = new FormData();
		pbForm.append('pdf', pdf, pdf.name);
		if (pdfLabel) pbForm.append('pdfLabel', pdfLabel);

		const updated = await ctx.pb
			.collection('trademark_filings')
			.update(params.id, pbForm);

		return json(updated);
	} catch (err: any) {
		console.error('PDF upload error:', err);
		return json(
			{ message: err?.response?.message ?? err?.message ?? 'Upload failed' },
			{ status: 500 }
		);
	}
};
