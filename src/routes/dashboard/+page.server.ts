import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	const { pb, userId, profile: userProfile } = ctx;
	try {
	
	
		// Fetch all core data in parallel — each wrapped so one failure doesn't kill the page
		const [projects, departments, expenses, approvals, sponsors, franchiseLeads, franchiseOpps, ticketSales, brandingPlacements] = await Promise.all([
			pb.collection('projects').getFullList({ fields: 'id,name,status,department,project_budget,project_actual_expenses,project_forecasted_expenses,fiscalYear' }).catch(() => []),
			pb.collection('departments').getFullList({ fields: 'id,name,description,status,department_annual_budget,department_actual_expenses' }).catch(() => []),
			pb.collection('expenses').getFullList({ fields: 'id,amount,status,project' }).catch(() => []),
			pb.collection('approvals').getFullList({ fields: 'id,status' }).catch(() => []),
			pb.collection('sponsors').getFullList({ fields: 'id,status,tier,type,committed_amount,paid_amount' }).catch(() => []),
			pb.collection('franchise_leads').getFullList({ fields: 'id,status' }).catch(() => []),
			pb.collection('franchise_opportunities').getFullList({ fields: 'id,status' }).catch(() => []),
			pb.collection('ticket_sales').getFullList({ fields: 'id,status,grossRevenue,netRevenue,quantity,pricePerTicket,platformFees' }).catch(() => []),
			pb.collection('branding_placements').getFullList({ fields: 'id,status,grossRevenue,quantity,ratePerPlacement' }).catch(() => []),
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
			const actual     = dProjects.reduce((s: number, p: any) => s + (p.project_actual_expenses ?? 0), 0);
			const forecasted = dProjects.reduce((s: number, p: any) => s + (p.project_forecasted_expenses ?? 0), 0);
			const budgeted   = dProjects.reduce((s: number, p: any) => s + (p.project_budget ?? 0), 0);
			// Use whichever is larger: the department's own budget field or the sum of
			// its projects' budgets. Prevents a stale/low department_annual_budget from
			// producing a nonsensical >100% spent figure.
			const budget = Math.max(d.department_annual_budget ?? 0, budgeted);
			return {
				id: d.id,
				name: d.name,
				description: d.description ?? '',
				status: d.status ?? 'active',

				budget,
				actual,
				forecasted,
				budgeted,
				projectCount: dProjects.length,
				projects: dProjects.map((p: any) => ({
					id: p.id,
					name: p.name,
					status: p.status,
					budget: p.project_budget ?? 0,
					actual: p.project_actual_expenses ?? 0,
					forecasted: p.project_forecasted_expenses ?? 0,
				}))
			};
		}).sort((a, b) => {
			// Active projects first, then by project count desc, then budget desc
			const aActive = a.projects.filter((p: any) => p.status === 'in_progress').length;
			const bActive = b.projects.filter((p: any) => p.status === 'in_progress').length;
			if (bActive !== aActive) return bActive - aActive;
			if (b.projectCount !== a.projectCount) return b.projectCount - a.projectCount;
			return b.budget - a.budget;
		});
	
		// Branding placement revenue rollup
		const bp = brandingPlacements as any[];
		const brandingMetrics = {
			totalContracted: bp.filter(r => !['proposed','cancelled'].includes(r.status)).reduce((s, r) => s + (r.grossRevenue ?? 0), 0),
			totalPaid:       bp.filter(r => ['paid','activated','completed'].includes(r.status)).reduce((s, r) => s + (r.grossRevenue ?? 0), 0),
			totalProposed:   bp.filter(r => r.status === 'proposed').reduce((s, r) => s + (r.grossRevenue ?? 0), 0),
			count:           bp.length,
		};

		// Ticket revenue rollup
		const ts = ticketSales as any[];
		const ticketMetrics = {
			totalGross:     ts.reduce((s, r) => s + (r.grossRevenue ?? (r.quantity * r.pricePerTicket) ?? 0), 0),
			totalNet:       ts.reduce((s, r) => s + (r.netRevenue ?? 0), 0),
			totalReceived:  ts.filter(r => ['completed','reconciled'].includes(r.status)).reduce((s, r) => s + (r.netRevenue ?? 0), 0),
			totalProjected: ts.filter(r => ['projected','on_sale','sold_out'].includes(r.status)).reduce((s, r) => s + (r.grossRevenue ?? (r.quantity * r.pricePerTicket) ?? 0), 0),
			count:          ts.length,
		};

		return {
			user: locals.pb.authStore.model,
			userProfile,
			metrics: {
				budget: { total: totalBudget, actual: actualSpend, forecasted, remaining: totalBudget - actualSpend },
				projects: pByStatus,
				expenses: expByStatus,
				approvals: appByStatus,
				sponsors: sponsorMetrics,
				tickets: ticketMetrics,
				branding: brandingMetrics,
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
