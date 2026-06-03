import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	try {
		const data = await request.json();

		const updateData = { ...data };
		if (data.department_annual_budget !== undefined) {
			const budget = Number(data.department_annual_budget) || 0;
			updateData.department_annual_budget = budget;
			updateData.department_budget_mode = 'allocated';
			updateData.department_budget_cap = budget;
		}

		let department;
		try {
			department = await locals.pb.collection('departments').update(params.id, updateData);
		} catch (error: any) {
			if (
				data.department_annual_budget === undefined ||
				!String(error?.response?.message || error?.message || '').toLowerCase().includes('unknown')
			) {
				throw error;
			}

			const { department_budget_mode, department_budget_cap, ...fallbackData } = updateData;
			department = await locals.pb.collection('departments').update(params.id, fallbackData);
		}
		
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
