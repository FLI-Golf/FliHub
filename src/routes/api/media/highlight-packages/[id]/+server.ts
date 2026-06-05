import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function hasOwn(data: Record<string, any>, key: string) {
	return Object.prototype.hasOwnProperty.call(data, key);
}

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
	const pb = locals.pb;
	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		const updatePayload: Record<string, any> = {};

		if (hasOwn(data, 'name')) updatePayload.name = data.name;
		if (hasOwn(data, 'package_type')) updatePayload.package_type = data.package_type;
		if (hasOwn(data, 'status')) updatePayload.status = data.status;
		if (hasOwn(data, 'export_target')) updatePayload.export_target = data.export_target;
		if (hasOwn(data, 'approval_status')) updatePayload.approval_status = data.approval_status;
		if (hasOwn(data, 'approved_by')) updatePayload.approved_by = data.approved_by || '';
		if (hasOwn(data, 'approved_at')) updatePayload.approved_at = data.approved_at || null;
		if (hasOwn(data, 'published_url')) updatePayload.published_url = data.published_url || '';
		if (hasOwn(data, 'manifest_json')) updatePayload.manifest_json = data.manifest_json || null;
		if (hasOwn(data, 'notes')) updatePayload.notes = data.notes || '';

		const record = Object.keys(updatePayload).length
			? await pb.collection('highlight_packages').update(params.id, updatePayload)
			: await pb.collection('highlight_packages').getOne(params.id);

		return json(record);
	} catch (error) {
		console.error('Error updating highlight package:', error);
		return json({ message: 'Failed to update highlight package', error: String(error) }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const pb = locals.pb;
	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const itemRows = await pb.collection('highlight_package_items').getFullList({
			filter: `highlight_package = "${params.id}"`,
			fields: 'id'
		}).catch(() => []);

		for (const row of itemRows) {
			await pb.collection('highlight_package_items').delete(row.id).catch(() => undefined);
		}

		await pb.collection('highlight_packages').delete(params.id);
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting highlight package:', error);
		return json({ message: 'Failed to delete highlight package', error: String(error) }, { status: 500 });
	}
};
