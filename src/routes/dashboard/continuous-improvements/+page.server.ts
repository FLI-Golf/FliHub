import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		const rawPage = Number(url.searchParams.get('page') ?? '1');
		const rawLimit = Number(url.searchParams.get('limit') ?? '25');
		const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
		const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 25;
		const status = url.searchParams.get('status');
		const priority = url.searchParams.get('priority');
		const sort = url.searchParams.get('sort') ?? '-id';

		let filter = '';
		if (status) filter += `status = '${status}'`;
		if (priority) filter += filter ? ` && priority = '${priority}'` : `priority = '${priority}'`;

		let improvements;
		try {
			improvements = await pb.collection('continuous_improvements').getList(page, limit, {
				filter: filter || undefined,
				sort
			});
		} catch {
			try {
				// Fallback for environments where sort field/options are invalid.
				improvements = await pb.collection('continuous_improvements').getList(page, limit, {
					filter: filter || undefined
				});
			} catch {
				// Final fallback: fetch without filter/sort to avoid request shape issues.
				improvements = await pb.collection('continuous_improvements').getList(page, limit);
			}
		}

		return {
			improvements,
			currentPage: page,
			limit,
			filters: { status, priority }
		};
	} catch (error: any) {
		console.error('Failed to load continuous improvements:', error);
		return {
			improvements: { items: [], totalItems: 0, totalPages: 0 },
			currentPage: 1,
			limit: 25,
			filters: { status: null, priority: null },
			error: error?.message || 'Failed to load improvements'
		};
	}
};
