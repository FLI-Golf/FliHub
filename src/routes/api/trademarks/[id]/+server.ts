import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import type { RequestHandler } from './$types';

// PATCH /api/trademarks/:id — update status, dates, notes, USPTO numbers
export const PATCH: RequestHandler = async ({ locals, url, params, request }) => {
	const ctx  = await RequestContext.from(locals, url);
	const body = await request.json();

	// Whitelist updatable fields
	const allowed = [
		'status', 'markType', 'logoVariant', 'trademarkClass',
		'usptoAppNumber', 'usptoSerialNumber',
		'filedDate', 'publishedDate', 'approvedDate', 'rejectedDate', 'renewalDate',
		'attorneyNotes', 'internalNotes', 'oppositionDetail'
	];

	const patch: Record<string, unknown> = {};
	for (const key of allowed) {
		if (key in body) patch[key] = body[key];
	}

	if (!Object.keys(patch).length) {
		return json({ message: 'No updatable fields provided' }, { status: 400 });
	}

	try {
		const updated = await ctx.pb.collection('trademark_filings').update(params.id, patch);
		return json(updated);
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};

// DELETE /api/trademarks/:id — remove a filing (admin only)
export const DELETE: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.from(locals, url);

	if (ctx.role !== 'admin') {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	try {
		await ctx.pb.collection('trademark_filings').delete(params.id);
		return json({ ok: true });
	} catch (err: any) {
		return json({ message: err?.response?.message ?? err?.message ?? 'Failed' }, { status: 500 });
	}
};
