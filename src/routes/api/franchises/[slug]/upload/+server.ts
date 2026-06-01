import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// POST /api/franchises/:slug/upload
// Replaces storyPdfs with up to 3 PDFs sent as pdf_0, pdf_1, pdf_2
export const POST: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		const formData = await request.formData();

		const records = await ctx.pb.collection('franchises').getFullList({
			filter: `slug = "${params.slug}"`
		});
		if (!records.length) {
			return json({ message: 'Franchise not found' }, { status: 404 });
		}

		const franchise = records[0];

		const pbForm = new FormData();

		// Clear existing storyPdfs first
		pbForm.append('storyPdfs', '');

		let count = 0;
		for (const key of ['pdf_0', 'pdf_1', 'pdf_2']) {
			const file = formData.get(key);
			if (file instanceof File && file.size > 0) {
				pbForm.append('storyPdfs', file, file.name);
				count++;
			}
		}

		if (count === 0) {
			return json({ message: 'No files provided' }, { status: 400 });
		}

		const updated = await ctx.pb
			.collection('franchises')
			.update(franchise.id, pbForm);

		return json({ storyPdfs: updated.storyPdfs });
	} catch (err: any) {
		console.error('Franchise upload error:', err);
		return json(
			{ message: err?.response?.message ?? err?.message ?? 'Upload failed' },
			{ status: 500 }
		);
	}
};
