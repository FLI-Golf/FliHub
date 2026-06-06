import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

export const GET: RequestHandler = async ({ locals }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	const role = ctx.profile?.role || '';
	if (!['admin', 'leader', 'marketing', 'marketing_lead'].includes(role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	try {
		let jobs: any[] = [];
		try {
			jobs = await ctx.pb.collection('media_ai_jobs').getList(1, 10).then((res) => res.items || []);
		} catch {
			const fallback = await ctx.pb.send('/api/collections/media_ai_jobs/records', {
				method: 'GET',
				query: {
					page: 1,
					perPage: 10
				}
			}) as { items?: any[] };
			jobs = fallback?.items || [];
		}

		jobs.sort((a: any, b: any) => {
			const av = Date.parse(a?.created || '') || 0;
			const bv = Date.parse(b?.created || '') || 0;
			return bv - av;
		});

		const assetIds = Array.from(new Set(jobs.map((job: any) => job.asset).filter(Boolean)));
		const assets = await Promise.all(
			assetIds.map((id: string) =>
				ctx.pb
					.collection('media_assets')
					.getOne(id)
					.then((row) => ({ id: row.id, title: (row as any).title || 'Untitled Asset' }))
					.catch(() => ({ id, title: 'Unknown Asset' }))
			)
		);
		const assetMap = new Map(assets.map((row: any) => [row.id, row.title]));

		return json({
			items: jobs.map((job: any) => ({
				...job,
				asset_title: assetMap.get(job.asset) || 'Unknown Asset'
			}))
		});
	} catch (error) {
		console.error('Error loading Phase 7 jobs:', error);
		const message = error instanceof Error ? error.message : String(error);
		return json({ message: 'Failed to load Phase 7 jobs', error: message }, { status: 500 });
	}
};
