import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	const scoreboards = await ctx.pb.collection('scoreboards').getFullList({
		sort: '-created',
		fields: 'id,name,stage,displayType,location,quotedCost,approvedBudget,actualCost'
	}).catch(() => []);

	const scoreboardStats = {
		total:       scoreboards.length,
		live:        scoreboards.filter((s: any) => s.stage === 'live').length,
		inProgress:  scoreboards.filter((s: any) => !['live','cancelled','maintenance'].includes(s.stage)).length,
		maintenance: scoreboards.filter((s: any) => s.stage === 'maintenance').length,
		needsApproval: scoreboards.filter((s: any) => s.stage === 'approval').length,
		totalBudget: scoreboards.reduce((sum: number, s: any) => sum + (s.approvedBudget ?? s.quotedCost ?? 0), 0)
	};

	return { scoreboards, scoreboardStats };
};
