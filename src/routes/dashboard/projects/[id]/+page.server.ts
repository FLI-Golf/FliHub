import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const pb = locals.pb;

	try {
		console.log('Loading project with ID:', params.id);
		
		// First try to fetch the project without expand to isolate the issue
		let project;
		try {
			project = await pb.collection('projects').getOne(params.id);
			console.log('Project loaded (no expand):', project.name);
		} catch (basicErr: any) {
			console.error('Failed to load basic project:', basicErr);
			throw basicErr;
		}
		
		// Then try to expand relations
		try {
			project = await pb.collection('projects').getOne(params.id, {
				expand: 'department,approvedBy,vendors'
			});
			console.log('Project loaded with expand:', project.name);
		} catch (expandErr: any) {
			console.warn('Failed to expand relations, using basic project:', expandErr.message);
			// Continue with basic project data
		}

		// Fetch all expenses for this project
		let expenses = [];
		try {
			expenses = await pb.collection('expenses').getFullList({
				filter: `projectId = "${params.id}"`
			});
			console.log(`Loaded ${expenses.length} expenses for project`);
		} catch (expenseErr: any) {
			console.error('Error fetching expenses:', expenseErr);
			console.error('Expenses error details:', expenseErr.message);
			console.warn('⚠️  Expenses collection may not exist or user lacks permission. Continuing without expenses.');
			// Continue without expenses rather than failing the whole page
		}

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
		console.error('=== PROJECT LOAD ERROR ===');
		console.error('Error loading project:', err);
		console.error('Project ID attempted:', params.id);
		console.error('Error status:', err?.status);
		console.error('Error message:', err?.message);
		console.error('Error data:', err?.data);
		console.error('Full error:', JSON.stringify(err, null, 2));
		
		if (err.status === 404) {
			throw error(404, `Project not found with ID: ${params.id}. Please check if the project exists and you have permission to view it.`);
		}
		
		if (err.status === 403) {
			throw error(403, `Access denied to project: ${params.id}. You may not have permission to view this project.`);
		}
		
		throw error(500, `Failed to load project: ${err.message || 'Unknown error'}`);
	}
};
