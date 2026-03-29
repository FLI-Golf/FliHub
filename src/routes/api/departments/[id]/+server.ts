import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	try {
		const data = await request.json();
		
		const department = await locals.pb.collection('departments').update(params.id, data);
		
		return json(department);
	} catch (error: any) {
		console.error('Error updating department:', error);
		return json(
			{ message: error?.message || 'Failed to update department' },
			{ status: error?.status || 500 }
		);
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	try {
		await locals.pb.collection('departments').delete(params.id);
		
		return json({ success: true });
	} catch (error: any) {
		console.error('Error deleting department:', error);
		return json(
			{ message: error?.message || 'Failed to delete department' },
			{ status: error?.status || 500 }
		);
	}
};
