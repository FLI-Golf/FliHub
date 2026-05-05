import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// PATCH /api/franchises/:slug — update editable franchise fields
export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	const allowed = [
		'primaryColor', 'secondaryColor', 'colorPalette', 'tagline', 'territory', 'website',
		'malePro', 'femalePro',
		'franchiseeName', 'franchiseeEmail', 'franchiseePhone', 'franchiseeCompany'
	];

	const patch: Record<string, unknown> = {};
	for (const key of allowed) {
		if (key in body) patch[key] = body[key];
	}

	if (!Object.keys(patch).length) {
		return json({ message: 'No updatable fields provided' }, { status: 400 });
	}

	try {
		const records = await ctx.pb.collection('franchises').getFullList({
			filter: `slug = "${params.slug}"`
		});
		if (!records.length) {
			return json({ message: 'Franchise not found' }, { status: 404 });
		}
		const updated = await ctx.pb.collection('franchises').update(records[0].id, patch);
		return json(updated);
	} catch (err: any) {
		return json(
			{ message: err?.response?.message ?? err?.message ?? 'Failed to update franchise' },
			{ status: 500 }
		);
	}
};
