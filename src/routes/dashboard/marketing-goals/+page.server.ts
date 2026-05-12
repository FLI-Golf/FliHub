import { RequestContext } from '$lib/infra/RequestContext';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const actions: Actions = {
	updateProgress: async ({ locals, url, request }) => {
		const { pb } = await RequestContext.from(locals, url);
		const data = await request.formData();

		const id           = data.get('id') as string;
		const currentValue = parseFloat(data.get('currentValue') as string);
		const status       = data.get('status') as string;

		if (!id) return fail(400, { error: 'Missing goal id.' });

		try {
			const updated = await pb.collection('marketing_goals').update(id, {
				currentValue: isNaN(currentValue) ? 0 : currentValue,
				...(status ? { status } : {}),
			});
			return { success: true, updated };
		} catch (err: any) {
			return fail(500, { error: err?.message ?? 'Update failed.' });
		}
	}
};

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
