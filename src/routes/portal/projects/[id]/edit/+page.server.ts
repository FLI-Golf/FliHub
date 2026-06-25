import type { PageServerLoad, Actions } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url, parent, params }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) redirect(302, '/auth/login');

	const adminPb = await getAdminPocketBase();
	const profile = (ctx.profile as any) ?? {};
	const profileId = profile?.id ?? null;

	try {
		const project = await adminPb.collection('projects').getOne(params.id);

		// Verify user can edit this project (must be department head or project head)
		const userCanEdit =
			project.headOfDepartment === profileId ||
			(await checkIfDepartmentHead(adminPb, profileId, project.department));

		if (!userCanEdit) {
			redirect(302, '/portal/projects');
		}

		// Get department info for context
		let department = null;
		if (project.department) {
			try {
				department = await adminPb.collection('departments').getOne(project.department);
			} catch (e) {
				console.error('Failed to fetch department:', e);
			}
		}

		return { project, department };
	} catch (e) {
		console.error('Failed to load project:', e);
		redirect(302, '/portal/projects');
	}
};

async function checkIfDepartmentHead(pb: any, profileId: string, departmentId: string): Promise<boolean> {
	if (!profileId || !departmentId) return false;
	try {
		const dept = await pb.collection('departments').getOne(departmentId);
		return dept.headOfDepartment === profileId;
	} catch (e) {
		return false;
	}
}

export const actions: Actions = {
	update: async ({ locals, request, params }) => {
		const adminPb = await getAdminPocketBase();
		const data = await request.formData();

		const projectId = params.id;
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const status = data.get('status') as string;
		const category = data.get('category') as string;
		const phase = data.get('phase') as string;
		const notes = data.get('notes') as string;
		const projectBudget = parseFloat((data.get('project_budget') as string) || '0');
		const projectForecasted = parseFloat((data.get('project_forecasted_expenses') as string) || '0');

		try {
			await adminPb.collection('projects').update(projectId, {
				name,
				description,
				status,
				category,
				phase,
				notes,
				project_budget: projectBudget,
				project_forecasted_expenses: projectForecasted,
			});

			return { success: true };
		} catch (e) {
			console.error('Failed to update project:', e);
			return { success: false, error: String(e) };
		}
	},
};
