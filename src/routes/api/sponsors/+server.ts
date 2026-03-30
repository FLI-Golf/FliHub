import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.from(locals, url);
	const body = await request.json();

	if (!body.companyName?.trim()) {
		return json({ message: 'Company name is required' }, { status: 400 });
	}

	try {
		const record = await ctx.pb.collection('sponsors').create({
			companyName:      body.companyName.trim(),
			type:             body.type             ?? 'corporate',
			tier:             body.tier             ?? 'tier_3',
			status:           body.status           ?? 'prospect',
			contactName:      body.contactName      ?? '',
			contactEmail:     body.contactEmail     ?? '',
			contactPhone:     body.contactPhone     ?? '',
			location:         body.location         ?? '',
			annualCommitment: body.annualCommitment ?? 0,
			franchiseInterest: body.franchiseInterest ?? false,
			notes:            body.notes            ?? ''
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to create sponsor';
		return json({ message: msg }, { status: 500 });
	}
};
