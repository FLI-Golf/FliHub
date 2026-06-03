import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const data = await request.json();

		const createData = { ...data };
		if (data.department_annual_budget !== undefined) {
			const budget = Number(data.department_annual_budget) || 0;
			createData.department_annual_budget = budget;
			createData.department_budget_mode = 'allocated';
			createData.department_budget_cap = budget;
		}

		let department;
		try {
			department = await locals.pb.collection('departments').create(createData);
		} catch (error: any) {
			if (
				data.department_annual_budget === undefined ||
				!String(error?.response?.message || error?.message || '').toLowerCase().includes('unknown')
			) {
				throw error;
			}

			const { department_budget_mode, department_budget_cap, ...fallbackData } = createData;
			department = await locals.pb.collection('departments').create(fallbackData);
		}
		
		return json(department, { status: 201 });
	} catch (error: any) {
		console.error('Error creating department:', error);
		return json(
			{ message: error?.message || 'Failed to create department' },
			{ status: error?.status || 500 }
		);
	}
};
