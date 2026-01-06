import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('1. Function started');
	
	const pb = locals.pb;
	console.log('2. Got pb instance');

	// Fetch projects
	let projects = [];
	console.log('3. About to fetch projects...');
	try {
		projects = await pb.collection('projects').getFullList({ sort: '-id' });
		console.log(`4. ✓ Fetched ${projects.length} projects`);
	} catch (err: any) {
		console.error('4. ✗ Error fetching projects:', err?.message);
	}

	// Fetch departments
	let departments = [];
	console.log('5. About to fetch departments...');
	try {
		departments = await pb.collection('departments').getFullList({ sort: 'name' });
		console.log(`6. ✓ Fetched ${departments.length} departments`);
	} catch (err: any) {
		console.error('6. ✗ Error fetching departments:', err?.message);
	}

	// Build return object
	console.log('7. Building return object...');
	const returnData = {
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
	};
	
	console.log('8. Return object built successfully');
	console.log('9. Returning data...');
	return returnData;
};
