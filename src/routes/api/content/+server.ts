/**
 * GET  /api/content — list all content production items
 * POST /api/content — create a new content production item
 */
import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { RequestHandler } from './$types';

function pbErrorDetails(error: any): string {
	const responseMessage = error?.response?.message;
	const responseData = error?.response?.data;
	if (responseMessage || responseData) {
		const dataText = responseData ? ` data=${JSON.stringify(responseData)}` : '';
		return `${responseMessage ?? 'PocketBase response error'}${dataText}`;
	}
	return error?.message ?? String(error);
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	try {
		const items = await ctx.pb.collection('content_production').getFullList({
			sort: '-created',
			expand: 'assignedTo,talent,department,project'
		}).catch(async (error: any) => {
			console.error('api/content GET: expanded query failed, retrying without expand', pbErrorDetails(error));
			return ctx.pb.collection('content_production').getFullList({
				sort: '-created'
			}).catch((fallbackError: any) => {
				console.error('api/content GET: fallback query failed, trying raw fetch', pbErrorDetails(fallbackError));
				return adminFetch('content_production', { sort: '-created' });
			});
		});
		return json(items);
	} catch (error: any) {
		console.error('api/content GET failed', pbErrorDetails(error));
		return json([]);
	}
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json().catch(() => ({}));

	if (!body.title?.trim()) return json({ message: 'title is required' }, { status: 400 });
	if (!body.contentType) return json({ message: 'contentType is required' }, { status: 400 });
	if (!body.department) return json({ message: 'department is required' }, { status: 400 });

	try {
		const record = await ctx.pb.collection('content_production').create({
			title:        body.title.trim(),
			contentType:  body.contentType,
			stage:        'brief',
			description:  body.description ?? '',
			department:   body.department,
			project:      body.project || null,
			talent:       body.talent ?? [],
			assignedTo:   body.assignedTo ?? null,
			dueDate:      body.dueDate ?? null,
			budget:       body.budget ? Number(body.budget) : null,
			requiresApproval: body.requiresApproval ?? false,
			notes:        body.notes ?? '',
			createdBy:    ctx.userId
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
