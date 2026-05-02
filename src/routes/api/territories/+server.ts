import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.from(locals, url);
	const body = await request.json();

	if (!body.name?.trim()) {
		return json({ message: 'Territory name is required' }, { status: 400 });
	}

	try {
		const record = await ctx.pb.collection('franchise_territories').create({
			name:        body.name.trim(),
			code:        body.code?.trim()        || '',
			state:       body.state?.trim()       || '',
			city:        body.city?.trim()        || '',
			region:      body.region?.trim()      || '',
			population:  body.population          ? Number(body.population) : null,
			marketSize:  body.marketSize?.trim()  || '',
			status:      body.status?.trim()      || 'available',
			price:       body.price               ? Number(body.price)      : null,
			description: body.description?.trim() || '',
			notes:       body.notes?.trim()       || ''
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to create territory';
		return json({ message: msg }, { status: 500 });
	}
};
