import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Update the project in PocketBase
		const project = await pb.collection('projects').update(params.id, {
			name: data.name,
			description: data.description || '',
			type: data.type,
			status: data.status,
			startDate: data.startDate || null,
			endDate: data.endDate || null,
			budget: data.budget !== undefined ? data.budget : null,
			forecastedExpenses: data.forecastedExpenses !== undefined ? data.forecastedExpenses : null,
			fiscalYear: data.fiscalYear || null,
			notes: data.notes || ''
		});

		return json(project, { status: 200 });
	} catch (error) {
		console.error('Error updating project:', error);
		return json(
			{ message: 'Failed to update project', error: String(error) },
			{ status: 500 }
		);
	}
};
