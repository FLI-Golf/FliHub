import type PocketBase from 'pocketbase';
import { Department } from '$lib/domain/models/Department';
import type { ProjectSummary, ExpenseSummary } from '$lib/domain/models/Department';
import type { IDepartmentRepository } from '$lib/domain/repositories/IDepartmentRepository';

const EXPENSE_BATCH = 4;

export class DepartmentRepo implements IDepartmentRepository {
	constructor(private pb: PocketBase) {}

	async findById(id: string): Promise<Department | null> {
		try {
			const record = await this.pb.collection('departments').getOne(id, { expand: 'headOfDepartment' });
			const projects = await this.findProjectsByDepartment(id);
			const expenses = projects.length > 0
				? await this.findExpensesByProjects(projects.map(p => p.id))
				: [];
			return Department.fromRecord(record, projects, expenses);
		} catch {
			return null;
		}
	}

	async findAll(): Promise<Department[]> {
		const records = await this.pb.collection('departments').getFullList({
			sort: 'name',
			expand: 'headOfDepartment'
		});
		return records.map((r: any) => Department.fromRecord(r));
	}

	async findProjectsByDepartment(departmentId: string): Promise<ProjectSummary[]> {
		try {
			const records = await this.pb.collection('projects').getFullList({
				filter: `department = "${departmentId}"`,
				sort: 'name'
			});
			return records.map((r: any) => ({
				id: r.id,
				name: r.name,
				status: r.status,
				phase: Department.getProjectPhase({
					id: r.id, name: r.name, status: r.status, phase: 'phase1',
					budget: r.project_budget ?? 0,
					actual: r.project_actual_expenses ?? 0,
					forecasted: r.project_forecasted_expenses ?? 0,
					department: r.department,
					fiscalYear: r.fiscalYear
				}),
				budget: r.project_budget ?? 0,
				actual: r.project_actual_expenses ?? 0,
				forecasted: r.project_forecasted_expenses ?? 0,
				department: r.department,
				fiscalYear: r.fiscalYear
			}));
		} catch {
			return [];
		}
	}

	async findExpensesByProjects(projectIds: string[]): Promise<ExpenseSummary[]> {
		const batches: string[][] = [];
		for (let i = 0; i < projectIds.length; i += EXPENSE_BATCH) {
			batches.push(projectIds.slice(i, i + EXPENSE_BATCH));
		}
		const results = await Promise.all(
			batches.map(ids =>
				this.pb.collection('expenses').getFullList({
					filter: ids.map(id => `project = "${id}"`).join(' || '),
					fields: 'id,amount,status,project,category'
				}).catch(() => [])
			)
		);
		return results.flat().map((r: any) => ({
			id: r.id,
			amount: r.amount ?? 0,
			status: r.status,
			projectId: r.project,
			category: r.category
		}));
	}
}
