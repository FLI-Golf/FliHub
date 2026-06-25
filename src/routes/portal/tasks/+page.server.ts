import type { PageServerLoad, Actions } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) return { tasks: [], projects: [] };

	const adminPb = await getAdminPocketBase();
	const profile = (ctx.profile as any) ?? {};
	const profileId = profile?.id ?? null;
	const departmentId = profile?.departmentId ?? null;
	const role = ctx.role;

	try {
		let tasks: any[] = [];
		let projects: any[] = [];
		let allProjects: any[] = [];

		// First, get all projects visible to this user
		if (role === 'leader') {
			// For leaders: projects in their departments or where they're the head
			let departments: any[] = [];
			if (profileId) {
				departments = await adminPb.collection('departments').getFullList({
					filter: `headOfDepartment = "${profileId}"`,
					perPage: 100,
				}).catch(() => []);
			}

			if (departmentId && !departments.some(d => d.id === departmentId)) {
				try {
					const assignedDept = await adminPb.collection('departments').getOne(departmentId);
					departments.push(assignedDept);
				} catch (e) {
					console.error('Failed to fetch assigned department:', e);
				}
			}

			try {
				const deptIds = departments.map(d => d.id);
				allProjects = await adminPb.collection('projects').getFullList({ perPage: 500 }).catch(() =>
					adminPb.collection('projects').getFullList({ perPage: 100 })
				);
				projects = allProjects.filter(p => 
					deptIds.includes(p.department) || (profileId && p.headOfDepartment === profileId)
				);
			} catch (e) {
				console.error('Failed to load projects:', e);
			}
		} else if (profileId) {
			// Non-leaders see projects they head OR projects in their department
			try {
				allProjects = await adminPb.collection('projects').getFullList({ perPage: 500 }).catch(() =>
					adminPb.collection('projects').getFullList({ perPage: 100 })
				);
				projects = allProjects.filter(p => 
					p.headOfDepartment === profileId || (departmentId && p.department === departmentId)
				);
			} catch (e) {
				console.error('Failed to load projects:', e);
			}
		} else {
			// Default: in-progress projects
			try {
				allProjects = await adminPb.collection('projects').getFullList({ perPage: 500 }).catch(() =>
					adminPb.collection('projects').getFullList({ perPage: 100 })
				);
				projects = allProjects.filter(p => p.status === 'in_progress');
			} catch (e) {
				console.error('Failed to load default projects:', e);
			}
		}

		// Get all tasks
		try {
			const allTasks = await adminPb.collection('tasks').getFullList({ perPage: 500 }).catch(() =>
				adminPb.collection('tasks').getFullList({ perPage: 100 })
			);

			const projectIds = projects.map(p => p.id);
			tasks = allTasks
				.filter(t => projectIds.includes(t.projectId))
				.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
		} catch (e) {
			console.error('Failed to fetch tasks:', e);
		}

		return { tasks, projects };
	} catch (error) {
		console.error('Failed to load tasks:', error);
		return { tasks: [], projects: [] };
	}
};

export const actions: Actions = {
	updateTaskStatus: async ({ request, locals }) => {
		const ctx = await RequestContext.from(locals, request.url);
		if (!ctx?.userId) return { error: 'Unauthorized' };

		const adminPb = await getAdminPocketBase();
		const formData = await request.formData();
		const taskId = formData.get('taskId') as string;
		const newStatus = formData.get('status') as string;

		if (!taskId || !newStatus) {
			return { error: 'Missing taskId or status' };
		}

		try {
			await adminPb.collection('tasks').update(taskId, { status: newStatus });
			return { success: true };
		} catch (error) {
			console.error('Failed to update task status:', error);
			return { error: 'Failed to update task' };
		}
	}
};
