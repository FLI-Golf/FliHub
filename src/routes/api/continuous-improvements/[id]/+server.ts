import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		const expand = url.searchParams.get('expand') ?? undefined;
		const fields = url.searchParams.get('fields') ?? undefined;

		const record = await ctx.pb.collection('continuous_improvements').getOne(params.id, {
			expand,
			fields
		});
		return json(record);
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to fetch improvement';
		return json({ message: msg }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ locals, url, request, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json();

	try {
		const updates: Record<string, any> = {};
		if (body.title !== undefined) updates.title = body.title;
		if (body.description !== undefined) updates.description = body.description;
		if (body.category !== undefined) updates.category = body.category;
		if (body.currentState !== undefined) updates.currentState = body.currentState;
		if (body.proposedSolution !== undefined) updates.proposedSolution = body.proposedSolution;
		if (body.expectedBenefit !== undefined) updates.expectedBenefit = body.expectedBenefit;
		if (body.status !== undefined) updates.status = body.status;
		if (body.priority !== undefined) updates.priority = body.priority;
		if (body.implementationDate !== undefined) updates.implementationDate = body.implementationDate;

		const record = await ctx.pb.collection('continuous_improvements').update(params.id, updates);
		return json(record);
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to update improvement';
		return json({ message: msg }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	try {
		await ctx.pb.collection('continuous_improvements').delete(params.id);
		return json({ message: 'Deleted successfully' });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to delete improvement';
		return json({ message: msg }, { status: 500 });
	}
};
