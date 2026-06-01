/**
 * POST /api/sponsors/:id/files
 * Multipart: field=loiDocuments|logo, files[]=...
 * Appends to existing files without replacing.
 *
 * DELETE /api/sponsors/:id/files?field=loiDocuments&filename=xyz.pdf
 * Removes a single file from the array.
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

const ALLOWED_FIELDS = ['loiDocuments', 'logo'];

export const POST: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (ctx.role !== 'admin') return json({ message: 'Forbidden' }, { status: 403 });

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
		const pbForm = new FormData();
		for (const file of files) {
			pbForm.append(field, file);
		}
		const updated = await ctx.pb.collection('sponsors').update(params.id, pbForm);
		return json({ ok: true, record: updated });
	} catch (err: any) {
		console.error('Sponsor file upload error:', err);
		return json({ message: err?.response?.message ?? err?.message ?? 'Upload failed' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx      = await RequestContext.from(locals, url);
	if (ctx.role !== 'admin') return json({ message: 'Forbidden' }, { status: 403 });

	const field    = url.searchParams.get('field');
	const filename = url.searchParams.get('filename');

	if (!field || !ALLOWED_FIELDS.includes(field)) {
		return json({ message: 'Invalid field' }, { status: 400 });
	}
	if (!filename) return json({ message: 'filename required' }, { status: 400 });

	try {
		// PocketBase removes a file by sending field-=filename
		const pbForm = new FormData();
		pbForm.append(`${field}-`, filename);
		const updated = await ctx.pb.collection('sponsors').update(params.id, pbForm);
		return json({ ok: true, record: updated });
	} catch (err: any) {
		console.error('Sponsor file delete error:', err);
		return json({ message: err?.response?.message ?? err?.message ?? 'Delete failed' }, { status: 500 });
	}
};
