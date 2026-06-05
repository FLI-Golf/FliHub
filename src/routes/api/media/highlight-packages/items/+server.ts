import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

export const POST: RequestHandler = async ({ locals, request }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}
	const pb = ctx.pb;

	try {
		const data = await request.json();
		if (!data?.highlight_package || !data?.asset) {
			return json({ message: 'highlight_package and asset are required' }, { status: 400 });
		}

		const existing = await pb.collection('highlight_package_items').getFirstListItem(
			`highlight_package = "${data.highlight_package}" && asset = "${data.asset}"`
		).catch(() => null);

		if (existing) {
			return json(existing);
		}

		const existingItems = await pb.collection('highlight_package_items').getFullList({
			filter: `highlight_package = "${data.highlight_package}"`,
			fields: 'sort_order'
		}).catch(() => []);

		const maxSort = existingItems.reduce((max: number, row: any) => Math.max(max, Number(row.sort_order) || 0), -1);

		const record = await pb.collection('highlight_package_items').create({
			highlight_package: data.highlight_package,
			media_collection: data.media_collection || null,
			asset: data.asset,
			clip_in_seconds: data.clip_in_seconds ? Number(data.clip_in_seconds) : null,
			clip_out_seconds: data.clip_out_seconds ? Number(data.clip_out_seconds) : null,
			sort_order: data.sort_order ?? maxSort + 1,
			usage_role: data.usage_role || 'feature',
			notes: data.notes || ''
		});

		return json(record, { status: 201 });
	} catch (error) {
		console.error('Error creating highlight package item:', error);
		return json({ message: 'Failed to create highlight package item', error: String(error) }, { status: 500 });
	}
};
