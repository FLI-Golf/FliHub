import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { vendor } = await parent();

	const [projects, myBids] = await Promise.all([
		adminFetch('projects', {
			filter: 'biddingOpen=true',
			sort:   '-created',
			fields: 'id,name,type,description,startDate,endDate,status,biddingOpen',
		}),

		vendor
			? adminFetch('bids', {
				filter: `vendorId="${vendor.id}"`,
				fields: 'id,projectId,taskId,status,amount,created',
			})
			: Promise.resolve([]),
	]);

	const projectIds = (projects as any[]).map((p: any) => p.id);
	let tasksByProject: Record<string, any[]> = {};

	if (projectIds.length > 0) {
		const projectFilter = projectIds.map((id: string) => `projectId="${id}"`).join(' || ');
		const tasks = await adminFetch('tasks', {
			filter: `(${projectFilter}) && status!="completed" && status!="cancelled"`,
			fields: 'id,title,description,projectId,status,startDate,dueDate,tags',
			sort: 'created',
		});

		tasksByProject = (tasks as any[]).reduce((acc: Record<string, any[]>, task: any) => {
			const key = task.projectId;
			if (!acc[key]) acc[key] = [];
			acc[key].push(task);
			return acc;
		}, {});
	}

	// Maps for vendor bidding UX
	const myBidsByProject: Record<string, any[]> = {};
	const myBidByProjectTask: Record<string, any> = {};
	for (const b of myBids as any[]) {
		if (!myBidsByProject[b.projectId]) myBidsByProject[b.projectId] = [];
		myBidsByProject[b.projectId].push(b);
		if (b.taskId) myBidByProjectTask[`${b.projectId}:${b.taskId}`] = b;
	}

	return { projects, myBidsByProject, myBidByProjectTask, tasksByProject };
};
