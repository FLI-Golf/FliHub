import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { pb } = await RequestContext.from(locals, url);

	const marketingGoals = await pb.collection('marketing_goals')
		.getFullList({ sort: 'goalName' })
		.catch(() => []);

	const stats = {
		total: marketingGoals.length,
		byStatus: {
			notStarted: marketingGoals.filter((g: any) => g.status === 'Not Started').length,
			inProgress: marketingGoals.filter((g: any) => g.status === 'In Progress').length,
			completed:  marketingGoals.filter((g: any) => g.status === 'Completed').length,
			onHold:     marketingGoals.filter((g: any) => g.status === 'On Hold').length
		},
		byCategory: {} as Record<string, number>,
		byPriority: {
			high:   marketingGoals.filter((g: any) => g.priority === 'High').length,
			medium: marketingGoals.filter((g: any) => g.priority === 'Medium').length,
			low:    marketingGoals.filter((g: any) => g.priority === 'Low').length
		}
	};
	for (const g of marketingGoals as any[]) {
		if (g.category) stats.byCategory[g.category] = (stats.byCategory[g.category] ?? 0) + 1;
	}

	return { marketingGoals, stats };
};
