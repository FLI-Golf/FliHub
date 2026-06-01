import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const body = await request.json();

	if (!body.firstName?.trim() || !body.lastName?.trim()) {
		return json({ message: 'First and last name are required' }, { status: 400 });
	}
	if (!body.email?.trim()) {
		return json({ message: 'Email is required' }, { status: 400 });
	}

	try {
		const record = await ctx.pb.collection('franchise_leads').create({
			firstName:        body.firstName.trim(),
			lastName:         body.lastName.trim(),
			email:            body.email.trim(),
			phone:            body.phone            ?? '',
			company:          body.company          ?? '',
			location:         body.location         ?? '',
			territory:        body.territory        ?? '',
			source:           body.source           ?? 'other',
			status:           body.status           ?? 'new',
			netWorth:         body.netWorth         ? Number(body.netWorth)         : null,
			liquidCapital:    body.liquidCapital    ? Number(body.liquidCapital)    : null,
			experienceLevel:  body.experienceLevel  ?? 'none',
			isExistingSponsor:body.isExistingSponsor ?? false,
			sponsorId:        body.sponsorId        ?? null,
			franchiseId:      body.franchiseId      ?? null,
			preferredName:    body.preferredName    ?? '',
			notes:            body.notes            ?? '',
			assignedTo:       body.assignedTo       ?? null,
		});
		return json(record, { status: 201 });
	} catch (err: any) {
		const msg = err?.response?.message ?? err?.message ?? 'Failed to create lead';
		return json({ message: msg }, { status: 500 });
	}
};
