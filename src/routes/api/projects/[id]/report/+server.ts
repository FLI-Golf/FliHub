/**
 * POST /api/projects/[id]/report
 * Generates a PDF status report for a single active project using PDFKit.
 */
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

const C = {
	navy:    '#0f172a', slate:   '#1e293b', slateL:  '#334155',
	muted:   '#64748b', border:  '#cbd5e1', bgLight: '#f8fafc',
	white:   '#ffffff', green:   '#10b981', blue:    '#3b82f6',
	amber:   '#f59e0b', violet:  '#8b5cf6', red:     '#ef4444', gray: '#94a3b8',
};

function fmt(n: number) {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
}
function fmtDate(d: string | null | undefined) {
	if (!d) return '\u2014';
	try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
	catch { return '\u2014'; }
}
function pct(a: number, b: number) { return b === 0 ? 0 : Math.min(100, (a / b) * 100); }
function subtaskCounts(cl: string | null | undefined) {
	if (!cl) return { done: 0, total: 0 };
	const lines = cl.split('\n').filter((l: string) => l.trim().startsWith('- ['));
	return { done: lines.filter((l: string) => l.includes('[x]') || l.includes('[X]')).length, total: lines.length };
}

const STATUS_LABEL: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', blocked: 'Blocked', completed: 'Completed', cancelled: 'Cancelled' };
const STATUS_COLOR: Record<string, string> = { todo: C.gray, in_progress: C.blue, blocked: C.red, completed: C.green, cancelled: C.muted };
const PRI_COLOR:    Record<string, string> = { low: C.gray, medium: C.amber, high: C.red, urgent: '#dc2626' };

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
			doc.rect(0, 0, PW, 6).fill(C.navy);
			doc.rect(0, 6, PW, 2).fill(C.green);
			return 24;
		}

		function ensure(y: number, h: number): number {
			return y + h > MAX_Y ? newPage() : y;
		}

		function drawFooter(n: number) {
			const fy = PH - FOOTER_H;
			doc.rect(0, fy, PW, FOOTER_H).fill(C.navy);
			doc.fillColor(C.gray).font('Helvetica').fontSize(7)
			   .text(`Confidential \u2014 FLI Golf League  \u00b7  Generated ${genDate}  \u00b7  Page ${n}`,
			         ML, fy + 13, { width: CW, align: 'center', lineBreak: false });
		}

		// ── Header ───────────────────────────────────────────────────────
		doc.rect(0, 0, PW, 96).fill(C.navy);
		doc.rect(0, 92, PW, 4).fill(C.green);
		doc.fillColor(C.green).font('Helvetica-Bold').fontSize(7)
		   .text('FLI GOLF LEAGUE  \u00b7  PROJECT STATUS REPORT', ML, 20, { characterSpacing: 1.5, lineBreak: false });
		doc.fillColor(C.white).font('Helvetica-Bold').fontSize(20)
		   .text(project.name, ML, 34, { width: CW - 110, lineBreak: false });
		if (project.type) {
			doc.roundedRect(PW - MR - 95, 34, 95, 18, 4).fill(C.slateL);
			doc.fillColor(C.gray).font('Helvetica-Bold').fontSize(7)
			   .text(project.type.toUpperCase(), PW - MR - 95, 40, { width: 95, align: 'center', characterSpacing: 1, lineBreak: false });
		}
		doc.fillColor(C.gray).font('Helvetica').fontSize(8)
		   .text(`Generated ${genDate}  \u00b7  FY ${project.fiscalYear ?? new Date().getFullYear()}`, ML, 72, { lineBreak: false });

		let y = 112;

		// ── Stat boxes ────────────────────────────────────────────────────
		const boxW = (CW - 9) / 4;
		[
			{ label: 'PROJECT BUDGET', value: fmt(project.budget),                    sub: null },
			{ label: 'TASK BUDGETS',   value: fmt(project.taskBudgetSum ?? 0),         sub: `${(project.allocatedPct ?? 0).toFixed(0)}% allocated` },
			{ label: 'ACTUAL SPEND',   value: fmt(Math.max(0, project.actualSpend ?? 0)), sub: `${Math.max(0, project.spendPct ?? 0).toFixed(0)}% of budget` },
			{ label: 'UNALLOCATED',    value: fmt(project.pipeline?.unallocated ?? 0), sub: 'remaining' },
		].forEach((b, i) => {
			const bx = ML + i * (boxW + 3);
			doc.roundedRect(bx, y, boxW, 54, 5).fillAndStroke(C.bgLight, C.border);
			doc.fillColor(C.muted).font('Helvetica-Bold').fontSize(6.5)
			   .text(b.label, bx + 8, y + 9, { width: boxW - 16, characterSpacing: 0.5, lineBreak: false });
			doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(14)
			   .text(b.value, bx + 8, y + 21, { width: boxW - 16, lineBreak: false });
			if (b.sub) doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
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
			const dx = ML + col * (dcW + 12), dy = y + row * 20;
			doc.fillColor(C.muted).font('Helvetica').fontSize(8).text(label, dx, dy, { width: 80, lineBreak: false });
			doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(8).text(val, dx + 85, dy, { width: dcW - 85, lineBreak: false });
		});
		y += Math.ceil(details.length / 2) * 20 + 8;

		if (project.description) {
			y = ensure(y, 30);
			doc.fillColor(C.slateL).font('Helvetica').fontSize(8)
			   .text(project.description, ML, y, { width: CW });
			y = (doc as any).y + 12;
		}

		// ── Expense pipeline ──────────────────────────────────────────────
		y = ensure(y, 70);
		y = sectionLabel('EXPENSE PIPELINE', y);

		const pp = project.pipelinePct ?? {};
		const segs = [
			{ pct: pp.paid ?? 0,      color: C.green,  label: 'Paid',      amt: project.pipeline?.paid      ?? 0 },
			{ pct: pp.approved ?? 0,  color: C.blue,   label: 'Approved',  amt: project.pipeline?.approved  ?? 0 },
			{ pct: pp.submitted ?? 0, color: C.amber,  label: 'Submitted', amt: project.pipeline?.submitted ?? 0 },
			{ pct: pp.inTasks ?? 0,   color: C.violet, label: 'In Tasks',  amt: project.pipeline?.inTasks   ?? 0 },
		];

		// Bar
		doc.roundedRect(ML, y, CW, 14, 4).fill('#e2e8f0');
		let bx2 = ML;
		for (const s of segs) {
			if (s.pct <= 0) continue;
			const sw = Math.max(1, (s.pct / 100) * CW);
			doc.rect(bx2, y, sw, 14).fill(s.color);
			bx2 += sw;
		}
		doc.roundedRect(ML, y, CW, 14, 4).stroke(C.border);
		y += 22;

		// Legend — 2 columns
		const legColW = CW / 2;
		segs.forEach((s, i) => {
			const col = i % 2, row = Math.floor(i / 2);
			const lx = ML + col * legColW, ly = y + row * 16;
			doc.circle(lx + 5, ly + 5, 4).fill(s.color);
			doc.fillColor(s.amt > 0 ? C.navy : C.gray).font('Helvetica').fontSize(8)
			   .text(`${s.label}: ${s.amt > 0 ? fmt(s.amt) : '\u2014'}`, lx + 14, ly, { width: legColW - 14, lineBreak: false });
		});
		y += Math.ceil(segs.length / 2) * 16 + 4;

		const unalloc = project.pipeline?.unallocated ?? 0;
		if (unalloc > 0) {
			doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
			   .text(`${fmt(unalloc)} unallocated`, ML, y, { lineBreak: false });
			y += 14;
		}
		y += 8;

		// ── Tasks ─────────────────────────────────────────────────────────
		const tasks: any[] = project.tasks?.items ?? [];
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
				const rowH = 46;
				y = ensure(y, rowH + 6);
				const sub = subtaskCounts(task.subTasksChecklist);
				const sc  = STATUS_COLOR[task.status] ?? C.gray;
				const sl  = STATUS_LABEL[task.status] ?? task.status;

				doc.roundedRect(ML, y, CW, rowH, 5).fillAndStroke(C.bgLight, C.border);
				doc.roundedRect(ML, y, 4, rowH, 3).fill(sc);

				// Title
				doc.fillColor(C.navy).font('Helvetica-Bold').fontSize(9.5)
				   .text(task.title || 'Untitled', ML + 12, y + 8, { width: CW - 130, lineBreak: false });

				// Status badge
				const bW = 76, bX = ML + CW - bW;
				doc.roundedRect(bX, y + 7, bW, 15, 4).fill(sc);
				doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7)
				   .text(sl, bX, y + 11, { width: bW, align: 'center', lineBreak: false });

				// Meta
				const meta: string[] = [];
				if (task.priority) meta.push(task.priority.toUpperCase());
				if (task.dueDate)  meta.push(`Due ${fmtDate(task.dueDate)}`);
				if ((task.task_budget ?? 0) > 0) meta.push(fmt(task.task_budget));
				if (sub.total > 0) meta.push(`${sub.done}/${sub.total} subtasks`);
				if ((task.estimatedHours ?? 0) > 0) meta.push(`${task.estimatedHours}h est.`);
				if ((task.actualHours ?? 0) > 0) meta.push(`${task.actualHours}h actual`);
				doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
				   .text(meta.join('  \u00b7  '), ML + 12, y + 27, { width: CW - 24, lineBreak: false });

				y += rowH + 5;
			}
		}

		// ── Task notes ────────────────────────────────────────────────────
		const withNotes = tasks.filter(t => t.notes?.trim());
		if (withNotes.length > 0) {
			y = ensure(y, 40);
			y = sectionLabel('TASK NOTES', y);
			for (const task of withNotes) {
				y = ensure(y, 30);
				doc.fillColor(C.slateL).font('Helvetica-Bold').fontSize(8)
				   .text(task.title || 'Untitled', ML, y, { lineBreak: false });
				y += 13;
				doc.fillColor(C.muted).font('Helvetica').fontSize(7.5)
				   .text(task.notes, ML, y, { width: CW });
				y = (doc as any).y + 10;
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
	const ctx = await RequestContext.from(locals, url);
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
		return new Response(buf, {
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
