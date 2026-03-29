/**
 * DepartmentProvider — Svelte 5 reactive context store.
 *
 * Pattern: instantiate once in the page component, call setContext(),
 * then any child component calls getDepartmentContext() to read reactive state.
 *
 * This keeps the controller/provider separation clean:
 *   - DepartmentController  → server-side, fetches + shapes data
 *   - DepartmentProvider    → client-side, holds reactive state + UI actions
 */

import { getContext, setContext } from 'svelte';
import type { DepartmentDetailDTO } from '../controllers/DepartmentController';
import type { DepartmentMetrics, PhaseMetrics } from '../models/Department';

const CONTEXT_KEY = Symbol('department');

export type PhaseFilter = 'all' | 'phase1' | 'phase2' | 'phase3';

export class DepartmentProvider {
	// Reactive state via Svelte 5 runes
	readonly department = $state<DepartmentDetailDTO | null>(null);
	selectedPhase = $state<PhaseFilter>('all');
	activeTab = $state<string>('overview');
	isLoading = $state(false);
	error = $state<string | null>(null);

	constructor(initial: DepartmentDetailDTO) {
		this.department = initial;
	}

	// ── Derived metrics ──────────────────────────────────────────────────────

	get metrics(): DepartmentMetrics | null {
		return this.department?.metrics ?? null;
	}

	get phaseMetrics(): DepartmentMetrics['phases'][keyof DepartmentMetrics['phases']] | DepartmentMetrics | null {
		if (!this.department) return null;
		if (this.selectedPhase === 'all') return this.department.metrics;
		return this.department.metrics.phases[this.selectedPhase];
	}

	get filteredProjects() {
		if (!this.department) return [];
		if (this.selectedPhase === 'all') return this.department.projects;
		return this.department.projects.filter(p => p.phase === this.selectedPhase);
	}

	get filteredMetrics(): {
		projects: { total: number };
		budget: { total: number; actual: number; forecasted: number; remaining: number };
	} {
		if (!this.department) {
			return { projects: { total: 0 }, budget: { total: 0, actual: 0, forecasted: 0, remaining: 0 } };
		}
		if (this.selectedPhase === 'all') {
			return {
				projects: this.department.metrics.projects,
				budget: this.department.metrics.budget
			};
		}
		const phase = this.department.metrics.phases[this.selectedPhase];
		return {
			projects: { total: phase.projectCount },
			budget: {
				total: phase.budget,
				actual: phase.actual,
				forecasted: phase.forecasted,
				remaining: phase.budget - phase.actual
			}
		};
	}

	get pendingExpenseAmount(): number {
		if (!this.department) return 0;
		const { expenses } = this.department.metrics;
		const pendingCount = expenses.draft + expenses.submitted;
		const avgAmount = expenses.total > 0 ? expenses.totalAmount / expenses.total : 0;
		return pendingCount * avgAmount;
	}

	get spendPct(): number {
		const { budget } = this.filteredMetrics;
		if (budget.total === 0) return 0;
		return (budget.actual / budget.total) * 100;
	}

	get spendColor(): 'emerald' | 'yellow' | 'red' {
		if (this.spendPct >= 100) return 'red';
		if (this.spendPct >= 80) return 'yellow';
		return 'emerald';
	}

	// ── Actions ──────────────────────────────────────────────────────────────

	setPhase(phase: PhaseFilter) {
		this.selectedPhase = phase;
	}

	setTab(tab: string) {
		this.activeTab = tab;
	}

	// ── Context helpers ───────────────────────────────────────────────────────

	static provide(initial: DepartmentDetailDTO): DepartmentProvider {
		const provider = new DepartmentProvider(initial);
		setContext(CONTEXT_KEY, provider);
		return provider;
	}

	static inject(): DepartmentProvider {
		const ctx = getContext<DepartmentProvider>(CONTEXT_KEY);
		if (!ctx) throw new Error('DepartmentProvider not found in context. Did you forget to call DepartmentProvider.provide()?');
		return ctx;
	}
}
