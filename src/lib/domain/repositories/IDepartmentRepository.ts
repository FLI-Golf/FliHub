import type { Department, ProjectSummary, ExpenseSummary } from '../models/Department';

export interface IDepartmentRepository {
	findById(id: string): Promise<Department | null>;
	findAll(): Promise<Department[]>;
	findProjectsByDepartment(departmentId: string): Promise<ProjectSummary[]>;
	findExpensesByProjects(projectIds: string[]): Promise<ExpenseSummary[]>;
}
