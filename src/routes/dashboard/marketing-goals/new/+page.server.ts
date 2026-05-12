import { RequestContext } from '$lib/infra/RequestContext';
import { redirect, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ locals, url, request }) => {
		const ctx = await RequestContext.from(locals, url);
		const { pb } = ctx;

		const data = await request.formData();

		const goalName    = (data.get('goalName')    as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		const category    = (data.get('category')    as string)?.trim();
		const targetMetric= (data.get('targetMetric')as string)?.trim();
		const targetValue = parseFloat(data.get('targetValue') as string) || 0;
		const currentValue= parseFloat(data.get('currentValue')as string) || 0;
		const deadline    = (data.get('deadline')    as string)?.trim();
		const status      = (data.get('status')      as string) || 'Not Started';
		const priority    = (data.get('priority')    as string) || 'Medium';

		if (!goalName) {
			return fail(400, { error: 'Goal name is required.' });
		}

		try {
			const record = await pb.collection('marketing_goals').create({
				goalName,
				description,
				category,
				targetMetric,
				targetValue,
				currentValue,
				deadline: deadline || null,
				status,
				priority,
			});
			throw redirect(303, `/dashboard/marketing-goals/${record.id}`);
		} catch (err: any) {
			if (err?.status === 303) throw err;
			return fail(500, { error: err?.message ?? 'Failed to create goal.' });
		}
	}
};
