import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	const scoreboards = await ctx.pb.collection('scoreboards').getFullList({
		sort: '-created'
	}).catch(() => []);

	const stats = {
		total:        scoreboards.length,
		concept:      scoreboards.filter((s: any) => s.stage === 'concept').length,
		design:       scoreboards.filter((s: any) => s.stage === 'design').length,
		vendorQuote:  scoreboards.filter((s: any) => s.stage === 'vendor_quote').length,
		approval:     scoreboards.filter((s: any) => s.stage === 'approval').length,
		procurement:  scoreboards.filter((s: any) => s.stage === 'procurement').length,
		fabrication:  scoreboards.filter((s: any) => s.stage === 'fabrication').length,
		installation: scoreboards.filter((s: any) => s.stage === 'installation').length,
		testing:      scoreboards.filter((s: any) => s.stage === 'testing').length,
		live:         scoreboards.filter((s: any) => s.stage === 'live').length,
		maintenance:  scoreboards.filter((s: any) => s.stage === 'maintenance').length,
		cancelled:    scoreboards.filter((s: any) => s.stage === 'cancelled').length,
		totalBudget:  scoreboards.reduce((s: number, b: any) => s + (b.approvedBudget ?? b.quotedCost ?? 0), 0),
		totalActual:  scoreboards.reduce((s: number, b: any) => s + (b.actualCost ?? 0), 0)
	};

	return { scoreboards, stats };
};
