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
			companyName:          body.companyName.trim(),
			type:                 body.type             ?? 'corporate',
			tier:                 body.tier             ?? 'tier_3',
			status:               body.status           ?? 'prospect',
			primaryContactName:   body.primaryContactName  ?? '',
			primaryContactEmail:  body.primaryContactEmail ?? '',
			primaryContactPhone:  body.primaryContactPhone ?? '',
			location:             body.location         ?? '',
			territory:            body.territory        ?? '',
			annualCommitment:     body.annualCommitment ? Number(body.annualCommitment) : 0,
			totalPaid:            0,
			dealProbability:      body.dealProbability  ? Number(body.dealProbability) : null,
			lastContactDate:      body.lastContactDate  ?? null,
			nextFollowUpDate:     body.nextFollowUpDate ?? null,
			franchiseInterest:    body.franchiseInterest ?? false,
			assignedTo:           body.assignedTo       ?? null,
			notes:                body.notes            ?? ''
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to create sponsor';
		return json({ message: msg }, { status: 500 });
	}
};
