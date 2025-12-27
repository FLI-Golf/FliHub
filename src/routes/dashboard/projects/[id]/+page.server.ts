import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const pb = locals.pb;

	try {
		// Fetch the project with expanded relations
		const project = await pb.collection('projects').getOne(params.id, {
			expand: 'department,approvedBy,vendors'
		});

		// Fetch all expenses for this project
		const expenses = await pb.collection('expenses').getFullList({
			filter: `projectId = "${params.id}"`,
			sort: '-date'
		});

		// Calculate expense totals
		const expenseStats = {
			total: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
			byStatus: {
				draft: expenses.filter(e => e.status === 'draft').length,
				submitted: expenses.filter(e => e.status === 'submitted').length,
				approved: expenses.filter(e => e.status === 'approved').length,
				rejected: expenses.filter(e => e.status === 'rejected').length,
				paid: expenses.filter(e => e.status === 'paid').length
			},
			byCategory: expenses.reduce((acc, e) => {
				acc[e.category] = (acc[e.category] || 0) + e.amount;
				return acc;
			}, {} as Record<string, number>)
		};

		return {
			project,
			expenses,
			expenseStats
		};
	} catch (err) {
		console.error('Error loading project:', err);
		throw error(404, 'Project not found');
	}
};
