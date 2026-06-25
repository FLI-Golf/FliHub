/**
 * POST /api/projects/[id]/report
 * Generates a PDF status report for a single active project using PDFKit.
 */
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

const C = {
	navy:    '#1e293b', slate:   '#475569', slateL:  '#64748b',
	muted:   '#94a3b8', border:  '#cbd5e1', bgLight: '#ffffff',
	bgPage:  '#f1f5f9',
	white:   '#ffffff', green:   '#059669', blue:    '#2563eb',
	amber:   '#d97706', violet:  '#7c3aed', red:     '#dc2626', gray:    '#64748b',
};

const STATUS_TINT: Record<string, string> = {
	todo:        '#f8fafc',
	in_progress: '#eff6ff',
	blocked:     '#fef2f2',
	completed:   '#f0fdf4',
	cancelled:   '#f8fafc',
};

function fmt(n: number) {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
}
function fmtDate(d: string | null | undefined) {
	if (!d) return '\u2014';
	const dateOnly = toDateInput(d);
	if (!dateOnly) return '\u2014';
	const [year, month, day] = dateOnly.split('-').map(Number);
	if (!year || !month || !day) return '\u2014';
	try { return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
	catch { return '\u2014'; }
}
function pct(a: number, b: number) { return b === 0 ? 0 : Math.min(100, (a / b) * 100); }
function subtaskCounts(cl: string | null | undefined) {
	if (!cl) return { done: 0, total: 0 };
	const lines = cl.split('\n').filter((l: string) => l.trim().startsWith('- ['));
	return { done: lines.filter((l: string) => l.includes('[x]') || l.includes('[X]')).length, total: lines.length };
}

function parseSubtasks(cl: string | null | undefined): { text: string; done: boolean }[] {
	if (!cl) return [];
	// Handle both newline-separated and semicolon-separated formats
	const sep = cl.includes('\n') ? '\n' : ';';
	return cl.split(sep)
		.map((l: string) => l.trim())
		.filter((l: string) => l.startsWith('- ['))
		.map((l: string) => ({
			done: l.includes('[x]') || l.includes('[X]'),
			text: l.replace(/^-\s*\[[xX ]\]\s*/, '').trim(),
		}));
}

const STATUS_LABEL: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', blocked: 'Blocked', completed: 'Completed', cancelled: 'Cancelled' };
const STATUS_COLOR: Record<string, string> = { todo: C.gray, in_progress: C.blue, blocked: C.red, completed: C.green, cancelled: C.muted };
const PRI_COLOR:    Record<string, string> = { low: C.gray, medium: C.amber, high: C.red, urgent: '#dc2626' };
const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function toDateInput(value: string | null | undefined): string {
	if (!value) return '';
	return value.includes('T') ? value.split('T')[0] : value.split(' ')[0];
}

function dateSortValue(value: string | null | undefined): number {
	const dateOnly = toDateInput(value);
	if (!dateOnly) return Number.POSITIVE_INFINITY;
	const [year, month, day] = dateOnly.split('-').map(Number);
	if (!year || !month || !day) return Number.POSITIVE_INFINITY;
	return new Date(year, month - 1, day).getTime();
}

function taskPhaseTag(task: any): string {
	const d = dateSortValue(task.startDate);
	if (!Number.isFinite(d)) return '';
	const phase1Start = new Date(2026, 3, 1).getTime();
	const phase1End = new Date(2026, 8, 30).getTime();
	const phase2Start = new Date(2026, 9, 1).getTime();
	const phase2End = new Date(2027, 3, 24).getTime();
	if (d >= phase1Start && d <= phase1End) return 'Phase 1 · Pre-Tournaments';
	if (d >= phase2Start && d <= phase2End) return 'Phase 2 · Tournaments Live';
	return '';
}

function reportTaskTitle(task: any): string {
	const tag = taskPhaseTag(task);
	return `${tag ? `[${tag}] ` : ''}${task.title || 'Untitled'}`;
}

function sortTasksForReport(tasks: any[]): any[] {
	return [...tasks].sort((a, b) => {
		const priorityDiff = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
		if (priorityDiff !== 0) return priorityDiff;
		const startDiff = dateSortValue(a.startDate) - dateSortValue(b.startDate);
		if (startDiff !== 0) return startDiff;
		const dueDiff = dateSortValue(a.dueDate) - dateSortValue(b.dueDate);
		if (dueDiff !== 0) return dueDiff;
		return String(a.title ?? '').localeCompare(String(b.title ?? ''));
	});
}

async function buildPDF(project: any): Promise<Buffer> {
	const PDFDocument = (await import('pdfkit')).default;
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ size: 'LETTER', margin: 0, bufferPages: true,
			info: { Title: `${project.name} \u2014 Project Report`, Author: 'FLI Golf League' } });
		const chunks: Buffer[] = [];
		doc.on('data', (c: Buffer) => chunks.push(c));
		doc.on('end',  () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);

		const PW = 612, PH = 792, ML = 48, MR = 48, CW = PW - ML - MR;
		const FOOTER_H = 36, MAX_Y = PH - FOOTER_H - 20;
		const genDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

		function sectionLabel(label: string, y: number): number {
			doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(7)
			   .text(label, ML, y, { characterSpacing: 1.2, lineBreak: false });
			doc.moveTo(ML, y + 11).lineTo(PW - MR, y + 11).strokeColor(C.border).lineWidth(0.5).stroke();
			return y + 18;
		}

		function newPage(): number {
			doc.addPage();
			doc.rect(0, 0, PW, 6).fill(C.bgPage);
			doc.rect(0, 5, PW, 3).fill(C.green);
			return 24;
		}

		function ensure(y: number, h: number): number {
			return y + h > MAX_Y ? newPage() : y;
		}

		function drawFooter(n: number) {
			const fy = PH - FOOTER_H;
			doc.rect(0, fy, PW, FOOTER_H).fill(C.bgPage);
			doc.moveTo(0, fy).lineTo(PW, fy).strokeColor(C.border).lineWidth(0.5).stroke();
			doc.fillColor(C.slate).font('Helvetica').fontSize(7)
			   .text(`Confidential \u2014 FLI Golf League  \u00b7  Generated ${genDate}  \u00b7  Page ${n}`,
			         ML, fy + 13, { width: CW, align: 'center', lineBreak: false });
		}

		// ── Header ───────────────────────────────────────────────────────
		doc.rect(0, 0, PW, 96).fill(C.bgPage);
		doc.rect(0, 92, PW, 4).fill(C.green);
		doc.fillColor(C.green).font('Helvetica-Bold').fontSize(7)
		   .text('FLI GOLF LEAGUE  \u00b7  PROJECT STATUS REPORT', ML, 20, { characterSpacing: 1.5, lineBreak: false });
		doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(20)
		   .text(project.name, ML, 34, { width: CW - 110, lineBreak: false });
		if (project.type) {
			doc.roundedRect(PW - MR - 95, 34, 95, 18, 4).fillAndStroke(C.white, C.border);
			doc.fillColor(C.slate).font('Helvetica-Bold').fontSize(7)
			   .text(project.type.toUpperCase(), PW - MR - 95, 40, { width: 95, align: 'center', characterSpacing: 1, lineBreak: false });
		}
		doc.fillColor(C.slate).font('Helvetica').fontSize(8)
		   .text(`Generated ${genDate}  \u00b7  FY ${project.fiscalYear ?? new Date().getFullYear()}`, ML, 72, { lineBreak: false });

		let y = 112;
		const projectBudget = project.budget ?? 0;
		const deptBudget = project.department?.budget ?? 0;
		const taskAllocation = project.taskBudgetSum ?? 0;
		const unallocated = project.pipeline?.unallocated ?? Math.max(0, projectBudget - taskAllocation);

		// ── Stat boxes ────────────────────────────────────────────────────
		const boxW = (CW - 9) / 4;
		[
			{ label: 'DEPT BUDGET',     value: deptBudget > 0 ? fmt(deptBudget) : fmt(projectBudget), sub: project.department?.name ?? null },
			{ label: 'PROJECT BUDGET',  value: fmt(projectBudget),                    sub: deptBudget > 0 ? `${pct(projectBudget, deptBudget).toFixed(0)}% of dept` : null },
			{ label: 'TASK ALLOCATION', value: fmt(taskAllocation),                   sub: `${pct(taskAllocation, projectBudget).toFixed(0)}% allocated` },
			{ label: 'UNALLOCATED',     value: fmt(unallocated),                      sub: 'remaining' },
		].forEach((b, i) => {
			const bx = ML + i * (boxW + 3);
			doc.roundedRect(bx, y, boxW, 54, 5).fillAndStroke(C.bgLight, C.border);
			doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(7.5)
			   .text(b.label, bx + 8, y + 9, { width: boxW - 16, characterSpacing: 0.5, lineBreak: false });
			doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(15)
			   .text(b.value, bx + 8, y + 21, { width: boxW - 16, lineBreak: false });
			if (b.sub) doc.fillColor(C.muted).font('Helvetica').fontSize(8)
			              .text(b.sub, bx + 8, y + 40, { width: boxW - 16, lineBreak: false });
		});
		y += 66;

		// ── Project details ───────────────────────────────────────────────
		y = sectionLabel('PROJECT DETAILS', y);
		const dcW = CW / 2 - 6;
		const details: [string, string][] = [
			['Department', project.department?.name ?? '\u2014'],
			['Start Date',  fmtDate(project.startDate)],
			['End Date',    fmtDate(project.endDate)],
			['Forecasted',  (project.forecasted ?? 0) > 0 ? fmt(project.forecasted) : '\u2014'],
			['Fiscal Year', String(project.fiscalYear ?? '\u2014')],
			['Type',        project.type ?? '\u2014'],
		];
		details.forEach(([label, val], i) => {
			const col = i % 2, row = Math.floor(i / 2);
			const dx = ML + col * (dcW + 12), dy = y + row * 22;
			doc.fillColor(C.muted).font('Helvetica').fontSize(9).text(label, dx, dy, { width: 80, lineBreak: false });
			doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(9).text(val, dx + 85, dy, { width: dcW - 85, lineBreak: false });
		});
		y += Math.ceil(details.length / 2) * 22 + 8;

		if (project.description) {
			y = ensure(y, 30);
			doc.fillColor(C.slateL).font('Helvetica').fontSize(8)
			   .text(project.description, ML, y, { width: CW });
			y = (doc as any).y + 12;
		}

		// ── Tasks ─────────────────────────────────────────────────────────
		const tasks: any[] = sortTasksForReport(project.tasks?.items ?? []);
		if (tasks.length > 0) {
			y = ensure(y, 50);
			y = sectionLabel('TASKS', y);

			const td = project.tasks?.done ?? 0, tt = project.tasks?.total ?? 0;
			const tp = pct(td, tt);
			doc.fillColor(C.muted).font('Helvetica').fontSize(8)
			   .text(`${td} of ${tt} complete  \u00b7  ${tp.toFixed(0)}% done`, ML, y, { lineBreak: false });
			y += 13;
			doc.roundedRect(ML, y, CW, 7, 3).fill('#e2e8f0');
			if (tp > 0) doc.roundedRect(ML, y, (tp / 100) * CW, 7, 3).fill(C.green);
			y += 16;

			for (const task of tasks) {
				const sub = subtaskCounts(task.subTasksChecklist);
				const sc  = STATUS_COLOR[task.status] ?? C.gray;
				const sl  = STATUS_LABEL[task.status] ?? task.status;
				const subtaskItems = parseSubtasks(task.subTasksChecklist);

				// Dynamic row height: base + subtask list if present
				const baseH = 64;
				const subtaskBlockH = subtaskItems.length > 0 ? 18 + subtaskItems.length * 16 : 0;
				const rowH = baseH + subtaskBlockH;

				y = ensure(y, rowH + 8);

				doc.roundedRect(ML, y, CW, rowH, 5).fillAndStroke(C.bgLight, C.border);
				doc.roundedRect(ML, y, 4, rowH, 3).fill(sc);

				// Title
				doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(11)
				   .text(reportTaskTitle(task), ML + 14, y + 11, { width: CW - 130, lineBreak: false });

				// Status badge — light tint background with colored text
				const bW = 90, bX = ML + CW - bW;
				const tint = STATUS_TINT[task.status] ?? '#f8fafc';
				doc.roundedRect(bX, y + 9, bW, 18, 4).fillAndStroke(tint, sc);
				doc.fillColor(sc).font('Helvetica-Bold').fontSize(8)
				   .text(sl, bX, y + 14, { width: bW, align: 'center', lineBreak: false });

				// Meta
				const meta: string[] = [];
				if (task.priority) meta.push(task.priority.toUpperCase());
				if (task.dueDate)  meta.push(`Due ${fmtDate(task.dueDate)}`);
				if ((task.task_budget ?? 0) > 0) meta.push(`Projected ${fmt(task.task_budget)}`);
				if (sub.total > 0) meta.push(`${sub.done}/${sub.total} subtasks`);
				if ((task.estimatedHours ?? 0) > 0) meta.push(`${task.estimatedHours}h est.`);
				if ((task.actualHours ?? 0) > 0) meta.push(`${task.actualHours}h actual`);
				doc.fillColor(C.muted).font('Helvetica').fontSize(9)
				   .text(meta.join('  \u00b7  '), ML + 14, y + 34, { width: CW - 24, lineBreak: false });

				// Subtask checklist
				if (subtaskItems.length > 0) {
					let sy = y + baseH - 6;
					doc.moveTo(ML + 14, sy).lineTo(ML + CW - 14, sy)
					   .strokeColor('#e2e8f0').lineWidth(0.5).stroke();
					sy += 6;
					doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(7.5)
					   .text('SUBTASKS', ML + 14, sy, { characterSpacing: 0.8, lineBreak: false });
					sy += 13;
					for (const item of subtaskItems) {
						const boxX = ML + 14;
						// Checkbox border
						doc.roundedRect(boxX, sy + 1, 9, 9, 1.5)
						   .strokeColor(item.done ? C.green : C.muted).lineWidth(0.8).stroke();
						if (item.done) {
							doc.fillColor(C.green).font('Helvetica-Bold').fontSize(7)
							   .text('\u2713', boxX, sy + 1.5, { width: 9, align: 'center', lineBreak: false });
						}
						doc.fillColor(item.done ? C.green : C.navy).font('Helvetica').fontSize(9)
						   .text(item.text, boxX + 14, sy, { width: CW - 40, lineBreak: false });
						sy += 16;
					}
				}

				y += rowH + 8;
			}
		}

		// ── Task notes ────────────────────────────────────────────────────
		const withNotes = tasks.filter(t => t.notes?.trim());
		if (withNotes.length > 0) {
			y = ensure(y, 40);
			y = sectionLabel('TASK NOTES', y);
			for (const task of withNotes) {
				y = ensure(y, 30);
				doc.fillColor(C.slateL).font('Helvetica-Bold').fontSize(9)
				   .text(reportTaskTitle(task), ML, y, { lineBreak: false });
				y += 14;
				doc.fillColor(C.muted).font('Helvetica').fontSize(8.5)
				   .text(task.notes, ML, y, { width: CW });
				y = (doc as any).y + 12;
			}
		}

		// ── Footers ───────────────────────────────────────────────────────
		const range = (doc as any).bufferedPageRange();
		for (let i = 0; i < range.count; i++) {
			doc.switchToPage(range.start + i);
			drawFooter(i + 1);
		}

		doc.end();
	});
}

