import { json } from '@sveltejs/kit';
import { RequestContext } from '$lib/infra/RequestContext';
import { recalculateBudgetHierarchy } from '$lib/utils/budget-calculator';
import type { RequestHandler } from './$types';

type ImportRow = Record<string, string>;

type ImportOptions = {
	dryRun?: boolean;
	matchBy?: 'externalRowId_or_title';
	syncMode?: 'merge' | 'replace_missing';
};

const STATUS_VALUES = new Set(['todo', 'in_progress', 'blocked', 'completed', 'cancelled']);
const PRIORITY_VALUES = new Set(['low', 'medium', 'high', 'urgent']);

function normalizeKey(value: string): string {
	return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseNumber(value: string | undefined): number | null {
	if (value === undefined) return null;
	const raw = String(value).trim();
	if (!raw) return null;
	const cleaned = raw.replace(/[$,]/g, '');
	const n = Number(cleaned);
	return Number.isFinite(n) ? n : null;
}

function isIsoDate(value: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function parseCsvKey(notes: unknown): string | null {
	const text = String(notes ?? '');
	const match = text.match(/\[CSV_KEY:([^\]]+)\]/);
	return match ? normalizeKey(match[1]) : null;
}

function withCsvKey(notes: unknown, key: string): string {
	const base = String(notes ?? '').trim();
	const marker = `[CSV_KEY:${key}]`;
	if (base.includes(marker)) return base;
	return base ? `${base}\n${marker}` : marker;
}

export const POST: RequestHandler = async ({ locals, url, request }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (!['admin', 'leader', 'marketing_lead', 'sales', 'franchise_owner', 'pro', 'broadcaster', 'league_owner'].includes(ctx.role)) {
		return json({ message: 'Admin, leader, marketing lead, sales, franchise owner, pro, broadcaster, or league owner access required' }, { status: 403 });
	}

	const body = await request.json() as {
		projectId?: string;
		rows?: ImportRow[];
		options?: ImportOptions;
	};

	const projectId = String(body.projectId ?? '').trim();
	const rows = Array.isArray(body.rows) ? body.rows : [];
	const options = body.options ?? {};
	const dryRun = Boolean(options.dryRun);

	if (!projectId) {
		return json({ message: 'projectId is required' }, { status: 400 });
	}
	if (!rows.length) {
		return json({ message: 'rows are required' }, { status: 400 });
	}

	const project = await ctx.pb.collection('projects').getOne(projectId, { fields: 'id,name' }).catch(() => null);
	if (!project) {
		return json({ message: 'Target project not found' }, { status: 404 });
	}

	const existingTasks = await ctx.pb.collection('tasks').getFullList({
		filter: `projectId = "${projectId}"`,
		fields: 'id,title,notes,status,priority,startDate,dueDate,task_budget,task_actual_cost,estimatedHours,actualHours,tags,description,subTasksChecklist'
	}).catch(() => []);

	const byTitle = new Map<string, any>();
	const byCsvKey = new Map<string, any>();
	for (const t of existingTasks as any[]) {
		if (t.title) byTitle.set(normalizeKey(String(t.title)), t);
		const k = parseCsvKey(t.notes);
		if (k) byCsvKey.set(k, t);
	}

	let created = 0;
	let updated = 0;
	let skipped = 0;
	let failed = 0;
	const errors: string[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const rowNo = i + 2;
		try {
			const externalRowId = String(row.externalRowId ?? '').trim();
			const title = String(row.title ?? '').trim();
			const mergeKey = externalRowId ? normalizeKey(externalRowId) : normalizeKey(title);

			if (!mergeKey) {
				failed++;
				errors.push(`Row ${rowNo}: externalRowId or title is required`);
				continue;
			}

			const status = String(row.status ?? '').trim();
			if (status && !STATUS_VALUES.has(status)) {
				failed++;
				errors.push(`Row ${rowNo}: status must be one of ${Array.from(STATUS_VALUES).join(', ')}`);
				continue;
			}

			const priority = String(row.priority ?? '').trim();
			if (priority && !PRIORITY_VALUES.has(priority)) {
				failed++;
				errors.push(`Row ${rowNo}: priority must be one of ${Array.from(PRIORITY_VALUES).join(', ')}`);
				continue;
			}

			const startDate = String(row.startDate ?? '').trim();
			if (startDate && !isIsoDate(startDate)) {
				failed++;
				errors.push(`Row ${rowNo}: startDate must be YYYY-MM-DD`);
				continue;
			}

			const dueDate = String(row.dueDate ?? '').trim();
			if (dueDate && !isIsoDate(dueDate)) {
				failed++;
				errors.push(`Row ${rowNo}: dueDate must be YYYY-MM-DD`);
				continue;
			}

			const taskBudget = parseNumber(row.task_budget);
			if (row.task_budget !== undefined && row.task_budget.trim() && taskBudget === null) {
				failed++;
				errors.push(`Row ${rowNo}: task_budget must be numeric`);
				continue;
			}

			const taskActual = parseNumber(row.task_actual_cost);
			if (row.task_actual_cost !== undefined && row.task_actual_cost.trim() && taskActual === null) {
				failed++;
				errors.push(`Row ${rowNo}: task_actual_cost must be numeric`);
				continue;
			}

			const estimatedHours = parseNumber(row.estimatedHours);
			if (row.estimatedHours !== undefined && row.estimatedHours.trim() && estimatedHours === null) {
				failed++;
				errors.push(`Row ${rowNo}: estimatedHours must be numeric`);
				continue;
			}

			const actualHours = parseNumber(row.actualHours);
			if (row.actualHours !== undefined && row.actualHours.trim() && actualHours === null) {
				failed++;
				errors.push(`Row ${rowNo}: actualHours must be numeric`);
				continue;
			}

			let existing = byCsvKey.get(mergeKey);
			if (!existing && title) existing = byTitle.get(normalizeKey(title));

			const payload: Record<string, unknown> = {};
			if (title) payload.title = title;
			if (row.description?.trim()) payload.description = row.description.trim();
			if (status) payload.status = status;
			if (priority) payload.priority = priority;
			if (startDate) payload.startDate = startDate;
			if (dueDate) payload.dueDate = dueDate;
			if (taskBudget !== null) payload.task_budget = taskBudget;
			if (taskActual !== null) payload.task_actual_cost = taskActual;
			if (estimatedHours !== null) payload.estimatedHours = estimatedHours;
			if (actualHours !== null) payload.actualHours = actualHours;
			if (row.tags?.trim()) payload.tags = row.tags.trim();
			if (row.subTasksChecklist?.trim()) payload.subTasksChecklist = row.subTasksChecklist;
			payload.notes = withCsvKey(row.notes ?? existing?.notes ?? '', mergeKey);

			if (existing) {
				if (Object.keys(payload).length === 0) {
					skipped++;
					continue;
				}
				if (!dryRun) {
					const updatedTask = await ctx.pb.collection('tasks').update(existing.id, payload);
					byTitle.set(normalizeKey(String(updatedTask.title ?? title)), updatedTask);
					byCsvKey.set(mergeKey, updatedTask);
				}
				updated++;
			} else {
				if (!title) {
					failed++;
					errors.push(`Row ${rowNo}: title is required for new tasks`);
					continue;
				}
				const createPayload = { ...payload, title, projectId };
				if (!dryRun) {
					const createdTask = await ctx.pb.collection('tasks').create(createPayload);
					byTitle.set(normalizeKey(String(createdTask.title ?? title)), createdTask);
					byCsvKey.set(mergeKey, createdTask);
				}
				created++;
			}
		} catch (err: any) {
			failed++;
			errors.push(`Row ${rowNo}: ${err?.message ?? 'Import failed'}`);
		}
	}

	if (!dryRun && (created > 0 || updated > 0)) {
		try {
			await recalculateBudgetHierarchy(ctx.pb, projectId);
		} catch (e: any) {
			errors.push(`Budget recalculation warning: ${e?.message ?? 'Failed to recalculate project budget hierarchy'}`);
		}
	}

	return json({
		projectId,
		projectName: project.name,
		dryRun,
		created,
		updated,
		skipped,
		failed,
		errors,
		preview: {
			wouldCreate: created,
			wouldUpdate: updated,
			wouldSkip: skipped
		}
	});
};
