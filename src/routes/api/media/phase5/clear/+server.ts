import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

export const POST: RequestHandler = async ({ locals }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const role = ctx.profile?.role || '';
	if (!['admin', 'leader'].includes(role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	try {
		const deleted: Record<string, number> = {
			highlight_package_items: 0,
			highlight_packages: 0,
			media_collections: 0
		};

		const itemRows = await ctx.pb.collection('highlight_package_items').getFullList({ fields: 'id' }).catch(() => []);
		for (const row of itemRows as any[]) {
			await ctx.pb.collection('highlight_package_items').delete(row.id).catch(() => undefined);
			deleted.highlight_package_items += 1;
		}

		const packageRows = await ctx.pb.collection('highlight_packages').getFullList({ fields: 'id' }).catch(() => []);
		for (const row of packageRows as any[]) {
			await ctx.pb.collection('highlight_packages').delete(row.id).catch(() => undefined);
			deleted.highlight_packages += 1;
		}

		const collectionRows = await ctx.pb.collection('media_collections').getFullList({ fields: 'id' }).catch(() => []);
		for (const row of collectionRows as any[]) {
			await ctx.pb.collection('media_collections').delete(row.id).catch(() => undefined);
			deleted.media_collections += 1;
		}

		return json({ ok: true, deleted });
	} catch (error) {
		return json({ message: 'Failed to clear Phase 5 test data', error: String(error) }, { status: 500 });
	}
};
