import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole('marketing_lead', 'admin', 'leader');

	const adminPb = await getAdminPocketBase();

	const [goals, campaigns, sponsors, tasks] = await Promise.all([
		adminPb.collection('marketing_goals').getFullList({
			filter: 'status = "active"',
			sort: '-created',
			perPage: 50,
		}).catch(() => []),
		adminPb.collection('campaigns').getFullList({
			filter: 'status = "in_progress" || status = "active"',
			sort: '-created',
			perPage: 50,
		}).catch(() => []),
		adminPb.collection('sponsors').getFullList({
			filter: 'status = "active"',
			sort: 'companyName',
			perPage: 50,
		}).catch(() => []),
		adminPb.collection('goal_tasks').getFullList({
			filter: 'status != "completed"',
			sort: '-created',
			perPage: 50,
		}).catch(() => []),
	]);

	return {
		stats: {
			activeGoals: goals.length,
			activeCampaigns: campaigns.length,
			activeSponsors: sponsors.length,
			pendingTasks: tasks.length,
		},
		recentGoals: goals.slice(0, 3),
		recentCampaigns: campaigns.slice(0, 3),
	};
};
