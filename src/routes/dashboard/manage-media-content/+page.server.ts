import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';
import type { PageServerLoad } from './$types';

const VIEW_ROLES = ['admin', 'leader', 'marketing', 'marketing_lead'] as const;

function pbErrorDetails(error: any): string {
	const responseMessage = error?.response?.message;
	const responseData = error?.response?.data;
	if (responseMessage || responseData) {
		const dataText = responseData ? ` data=${JSON.stringify(responseData)}` : '';
		return `${responseMessage ?? 'PocketBase response error'}${dataText}`;
	}
	return error?.message ?? String(error);
}

function toNumber(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function parseDateMs(value: unknown): number {
	if (typeof value !== 'string' || value.trim() === '') return Number.POSITIVE_INFINITY;
	const ms = new Date(value).getTime();
	return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

function stageProgress(stage: string): number {
	if (stage === 'paid') return 100;
	if (stage === 'published') return 85;
	if (stage === 'approval') return 70;
	if (stage === 'edit') return 50;
	if (stage === 'shoot') return 30;
	if (stage === 'brief') return 10;
	return 0;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const ctx = await RequestContext.from(locals, url);
	ctx.requireRole(...VIEW_ROLES);
	const canManageActions = ['admin', 'leader'].includes(ctx.role);

	try {
		const [items, tasks, departments, projects] = await Promise.all([
			ctx.pb.collection('content_production').getFullList({
				sort: '-created',
				expand: 'assignedTo,talent,department,project'
			}).catch(async (error: any) => {
				console.error('manage-media-content: expanded content query failed, retrying without expand', pbErrorDetails(error));
				return ctx.pb.collection('content_production').getFullList({
					sort: '-created'
				}).catch(async (fallbackError: any) => {
					console.error('manage-media-content: content fallback query failed, trying raw fetch', pbErrorDetails(fallbackError));
					return adminFetch('content_production', { sort: '-created' }).catch((rawError: any) => {
						console.error('manage-media-content: content raw fetch failed', pbErrorDetails(rawError));
						return [];
					});
				});
			}),
			ctx.pb.collection('tasks').getFullList({
				filter: 'contentProductionId != ""',
				sort: 'status,dueDate',
				expand: 'assignedTo,contentProductionId'
			}).catch(async (error: any) => {
				console.error('manage-media-content: expanded tasks query failed, retrying without expand', pbErrorDetails(error));
				return ctx.pb.collection('tasks').getFullList({
					filter: 'contentProductionId != ""',
					sort: 'status,dueDate'
				}).catch(async (fallbackError: any) => {
					console.error('manage-media-content: tasks fallback query failed, trying raw fetch', pbErrorDetails(fallbackError));
					return adminFetch('tasks', { filter: 'contentProductionId != ""', sort: 'status' }).catch((rawError: any) => {
						console.error('manage-media-content: tasks raw fetch failed', pbErrorDetails(rawError));
						return [];
					});
				});
			}),
			ctx.pb.collection('departments').getFullList({
				fields: 'id,name'
			}).catch(() => []),
			ctx.pb.collection('projects').getFullList({
				fields: 'id,name'
			}).catch(() => [])
		]);

		const departmentNames = new Map<string, string>((departments as any[]).map((department: any) => [String(department.id), String(department.name ?? '')]));
		const projectNames = new Map<string, string>((projects as any[]).map((project: any) => [String(project.id), String(project.name ?? '')]));

		const tasksByContent = new Map<string, any[]>();
		for (const task of tasks as any[]) {
			const contentId = String(task.contentProductionId || task.expand?.contentProductionId?.id || '');
			if (!contentId) continue;
			if (!tasksByContent.has(contentId)) tasksByContent.set(contentId, []);
			tasksByContent.get(contentId)!.push(task);
		}

		const cards = (items as any[]).map((item: any) => {
			const linkedTasks = tasksByContent.get(item.id) ?? [];
			const taskDone = linkedTasks.filter((task) => task.status === 'completed').length;
			const taskOpen = linkedTasks.filter((task) => !['completed', 'cancelled'].includes(task.status)).length;
			const taskProgress = linkedTasks.length > 0 ? Math.round((taskDone / linkedTasks.length) * 100) : stageProgress(item.stage ?? 'brief');
			const estimatedTaskCost = linkedTasks.reduce((sum, task) => sum + toNumber(task.estimatedCost), 0);
			const actualTaskCost = linkedTasks.reduce((sum, task) => sum + toNumber(task.actualCost), 0);
			const nextDueTask = linkedTasks
				.filter((task) => task.dueDate && !['completed', 'cancelled'].includes(task.status))
				.sort((a, b) => parseDateMs(a.dueDate) - parseDateMs(b.dueDate))[0] ?? null;

			return {
				id: item.id,
				title: item.title ?? 'Untitled Content',
				contentType: item.contentType ?? 'other',
				stage: item.stage ?? 'brief',
				dueDate: item.dueDate ?? null,
				requiresApproval: !!item.requiresApproval,
				approvalStatus: item.approvalStatus ?? null,
				departmentName: item.expand?.department?.name ?? departmentNames.get(String(item.department ?? '')) ?? 'Unassigned',
				projectName: item.expand?.project?.name ?? projectNames.get(String(item.project ?? '')) ?? null,
				publishedUrl: item.publishedUrl ?? null,
				notes: item.notes ?? '',
				spend: {
					budget: toNumber(item.budget),
					actual: toNumber(item.actualCost),
					estimatedTaskCost,
					actualTaskCost
				},
				counts: {
					tasks: linkedTasks.length,
					taskOpen,
					taskDone
				},
				nextDueTask,
				progressPct: Math.max(0, Math.min(100, taskProgress))
			};
		});

		const totals = {
			totalItems: cards.length,
			brief: cards.filter((card) => card.stage === 'brief').length,
			shoot: cards.filter((card) => card.stage === 'shoot').length,
			edit: cards.filter((card) => card.stage === 'edit').length,
			approval: cards.filter((card) => card.stage === 'approval').length,
			published: cards.filter((card) => card.stage === 'published').length,
			paid: cards.filter((card) => card.stage === 'paid').length,
			totalBudget: cards.reduce((sum, card) => sum + card.spend.budget, 0),
			totalActual: cards.reduce((sum, card) => sum + card.spend.actual, 0),
			pendingApprovals: cards.filter((card) => card.requiresApproval && card.approvalStatus === 'pending').length
		};

		return {
			cards,
			totals,
			canManageActions
		};
	} catch (err: any) {
		console.error('manage-media-content load error:', err?.message ?? err);
		return {
			cards: [],
			totals: {
				totalItems: 0,
				brief: 0,
				shoot: 0,
				edit: 0,
				approval: 0,
				published: 0,
				paid: 0,
				totalBudget: 0,
				totalActual: 0,
				pendingApprovals: 0
			},
			canManageActions
		};
	}
};
