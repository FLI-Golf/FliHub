import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

function hasOwn(data: Record<string, any>, key: string) {
	return Object.prototype.hasOwnProperty.call(data, key);
}

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}
	const pb = ctx.pb;

	try {
		const data = await request.json();
		const updatePayload: Record<string, any> = {};

		if (hasOwn(data, 'media_collection')) updatePayload.media_collection = data.media_collection || null;
		if (hasOwn(data, 'clip_in_seconds')) updatePayload.clip_in_seconds = data.clip_in_seconds ? Number(data.clip_in_seconds) : null;
		if (hasOwn(data, 'clip_out_seconds')) updatePayload.clip_out_seconds = data.clip_out_seconds ? Number(data.clip_out_seconds) : null;
		if (hasOwn(data, 'sort_order')) updatePayload.sort_order = Number(data.sort_order) || 0;
		if (hasOwn(data, 'usage_role')) updatePayload.usage_role = data.usage_role || 'feature';
		if (hasOwn(data, 'notes')) updatePayload.notes = data.notes || '';

		const record = Object.keys(updatePayload).length
			? await pb.collection('highlight_package_items').update(params.itemId, updatePayload)
			: await pb.collection('highlight_package_items').getOne(params.itemId);

		return json(record);
	} catch (error) {
		console.error('Error updating highlight package item:', error);
		return json({ message: 'Failed to update highlight package item', error: String(error) }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const ctx = await RequestContext.fromApi(locals);
	if (!ctx) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}
	const pb = ctx.pb;

	try {
		await pb.collection('highlight_package_items').delete(params.itemId);
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting highlight package item:', error);
		return json({ message: 'Failed to delete highlight package item', error: String(error) }, { status: 500 });
	}
};
