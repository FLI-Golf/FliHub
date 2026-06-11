import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		const formData = await request.formData();
		const file = formData.get('pdf_file');

		if (!(file instanceof File)) {
			return json({ message: 'pdf_file is required' }, { status: 400 });
		}

		const isPdfMime = file.type === 'application/pdf';
		const isPdfName = file.name.toLowerCase().endsWith('.pdf');
		if (!isPdfMime && !isPdfName) {
			return json({ message: 'Only PDF files are allowed' }, { status: 400 });
		}

		const payload = new FormData();
		payload.append('user', ctx.userId);
		payload.append('pdf_file', file);

		const record = await ctx.pb.collection('bank_statements').create(payload);
		return json({ ok: true, record });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Upload failed' }, { status: 500 });
	}
};
