import type { ProjectStatus } from '../schemas';

export type DepartmentStatus = 'active' | 'inactive';
export type BudgetMode = 'auto' | 'annual_cap' | 'allocated';

export interface DepartmentProps {
	id: string;
	name: string;
	code?: string;
	description?: string;
	status: DepartmentStatus;
	budgetMode: BudgetMode;
	annualBudget: number;
	actualExpenses: number;
	manualBudgetOverride?: number;
	budgetCap?: number;
	headOfDepartmentId?: string;
	headOfDepartmentName?: string;
	created?: Date;
	updated?: Date;
}

export interface ProjectSummary {
	id: string;
	name: string;
	status: ProjectStatus;
	phase: 'phase1' | 'phase2' | 'phase3';
	budget: number;
	actual: number;
	forecasted: number;
	department: string;
	fiscalYear?: string;
}

export interface ExpenseSummary {
	id: string;
	amount: number;
	status: string;
	projectId?: string;
	category?: string;
}

export interface PhaseMetrics {
	projectCount: number;
	budget: number;
	actual: number;
	forecasted: number;
}

export interface DepartmentMetrics {
	budget: {
		total: number;
		allocated: number;
		actual: number;
		forecasted: number;
		remaining: number;
	};
	projects: {
		total: number;
		in_progress: number;
		planned: number;
		completed: number;
		draft: number;
		cancelled: number;
	};
	expenses: {
		total: number;
		totalAmount: number;
		approvedAmount: number;
		paid: number;
		approved: number;
		submitted: number;
		draft: number;
	};
	phases: {
		phase1: PhaseMetrics;
		phase2: PhaseMetrics;
		phase3: PhaseMetrics;
	};
}

/**
 * Department domain model.
 * Owns all budget and phase metric calculations — no raw math in routes.
 */
export class Department {
	constructor(
		public readonly props: DepartmentProps,
		public readonly projects: ProjectSummary[] = [],
		public readonly expenses: ExpenseSummary[] = []
	) {}

	get id() { return this.props.id; }
	get name() { return this.props.name; }
	get isActive() { return this.props.status === 'active'; }

	/** Effective budget: manual override > cap > annual budget */
	get effectiveBudget(): number {
		if (this.props.manualBudgetOverride) return this.props.manualBudgetOverride;
		if (this.props.budgetCap) return Math.min(this.props.annualBudget, this.props.budgetCap);
		return this.props.annualBudget;
	}

	get budgetUtilizationPct(): number {
		const budget = this.effectiveBudget;
		if (budget === 0) return 0;
		return (this.props.actualExpenses / budget) * 100;
	}

	get isOverBudget(): boolean {
		return this.props.actualExpenses > this.effectiveBudget;
	}

	get budgetHealthStatus(): 'healthy' | 'warning' | 'critical' {
		const pct = this.budgetUtilizationPct;
		if (pct >= 100) return 'critical';
		if (pct >= 80) return 'warning';
		return 'healthy';
	}

	/** Assign a project to a phase based on fiscal year / name convention */
	static getProjectPhase(project: ProjectSummary): 'phase1' | 'phase2' | 'phase3' {
		const name = (project.name || '').toLowerCase();
		const fy = (project.fiscalYear || '').toLowerCase();
		if (name.includes('phase 3') || name.includes('phase3') || fy.includes('phase3')) return 'phase3';
		if (name.includes('phase 2') || name.includes('phase2') || fy.includes('phase2')) return 'phase2';
		return 'phase1';
	}

