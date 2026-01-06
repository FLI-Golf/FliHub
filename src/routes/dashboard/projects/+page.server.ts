import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	console.log('=== PROJECTS PAGE LOAD START ===');

	// Fetch projects
	let projects = [];
	try {
		projects = await pb.collection('projects').getFullList({ sort: '-id' });
		console.log(`✓ Fetched ${projects.length} projects`);
	} catch (err: any) {
		console.error('✗ Error fetching projects:', err?.message);
	}

	// Fetch departments
	let departments = [];
	try {
		departments = await pb.collection('departments').getFullList({ sort: 'name' });
		console.log(`✓ Fetched ${departments.length} departments`);
	} catch (err: any) {
		console.error('✗ Error fetching departments:', err?.message);
	}

	// Return data
	return {
		projects,
		departments,
		stats: {
			total: projects.length,
			byStatus: { draft: 0, planned: 0, in_progress: 0, completed: 0, cancelled: 0 },
			byType: { tournament: 0, activation: 0, event: 0, campaign: 0 },
			budget: { total: 0, forecasted: 0, actual: 0, variance: 0, remaining: 0 }
		},
		alerts: {
			overBudget: 0,
			nearingBudget: 0
		}
	}
};
