import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile } = ctx;
	try {
	
	
		// Fetch all core data in parallel — each wrapped so one failure doesn't kill the page
		const [projects, departments, expenses, approvals, sponsors, franchiseLeads, franchiseOpps] = await Promise.all([
			pb.collection('projects').getFullList({ fields: 'id,name,status,department,project_budget,project_actual_expenses,project_forecasted_expenses,fiscalYear' }).catch(() => []),
			pb.collection('departments').getFullList({ fields: 'id,name,department_annual_budget,department_actual_expenses' }).catch(() => []),
			pb.collection('expenses').getFullList({ fields: 'id,amount,status,project' }).catch(() => []),
			pb.collection('approvals').getFullList({ fields: 'id,status' }).catch(() => []),
			pb.collection('sponsors').getFullList({ fields: 'id,status,tier,type,committed_amount,paid_amount' }).catch(() => []),
			pb.collection('franchise_leads').getFullList({ fields: 'id,status' }).catch(() => []),
			pb.collection('franchise_opportunities').getFullList({ fields: 'id,status' }).catch(() => []),
		]);
	
		// Budget rollup
		const totalBudget = (departments as any[]).reduce((s, d) => s + (d.department_annual_budget ?? 0), 0);
		const actualSpend = (projects as any[]).reduce((s, p) => s + (p.project_actual_expenses ?? 0), 0);
		const forecasted  = (projects as any[]).reduce((s, p) => s + (p.project_forecasted_expenses ?? 0), 0);
	
		// Project status counts
		const pByStatus = { total: projects.length, in_progress: 0, planned: 0, completed: 0, draft: 0, cancelled: 0 };
		for (const p of projects as any[]) {
			if (p.status in pByStatus) (pByStatus as any)[p.status]++;
		}
	
		// Expense rollup
		const expTotal = (expenses as any[]).reduce((s, e) => s + (e.amount ?? 0), 0);
		const expApproved = (expenses as any[]).filter((e: any) => e.status === 'approved' || e.status === 'paid').reduce((s, e) => s + (e.amount ?? 0), 0);
		const expByStatus = { total: expenses.length, totalAmount: expTotal, approvedAmount: expApproved, submitted: 0, approved: 0, paid: 0, draft: 0 };
		for (const e of expenses as any[]) {
			if (e.status in expByStatus) (expByStatus as any)[e.status]++;
		}
	
		// Approvals
		const appByStatus = { total: approvals.length, pending: 0, approved: 0, rejected: 0, revision_requested: 0 };
		for (const a of approvals as any[]) {
			if (a.status in appByStatus) (appByStatus as any)[a.status]++;
		}
	
		// Sponsors
		const sponsorMetrics = {
			total: sponsors.length,
			totalCommitted: (sponsors as any[]).reduce((s, sp) => s + (sp.committed_amount ?? 0), 0),
			totalPaid: (sponsors as any[]).reduce((s, sp) => s + (sp.paid_amount ?? 0), 0),
			byTier: {} as Record<string, number>,
			byStatus: {} as Record<string, number>
		};
		for (const sp of sponsors as any[]) {
			if (sp.tier) sponsorMetrics.byTier[sp.tier] = (sponsorMetrics.byTier[sp.tier] ?? 0) + 1;
			if (sp.status) sponsorMetrics.byStatus[sp.status] = (sponsorMetrics.byStatus[sp.status] ?? 0) + 1;
		}
	
		// Department budget list for the table
		const departmentBudgets = (departments as any[]).map(d => {
			const dProjects = (projects as any[]).filter(p => p.department === d.id);
			return {
				id: d.id,
				name: d.name,
				budget: d.department_annual_budget ?? 0,
				actual: dProjects.reduce((s: number, p: any) => s + (p.project_actual_expenses ?? 0), 0),
				projectCount: dProjects.length
			};
		}).sort((a, b) => b.budget - a.budget);
	
		return {
			user: locals.pb.authStore.model,
			userProfile,
			metrics: {
				budget: { total: totalBudget, actual: actualSpend, forecasted, remaining: totalBudget - actualSpend },
				projects: pByStatus,
				expenses: expByStatus,
				approvals: appByStatus,
				sponsors: sponsorMetrics,
				franchise: {
					pipeline: {
						leads: franchiseLeads.length,
						opportunities: franchiseOpps.length,
						deals: 0
					}
				},
				departmentBudgets
			}
		};
	} catch (err: any) {
		console.error('dashboard load error:', err?.message ?? err);
		return {};
	}
};
