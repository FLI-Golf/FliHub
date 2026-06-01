/**
 * POST /api/league/:id/logos
 * Multipart form data: field=logoMens|logoWomens|logoMonochrome, files[]=...
 * Appends new files to the existing array without replacing existing ones.
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

const ALLOWED_FIELDS = ['logoMens', 'logoWomens', 'logoMonochrome'];

export const POST: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	if (ctx.role !== 'admin') {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	const formData = await request.formData();
	const field    = formData.get('field') as string;

	if (!ALLOWED_FIELDS.includes(field)) {
		return json({ message: `Invalid field. Must be one of: ${ALLOWED_FIELDS.join(', ')}` }, { status: 400 });
	}

	const files = formData.getAll('files') as File[];
	if (!files.length || !(files[0] instanceof File)) {
		return json({ message: 'No files provided' }, { status: 400 });
	}

	try {
		// Build a new FormData for PocketBase — append each file under the field name
		const pbForm = new FormData();
		for (const file of files) {
			pbForm.append(field, file);
		}

		const updated = await ctx.pb.collection('league').update(params.id, pbForm);
		return json({ ok: true, record: updated }, { status: 200 });
	} catch (err: any) {
		console.error('Logo upload error:', err);
		return json({ message: err?.response?.message ?? err?.message ?? 'Upload failed' }, { status: 500 });
	}
};
