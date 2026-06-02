import { RequestContext } from '$lib/infra/RequestContext';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);

	const [items, talent, userProfiles, departments, projects, tasks] = await Promise.all([
		ctx.pb.collection('content_production').getFullList({
			sort: '-created',
			expand: 'assignedTo,talent,department,project'
		}).catch(() => []),
		ctx.pb.collection('talent').getFullList({
			sort: 'name',
			fields: 'id,name,talentType'
		}).catch(() => []),
		ctx.pb.collection('user_profiles').getFullList({
			filter: 'role = "admin" || role = "leader"',
			sort: 'firstName,lastName',
			fields: 'id,firstName,lastName,email'
		}).catch(() => []),
		ctx.pb.collection('departments').getFullList({
			sort: 'name',
			fields: 'id,name,status'
		}).catch(() => []),
		ctx.pb.collection('projects').getFullList({
			sort: 'name',
			fields: 'id,name,department,status'
		}).catch(() => []),
		ctx.pb.collection('tasks').getFullList({
			filter: 'contentProductionId != ""',
			sort: 'status,dueDate',
			expand: 'assignedTo,contentProductionId'
		}).catch(() => [])
	]);

	const stats = {
		total:      items.length,
		brief:      items.filter((i: any) => i.stage === 'brief').length,
		shoot:      items.filter((i: any) => i.stage === 'shoot').length,
		edit:       items.filter((i: any) => i.stage === 'edit').length,
		approval:   items.filter((i: any) => i.stage === 'approval').length,
		published:  items.filter((i: any) => i.stage === 'published').length,
		paid:       items.filter((i: any) => i.stage === 'paid').length,
		cancelled:  items.filter((i: any) => i.stage === 'cancelled').length,
		pendingApproval: items.filter((i: any) => i.requiresApproval && i.approvalStatus === 'pending').length
	};

	return { items, talent, userProfiles, departments, projects, tasks, stats };
};