	/** Full metrics snapshot — computed once, consumed everywhere */
	computeMetrics(): DepartmentMetrics {
		const totalBudget = this.effectiveBudget;
		const projectBudgets = this.projects.reduce((s, p) => s + (p.budget || 0), 0);
		const actualExpenses = this.projects.reduce((s, p) => s + (p.actual || 0), 0);
		const forecastedExpenses = this.projects.reduce((s, p) => s + (p.forecasted || 0), 0);

		const projectsByStatus = {
			in_progress: 0, planned: 0, completed: 0, draft: 0, cancelled: 0
		};
		for (const p of this.projects) {
			if (p.status in projectsByStatus) {
				(projectsByStatus as any)[p.status]++;
			}
		}

		// Expense totals
		const totalExpenseAmount = this.expenses.reduce((s, e) => s + (e.amount || 0), 0);
		const approvedExpenseAmount = this.expenses
			.filter(e => e.status === 'approved' || e.status === 'paid')
			.reduce((s, e) => s + (e.amount || 0), 0);
		const expensesByStatus = { paid: 0, approved: 0, submitted: 0, draft: 0 };
		for (const e of this.expenses) {
			if (e.status in expensesByStatus) (expensesByStatus as any)[e.status]++;
		}

		// Phase attribution via project
		const projectPhaseMap = new Map(
			this.projects.map(p => [p.id, Department.getProjectPhase(p)])
		);

		const phaseExpenseActual = { phase1: 0, phase2: 0, phase3: 0 };
		const phaseExpenseForecasted = { phase1: 0, phase2: 0, phase3: 0 };
		for (const e of this.expenses) {
			const ph = (projectPhaseMap.get(e.projectId ?? '') ?? 'phase1') as keyof typeof phaseExpenseActual;
			if (e.status === 'approved' || e.status === 'paid') phaseExpenseActual[ph] += e.amount || 0;
			if (['submitted', 'approved', 'paid'].includes(e.status)) phaseExpenseForecasted[ph] += e.amount || 0;
		}

		const buildPhase = (phase: 'phase1' | 'phase2' | 'phase3'): PhaseMetrics => {
			const ps = this.projects.filter(p => Department.getProjectPhase(p) === phase);
			const pCount = ps.length;
			const pBudget = totalBudget * (pCount / Math.max(this.projects.length, 1));
			return {
				projectCount: pCount,
				budget: pBudget,
				actual: ps.reduce((s, p) => s + (p.actual || 0), 0) + phaseExpenseActual[phase],
				forecasted: ps.reduce((s, p) => s + (p.forecasted || 0), 0) + phaseExpenseForecasted[phase]
			};
		};

		return {
			budget: {
				total: totalBudget,
				allocated: projectBudgets,
				actual: actualExpenses,
				forecasted: forecastedExpenses,
				remaining: totalBudget - actualExpenses
			},
			projects: { total: this.projects.length, ...projectsByStatus },
			expenses: {
				total: this.expenses.length,
				totalAmount: totalExpenseAmount,
				approvedAmount: approvedExpenseAmount,
				...expensesByStatus
			},
			phases: {
				phase1: buildPhase('phase1'),
				phase2: buildPhase('phase2'),
				phase3: buildPhase('phase3')
			}
		};
	}

	/** Metrics filtered to a single phase */
	metricsForPhase(phase: 'phase1' | 'phase2' | 'phase3' | 'all'): DepartmentMetrics {
		if (phase === 'all') return this.computeMetrics();
		const phaseProjects = this.projects.filter(p => Department.getProjectPhase(p) === phase);
		const phaseExpenses = this.expenses.filter(
			e => Department.getProjectPhase(
				this.projects.find(p => p.id === e.projectId) ?? { phase } as any
			) === phase
		);
		const filtered = new Department(this.props, phaseProjects, phaseExpenses);
		return filtered.computeMetrics();
	}

	static fromRecord(record: any, projects: ProjectSummary[] = [], expenses: ExpenseSummary[] = []): Department {
		return new Department(
			{
				id: record.id,
				name: record.name,
				code: record.code,
				description: record.description,
				status: record.status ?? 'active',
				budgetMode: record.department_budget_mode ?? 'auto',
				annualBudget: record.department_annual_budget ?? 0,
				actualExpenses: record.department_actual_expenses ?? 0,
				manualBudgetOverride: record.department_manual_budget_override,
				budgetCap: record.department_budget_cap,
				headOfDepartmentId: record.headOfDepartment,
				headOfDepartmentName: record.expand?.headOfDepartment
					? `${record.expand.headOfDepartment.firstName ?? ''} ${record.expand.headOfDepartment.lastName ?? ''}`.trim()
					: undefined,
				created: record.created ? new Date(record.created) : undefined,
				updated: record.updated ? new Date(record.updated) : undefined
			},
			projects,
			expenses
		);
	}
}
