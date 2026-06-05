import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

const PHASE6_COLLECTIONS = [
	'media_download_audits',
	'media_purchase_requests',
	'media_marketplace_listings',
	'media_dashboard_snapshots'
];

export const POST: RequestHandler = async ({ locals }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const role = ctx.profile?.role || '';
	if (!['admin', 'leader'].includes(role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	try {
		const deleted: Record<string, number> = {};

		for (const collection of PHASE6_COLLECTIONS) {
			const rows = await ctx.pb.collection(collection).getFullList({ fields: 'id' }).catch(() => []);
			let count = 0;
			for (const row of rows as any[]) {
				await ctx.pb.collection(collection).delete(row.id).catch(() => undefined);
				count += 1;
			}
			deleted[collection] = count;
		}

		return json({ ok: true, deleted });
	} catch (error) {
		return json({ message: 'Failed to clear Phase 6 test data', error: String(error) }, { status: 500 });
	}
};
