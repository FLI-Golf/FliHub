import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb } = ctx;

	try {
		const [tasks, vendors] = await Promise.all([
			pb.collection('tasks').getFullList({
				sort: '-id',
				expand: 'projectId,projectId.department,assignedTo'
			}).catch(() => []),
			pb.collection('vendors').getFullList({ sort: 'name', fields: 'id,name' }).catch(() => [])
		]);

		const taskExpenses = await pb.collection('expenses').getFullList({
			filter: 'taskId != ""',
			fields: 'id,taskId,amount,status'
		}).catch(() => []);

		const expensesByTask: Record<string, { total: number; paid: number }> = {};
		for (const exp of taskExpenses) {
			if (!exp.taskId) continue;
			if (!expensesByTask[exp.taskId]) expensesByTask[exp.taskId] = { total: 0, paid: 0 };
			expensesByTask[exp.taskId].total += exp.amount || 0;
			if (exp.status === 'paid') expensesByTask[exp.taskId].paid += exp.amount || 0;
		}

		return { tasks, vendors, expensesByTask };
	} catch (e: any) {
		console.error('tasks load error:', e?.message);
		return { tasks: [], vendors: [], expensesByTask: {} };
	}
};
