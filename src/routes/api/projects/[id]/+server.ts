import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	const pb = locals.pb;

	if (!pb.authStore.isValid) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Build update payload — only include fields present in the request body
		const updateData: Record<string, unknown> = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description || '';
		if (data.type !== undefined) updateData.type = data.type;
		if (data.status !== undefined) updateData.status = data.status;
		if (data.startDate !== undefined) updateData.startDate = data.startDate || null;
		if (data.endDate !== undefined) updateData.endDate = data.endDate || null;
		if (data.project_budget !== undefined) updateData.project_budget = data.project_budget ?? null;
		if (data.project_forecasted_expenses !== undefined) updateData.project_forecasted_expenses = data.project_forecasted_expenses ?? null;
		if (data.project_budget_mode !== undefined) updateData.project_budget_mode = data.project_budget_mode;
		if (data.project_budget_buffer !== undefined) updateData.project_budget_buffer = data.project_budget_buffer ?? null;
		if (data.project_budget_cap !== undefined) updateData.project_budget_cap = data.project_budget_cap ?? null;
		if (data.project_manual_budget_override !== undefined) updateData.project_manual_budget_override = data.project_manual_budget_override ?? null;
		if (data.fiscalYear !== undefined) updateData.fiscalYear = data.fiscalYear || null;
		if (data.notes !== undefined) updateData.notes = data.notes || '';
		if (data.vendors !== undefined) updateData.vendors = data.vendors;

		// Update the project in PocketBase
		const project = await pb.collection('projects').update(params.id, updateData, {
			expand: 'vendors'
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
