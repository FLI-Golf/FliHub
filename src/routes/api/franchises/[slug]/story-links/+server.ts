import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// POST /api/franchises/:slug/story-links
// Body: { links: [{ label: string; url: string }] }
export const POST: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	if (ctx.profile?.role !== 'admin' && ctx.profile?.role !== 'leader') {
		return json({ message: 'Unauthorized' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const links: { label: string; url: string }[] = (body.links ?? [])
			.filter((l: any) => typeof l.url === 'string' && l.url.trim());

		const records = await ctx.pb.collection('franchises').getFullList({
			filter: `slug = "${params.slug}"`
		});
		if (!records.length) {
			return json({ message: 'Franchise not found' }, { status: 404 });
		}

		const franchise = records[0];
		const updated = await ctx.pb.collection('franchises').update(franchise.id, {
			storyLinks: links
		});

		return json({ storyLinks: updated.storyLinks });
	} catch (err: any) {
		return json(
			{ message: err?.response?.message ?? err?.message ?? 'Save failed' },
			{ status: 500 }
		);
	}
};
