import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, params }) => {
		const departmentId = params.id;

	// Return dummy data for now to test if route works
	return {
		department: {
			id: departmentId,
			name: 'Test Department',
			description: 'Testing route',
			annualBudget: 500000,
			expand: {
				headOfDepartment: {
					firstName: 'Test',
					lastName: 'User'
				}
			}
		},
		projects: [],
		tasks: [],
		expenses: [],
		metrics: {
			projects: {
				total: 0,
				active: 0,
				completed: 0
			},
			budget: {
				total: 500000,
				allocated: 0,
				spent: 0,
				remaining: 500000
			},
			expenses: {
				total: 0,
				totalAmount: 0,
				pending: 0,
				approved: 0
			}
		}
	}
};
