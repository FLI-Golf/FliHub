import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';

function fmtCurrency(n: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(n ?? 0);
}

function fmtDate(value: string | null | undefined): string {
	if (!value) return '-';
	const d = new Date(value);
	if (!Number.isFinite(d.getTime())) return '-';
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function progressPct(current: number, target: number): number {
	if (!target || target <= 0) return 0;
	return Math.min(100, Math.round((current / target) * 100));
}

async function buildPDF(goal: any, tasks: any[], expenseById: Map<string, any>): Promise<Buffer> {
	const PDFDocument = (await import('pdfkit')).default;
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ size: 'LETTER', margin: 40, bufferPages: true });
		const chunks: Buffer[] = [];
		doc.on('data', (chunk: Buffer) => chunks.push(chunk));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);

		const current = Number(goal.currentValue ?? 0);
		const target = Number(goal.targetValue ?? 0);
		const pct = progressPct(current, target);

		const taskStats = {
			total: tasks.length,
			inProgress: tasks.filter((t: any) => t.status === 'in_progress').length,
			needsApproval: tasks.filter((t: any) => t.status === 'needs_approval').length,
			completed: tasks.filter((t: any) => t.status === 'completed').length,
		};

		let submitted = 0;
		let approved = 0;
		let paid = 0;
		for (const t of tasks) {
			if (!t.expenseId) continue;
			const exp = expenseById.get(t.expenseId);
			if (!exp) continue;
			const amt = Number(exp.amount ?? 0);
			if (exp.status === 'submitted') submitted += amt;
			if (exp.status === 'approved') approved += amt;
			if (exp.status === 'paid') paid += amt;
		}

		doc.font('Helvetica-Bold').fontSize(20).fillColor('#0f172a').text('Marketing Goal Report');
		doc.moveDown(0.2);
		doc.font('Helvetica').fontSize(10).fillColor('#475569').text(`Generated ${new Date().toLocaleString('en-US')}`);

		doc.moveDown(1);
		doc.font('Helvetica-Bold').fontSize(16).fillColor('#111827').text(goal.goalName ?? goal.name ?? 'Untitled Goal');
		doc.moveDown(0.2);
		doc.font('Helvetica').fontSize(10).fillColor('#475569').text(goal.description ?? goal.descriptionOfGoal ?? 'No description');

		doc.moveDown(0.8);
		doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Goal Snapshot');
		doc.moveDown(0.3);
		doc.font('Helvetica').fontSize(10).fillColor('#1f2937');
		doc.text(`Status: ${goal.status ?? 'Not Started'}`);
		doc.text(`Priority: ${goal.priority ?? 'Medium'}`);
		doc.text(`Category: ${goal.category ?? 'General'}`);
		doc.text(`Deadline: ${fmtDate(goal.deadline ?? goal.dueDate ?? null)}`);
		doc.text(`Target Metric: ${goal.targetMetric ?? '-'}`);
		doc.text(`Progress: ${current} / ${target || '-'} (${pct}%)`);

		doc.moveDown(0.8);
		doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Execution Summary');
		doc.moveDown(0.3);
		doc.font('Helvetica').fontSize(10).fillColor('#1f2937');
		doc.text(`Tasks: ${taskStats.total} total | ${taskStats.inProgress} in progress | ${taskStats.needsApproval} need approval | ${taskStats.completed} completed`);
		doc.text(`Spend Pipeline: Submitted ${fmtCurrency(submitted)} | Approved ${fmtCurrency(approved)} | Paid ${fmtCurrency(paid)}`);

		doc.moveDown(0.8);
		doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Top Tasks');
		doc.moveDown(0.3);

		const topTasks = tasks.slice(0, 12);
		if (topTasks.length === 0) {
			doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('No tasks for this goal yet.');
		} else {
			for (const task of topTasks) {
				doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(task.title || 'Untitled task', { continued: false });
				doc.font('Helvetica').fontSize(9).fillColor('#475569').text(
					`Status: ${task.status || '-'} | Due: ${fmtDate(task.dueDate)} | Est: ${fmtCurrency(Number(task.estimatedCost ?? 0))} | Actual: ${fmtCurrency(Number(task.actualCost ?? 0))}`
				);
				if (task.description) {
					doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(task.description);
				}
				doc.moveDown(0.25);
			}
		}

		doc.end();
	});
}

export const POST: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (!['admin', 'leader', 'marketing', 'marketing_lead'].includes(ctx.role)) {
		return json({ message: 'Forbidden' }, { status: 403 });
	}

	try {
		const [goal, tasks] = await Promise.all([
			adminFetch('marketing_goals', {}).then((goals: any[]) => goals.find((g: any) => g.id === params.id) || null).catch(() => null),
			adminFetch('goal_tasks', {
				fields: 'id,title,description,status,dueDate,estimatedCost,actualCost,expenseId,goalId',
				sort: '-created'
			}).then((allTasks: any[]) => allTasks.filter((t: any) => t.goalId === params.id)).catch(() => [])
		]);
		if (!goal) throw error(404, 'Marketing goal not found');

		const expenseIds = (tasks as any[]).map((t: any) => t.expenseId).filter(Boolean);
		const expenses = expenseIds.length > 0
			? await adminFetch('expenses', { fields: 'id,amount,status' }).then((allExp: any[]) => allExp.filter((e: any) => expenseIds.includes(e.id))).catch(() => [])
			: [];
		const expenseById = new Map((expenses as any[]).map((e: any) => [e.id, e]));

		const buf = await buildPDF(goal, tasks as any[], expenseById);
		const slug = String(goal.goalName ?? goal.name ?? 'marketing-goal')
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');
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
		console.error('marketing goal report error:', err);
		throw error(500, err?.message ?? 'PDF generation failed');
	}
};
