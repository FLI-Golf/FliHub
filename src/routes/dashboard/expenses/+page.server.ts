import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile, role } = ctx;
	
	try {
		// Fetch all expenses with expanded relations
		const expenses = await pb.collection('expenses').getFullList({
			sort: '-date',
			expand: 'projectId,submittedBy,approvedBy,vendor'
		});

		// Calculate expense statistics
		const stats = {
			total: expenses.length,
			byStatus: {
				draft: expenses.filter(e => e.status === 'draft').length,
				submitted: expenses.filter(e => e.status === 'submitted').length,
				approved: expenses.filter(e => e.status === 'approved').length,
				rejected: expenses.filter(e => e.status === 'rejected').length,
				paid: expenses.filter(e => e.status === 'paid').length
			},
			amounts: {
				total: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
				draft: expenses.filter(e => e.status === 'draft').reduce((sum, e) => sum + (e.amount || 0), 0),
				submitted: expenses.filter(e => e.status === 'submitted').reduce((sum, e) => sum + (e.amount || 0), 0),
				approved: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.amount || 0), 0),
				paid: expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0)
			},
			byCategory: {} as Record<string, { count: number; amount: number }>
		};

		// Group by category
		expenses.forEach(expense => {
			const category = expense.category || 'other';
			if (!stats.byCategory[category]) {
				stats.byCategory[category] = { count: 0, amount: 0 };
			}
			stats.byCategory[category].count++;
			stats.byCategory[category].amount += expense.amount || 0;
		});

		// Sort categories by amount
		const sortedCategories = Object.entries(stats.byCategory)
			.sort(([, a], [, b]) => b.amount - a.amount)
			.slice(0, 10);

		// Get pending approvals (submitted status)
		const pendingApprovals = expenses.filter(e => e.status === 'submitted');

		return {
			expenses,
			stats,
			topCategories: sortedCategories,
			pendingApprovals
		};
	} catch (error) {
		console.error('Error loading expenses:', error);
		return {
			expenses: [],
			stats: {
				total: 0,
				byStatus: { draft: 0, submitted: 0, approved: 0, rejected: 0, paid: 0 },
				amounts: { total: 0, draft: 0, submitted: 0, approved: 0, paid: 0 },
				byCategory: {}
			},
			topCategories: [],
			pendingApprovals: []
		};
	}
};
