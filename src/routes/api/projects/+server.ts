import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Create the project in PocketBase
		const project = await pb.collection('projects').create({
			name: data.name,
			description: data.description || '',
			type: data.type,
			status: data.status,
			// department is a relation field — send null when empty to avoid PocketBase validation error
			department: data.department || null,
			startDate: data.startDate || null,
			endDate: data.endDate || null,
			project_budget: data.project_budget || null,
			project_forecasted_expenses: data.project_forecasted_expenses || null,
			project_actual_expenses: 0,
			fiscalYear: data.fiscalYear || null,
			notes: data.notes || ''
		});

		return json(project, { status: 201 });
	} catch (error) {
		console.error('Error creating project:', error);
		return json(
			{ message: 'Failed to create project', error: String(error) },
			{ status: 500 }
		);
	}
};
