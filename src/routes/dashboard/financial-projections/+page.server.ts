import type { PageServerLoad } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const pb  = ctx.pb;

	try {
		// Pull live department budgets + actuals
		const departments = await pb.collection('departments').getFullList({
			fields: 'id,name,code,department_annual_budget,department_actual_expenses,status',
			sort: 'name'
		}).catch(() => []);

		// Pull sponsor revenue (active/contracted/renewed)
		const sponsors = await pb.collection('sponsors').getFullList({
			fields: 'id,status,annualCommitment,totalPaid,tier',
			filter: 'status = "active" || status = "contracted" || status = "renewed"'
		}).catch(() => []);

		// Pull sponsor payments received
		const sponsorPayments = await pb.collection('sponsor_payments').getFullList({
			fields: 'id,amount,status,year',
			filter: 'status = "received"'
		}).catch(() => []);

		// Pull active projects count + budget
		const projects = await pb.collection('projects').getFullList({
			fields: 'id,status,project_budget,project_actual_expenses',
		}).catch(() => []);

		// Aggregate
		const totalBudgeted  = (departments as any[]).reduce((s, d) => s + (d.department_annual_budget || 0), 0);
		const totalActualExp = (departments as any[]).reduce((s, d) => s + (d.department_actual_expenses || 0), 0);
		const totalContractedRevenue = (sponsors as any[]).reduce((s, sp) => s + (sp.annualCommitment || 0), 0);
		const totalReceivedRevenue   = (sponsorPayments as any[]).reduce((s, p) => s + (p.amount || 0), 0);

		const projectsByStatus = {
			planned:     (projects as any[]).filter(p => p.status === 'planned').length,
			in_progress: (projects as any[]).filter(p => p.status === 'in_progress').length,
			completed:   (projects as any[]).filter(p => p.status === 'completed').length,
			total:       (projects as any[]).length
		};

		return {
			liveData: {
				departments: departments as any[],
				totalBudgeted,
				totalActualExp,
				totalContractedRevenue,
				totalReceivedRevenue,
				projectsByStatus,
				sponsorCount: (sponsors as any[]).length
			}
		};
	} catch {
		return { liveData: null };
	}
};
