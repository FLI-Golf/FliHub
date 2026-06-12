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

export const DELETE: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		const body = await request.json().catch(() => ({}));
		const ids = Array.isArray(body?.ids)
			? body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
			: [];

		if (!ids.length) {
			return json({ message: 'ids is required' }, { status: 400 });
		}

		const records = [] as any[];
		for (const id of ids) {
			const record = await ctx.pb.collection('bank_statements')
				.getOne(id, { fields: 'id,user' })
				.catch(() => null);

			if (!record) {
				return json({ message: 'Bank statement not found' }, { status: 404 });
			}

			const ownerId = Array.isArray(record.user) ? record.user[0] : record.user;
			if (ownerId !== ctx.userId) {
				return json({ message: 'Forbidden' }, { status: 403 });
			}

			records.push(record);
		}

		for (const record of records) {
			await ctx.pb.collection('bank_statements').delete(record.id);
		}

		return json({ ok: true, deleted: records.length });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Delete failed' }, { status: 500 });
	}
};
