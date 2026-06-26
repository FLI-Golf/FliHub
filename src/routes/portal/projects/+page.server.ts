import type { PageServerLoad, Actions } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	await parent();
	const ctx = await RequestContext.from(locals, url);
	if (!ctx?.userId) return { projects: [], departments: [], role: null };

	const adminPb = await getAdminPocketBase();
	const profile = (ctx.profile as any) ?? {};
	const profileId = profile?.id ?? null;
	const departmentId = profile?.departmentId ?? null;
	const role = ctx.role;
	const useDepartmentScope = ['leader', 'marketing', 'marketing_lead'].includes(role);

	try {
		let projects: any[] = [];
		let departments: any[] = [];
		let allDepartments: any[] = [];
		let allTasks: any[] = [];

		if (useDepartmentScope) {
			// Fetch all departments where this user is the head (leader-style scoping)
			if (profileId) {
				departments = await adminPb.collection('departments').getFullList({
					filter: `headOfDepartment = "${profileId}"`,
					perPage: 100,
				}).catch(() => []);
			}

			// Also add department assigned to profile via departmentId
			if (departmentId && !departments.some(d => d.id === departmentId)) {
				try {
					const assignedDept = await adminPb.collection('departments').getOne(departmentId);
					departments.push(assignedDept);
				} catch (e) {
					console.error('Failed to fetch assigned department:', e);
				}
			}

			// Fetch projects and filter in memory for reliability
			try {
				const deptIds = departments.map(d => d.id);

				// Fetch with minimal params
				let allProjects: any[] = [];
				try {
					allProjects = await adminPb.collection('projects').getFullList({ perPage: 500 });
				} catch (e1: any) {
					try {
						allProjects = await adminPb.collection('projects').getFullList({ perPage: 200 });
					} catch (e2: any) {
						allProjects = await adminPb.collection('projects').getFullList({ perPage: 100 });
					}
				}

				projects = allProjects.filter(p =>
					deptIds.includes(p.department) || (profileId && p.headOfDepartment === profileId)
				);
			} catch (e) {
				console.error('Failed to load projects:', e);
				projects = [];
			}
		} else if (profileId) {
			// Non-leaders see projects they head OR projects in their assigned department
			try {
				const allProjects = await adminPb.collection('projects').getFullList({ perPage: 500 }).catch(() =>
					adminPb.collection('projects').getFullList({ perPage: 100 })
				);
				
				// Filter by either:
				// 1. User is the project head
				// 2. User's assigned department matches project department
				projects = allProjects.filter(p => 
					p.headOfDepartment === profileId || 
					(departmentId && p.department === departmentId)
				).sort((a, b) => 
					new Date(b.created).getTime() - new Date(a.created).getTime()
				);
			} catch (e) {
				console.error('Failed to load projects for profile:', e);
				projects = [];
			}
		} else {
			// Default: in-progress projects
			try {
				const allProjects = await adminPb.collection('projects').getFullList({ perPage: 500 }).catch(() =>
					adminPb.collection('projects').getFullList({ perPage: 100 })
				);
				projects = allProjects.filter(p => p.status === 'in_progress').sort((a, b) => 
					new Date(b.created).getTime() - new Date(a.created).getTime()
				);
			} catch (e) {
				console.error('Failed to load default projects:', e);
				projects = [];
			}
		}

		// Fetch all departments for expand replacement on client
		try {
			allDepartments = await adminPb.collection('departments').getFullList({ perPage: 100 }).catch(() => []);
		} catch (e) {
			console.error('Failed to fetch departments:', e);
		}

		// Fetch all tasks
		try {
			allTasks = await adminPb.collection('tasks').getFullList({ perPage: 500 }).catch(() =>
				adminPb.collection('tasks').getFullList({ perPage: 100 })
			);
		} catch (e) {
			console.error('Failed to fetch tasks:', e);
		}

		// Add expand data to projects by joining with departments
		const deptMap = new Map(allDepartments.map(d => [d.id, d]));
		const tasksByProject = new Map<string, any[]>();
		for (const task of allTasks) {
			const projId = task.projectId;
			if (projId) {
				if (!tasksByProject.has(projId)) {
					tasksByProject.set(projId, []);
				}
				tasksByProject.get(projId)!.push(task);
			}
		}

		projects = projects.map(p => ({
			...p,
			expand: {
				department: deptMap.get(p.department) || null
			},
			tasks: tasksByProject.get(p.id) || []
		}));

		return { projects, departments, role };
	} catch (error) {
		console.error('Failed to load projects:', error);
		return { projects: [], departments: [], role };
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
