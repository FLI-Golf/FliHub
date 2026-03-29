import type { IDepartmentRepository } from '../repositories/IDepartmentRepository';
import type { Department, DepartmentMetrics } from '../models/Department';
import { Result } from '../base/Result';

export interface DepartmentDetailDTO {
	id: string;
	name: string;
	code?: string;
	description?: string;
	status: string;
	budgetMode: string;
	headOfDepartmentName?: string;
	isOverBudget: boolean;
	budgetHealthStatus: string;
	budgetUtilizationPct: number;
	metrics: DepartmentMetrics;
	projects: Array<{
		id: string;
		name: string;
		status: string;
		phase: string;
		budget: number;
		actual: number;
		forecasted: number;
	}>;
	expenses: Array<{
		id: string;
		amount: number;
		status: string;
		projectId?: string;
		category?: string;
	}>;
}

export interface DepartmentListDTO {
	id: string;
	name: string;
	code?: string;
	status: string;
	headOfDepartmentName?: string;
	budgetHealthStatus: string;
	budgetUtilizationPct: number;
	effectiveBudget: number;
	actualExpenses: number;
}

/**
 * DepartmentController — server-side orchestration layer.
 *
 * Sits between the SvelteKit load function and the repository.
 * Keeps route files thin: they call the controller, get a DTO, return it.
 * All business logic (budget health, phase attribution, metric rollups)
 * lives in the domain model; the controller just coordinates.
 */
export class DepartmentController {
	constructor(private readonly repo: IDepartmentRepository) {}

	async getDetail(id: string): Promise<Result<DepartmentDetailDTO>> {
		const dept = await this.repo.findById(id);
		if (!dept) return Result.fail(`Department ${id} not found`);

		return Result.ok(this.#toDetailDTO(dept));
	}

	async getList(): Promise<Result<DepartmentListDTO[]>> {
		const depts = await this.repo.findAll();
		return Result.ok(depts.map(d => this.#toListDTO(d)));
	}

	#toDetailDTO(dept: Department): DepartmentDetailDTO {
		return {
			id: dept.id,
			name: dept.name,
			code: dept.props.code,
			description: dept.props.description,
			status: dept.props.status,
			budgetMode: dept.props.budgetMode,
			headOfDepartmentName: dept.props.headOfDepartmentName,
			isOverBudget: dept.isOverBudget,
			budgetHealthStatus: dept.budgetHealthStatus,
			budgetUtilizationPct: dept.budgetUtilizationPct,
			metrics: dept.computeMetrics(),
			projects: dept.projects.map(p => ({
				id: p.id,
				name: p.name,
				status: p.status,
				phase: p.phase,
				budget: p.budget,
				actual: p.actual,
				forecasted: p.forecasted
			})),
			expenses: dept.expenses.map(e => ({
				id: e.id,
				amount: e.amount,
				status: e.status,
				projectId: e.projectId,
				category: e.category
			}))
		};
	}

	#toListDTO(dept: Department): DepartmentListDTO {
		return {
			id: dept.id,
			name: dept.name,
			code: dept.props.code,
			status: dept.props.status,
			headOfDepartmentName: dept.props.headOfDepartmentName,
			budgetHealthStatus: dept.budgetHealthStatus,
			budgetUtilizationPct: dept.budgetUtilizationPct,
			effectiveBudget: dept.effectiveBudget,
			actualExpenses: dept.props.actualExpenses
		};
	}
}
