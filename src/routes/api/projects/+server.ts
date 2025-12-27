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
			startDate: data.startDate || null,
			endDate: data.endDate || null,
			budget: data.budget || null,
			forecastedExpenses: data.forecastedExpenses || null,
			actualExpenses: 0,
			fiscalYear: data.fiscalYear || null,
			notes: data.notes || '',
			approvalStatus: 'pending'
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
