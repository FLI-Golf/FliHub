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

		// Fetch tasks for this project
		let tasks = [];
		try {
			const result = await pb.collection('tasks').getList(1, 50, {
				filter: `projectId = "${params.id}"`
			});
			tasks = result.items;
		} catch (taskErr: any) {
			console.error('Error fetching tasks:', taskErr);
		}

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

		// Fetch all vendors for selection
		let allVendors = [];
		try {
			allVendors = await pb.collection('vendors').getFullList({
				sort: 'name'
			});
		} catch (vendorErr: any) {
			console.error('Error fetching vendors:', vendorErr);
		}

		return {
			project,
			expenses,
			expenseStats,
			tasks,
			allVendors
		};
	} catch (err: any) {
		console.error('Error loading project:', err);
		throw error(404, 'Project not found');
	}
};
