import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		const rawPage = Number(url.searchParams.get('page') ?? '1');
		const rawLimit = Number(url.searchParams.get('limit') ?? '50');
		const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
		const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 50;
		const status = url.searchParams.get('status');
		const priority = url.searchParams.get('priority');
		const sort = url.searchParams.get('sort') ?? '-id';

		let filter = '';
		if (status) filter += `status = '${status}'`;
		if (priority) filter += filter ? ` && priority = '${priority}'` : `priority = '${priority}'`;

		let records;
		try {
			records = await ctx.pb.collection('continuous_improvements').getList(page, limit, {
				filter: filter || undefined,
				sort
			});
		} catch {
			try {
				records = await ctx.pb.collection('continuous_improvements').getList(page, limit, {
					filter: filter || undefined
				});
			} catch {
				records = await ctx.pb.collection('continuous_improvements').getList(page, limit);
			}
		}
		return json(records);
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to fetch improvements';
		return json({ message: msg }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json();

	if (!body.title?.trim()) {
		return json({ message: 'Title is required' }, { status: 400 });
	}

	try {
		const record = await ctx.pb.collection('continuous_improvements').create({
			title: body.title.trim(),
			description: body.description ?? '',
			category: body.category ?? '',
			currentState: body.currentState ?? '',
			proposedSolution: body.proposedSolution ?? '',
			expectedBenefit: body.expectedBenefit ?? '',
			status: body.status ?? 'Identified',
			priority: body.priority ?? 'Medium',
			implementationDate: body.implementationDate ?? null
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to create improvement';
		return json({ message: msg }, { status: 500 });
	}
};