export const POST: RequestHandler = async ({ locals, url, request, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	const { pb } = ctx;

	let body: any;
	try { body = await request.json(); } catch { throw error(400, 'Invalid JSON body'); }

	const projectShell = body?.project;
	console.log('[report endpoint] received project id:', projectShell?.id, 'name:', projectShell?.name);
	if (!projectShell?.id) throw error(400, 'Missing project data');

	try {
		// Fetch fresh full records from PocketBase
		const [projectRec, taskRecs, expenseRecs] = await Promise.all([
			pb.collection('projects').getOne(projectShell.id).catch(() => null),
			pb.collection('tasks').getFullList({ filter: `projectId = "${projectShell.id}"`, sort: 'status,created' }).catch(() => []),
			pb.collection('expenses').getFullList({ filter: `projectId = "${projectShell.id}"` }).catch(() => []),
		]);

		// Compute pipeline from fresh expense data
		const paid      = (expenseRecs as any[]).filter(e => e.status === 'paid')     .reduce((s, e) => s + (e.amount ?? 0), 0);
		const approved  = (expenseRecs as any[]).filter(e => e.status === 'approved') .reduce((s, e) => s + (e.amount ?? 0), 0);
		const submitted = (expenseRecs as any[]).filter(e => e.status === 'submitted').reduce((s, e) => s + (e.amount ?? 0), 0);
		const taskBudgetSum = (taskRecs as any[]).reduce((s, t) => s + (t.task_budget ?? 0), 0);
		const totalExpensed = paid + approved + submitted;
		const inTasks   = Math.max(0, taskBudgetSum - totalExpensed);
		const budget    = (projectRec as any)?.project_budget ?? projectShell.budget ?? 0;
		const unallocated = Math.max(0, budget - taskBudgetSum);
		const actualSpend = paid + approved;
		const p = (v: number) => budget > 0 ? Math.min(100, (v / budget) * 100) : 0;

		const tasksDone = (taskRecs as any[]).filter(t => t.status === 'completed' || t.status === 'done').length;
		console.log('[report] tasks fetched:', (taskRecs as any[]).length);
		if ((taskRecs as any[]).length > 0) {
			const sample = (taskRecs as any[])[0];
			console.log('[report] sample task keys:', Object.keys(sample));
			console.log('[report] sample task:', JSON.stringify({ title: sample.title, status: sample.status, priority: sample.priority, task_budget: sample.task_budget, dueDate: sample.dueDate, estimatedHours: sample.estimatedHours, notes: sample.notes?.slice?.(0,50), subTasksChecklist: sample.subTasksChecklist?.slice?.(0,80) }));
		}

		// Merge shell data (department, dates, etc.) with fresh records
		const project = {
			...projectShell,
			// Override with fresh PocketBase values where available
			name:         (projectRec as any)?.name         ?? projectShell.name,
			description:  (projectRec as any)?.description  ?? projectShell.description,
			type:         (projectRec as any)?.type          ?? projectShell.type,
			startDate:    (projectRec as any)?.startDate     ?? projectShell.startDate,
			endDate:      (projectRec as any)?.endDate       ?? projectShell.endDate,
			fiscalYear:   (projectRec as any)?.fiscalYear    ?? projectShell.fiscalYear,
			forecasted:   (projectRec as any)?.project_forecasted_expenses ?? projectShell.forecasted ?? 0,
			budget,
			taskBudgetSum,
			actualSpend,
			spendPct:     p(actualSpend),
			allocatedPct: p(taskBudgetSum),
			pipeline:     { paid, approved, submitted, inTasks, unallocated },
			pipelinePct:  { paid: p(paid), approved: p(approved), submitted: p(submitted), inTasks: p(inTasks) },
			tasks: {
				total: (taskRecs as any[]).length,
				done:  tasksDone,
				open:  (taskRecs as any[]).length - tasksDone,
				items: taskRecs,   // full records — title, notes, subTasksChecklist, all fields
			},
		};

		const buf = await buildPDF(project);
		const slug = (project.name as string).replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
		const date = new Date().toISOString().slice(0, 10);
		return new Response(new Uint8Array(buf), {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `inline; filename="${slug}-report-${date}.pdf"`,
				'Content-Length': String(buf.length),
			},
		});
	} catch (err: any) {
		console.error('Report generation error:', err);
		throw error(500, err?.message ?? 'PDF generation failed');
	}
};
