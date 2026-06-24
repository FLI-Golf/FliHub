import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';

const VIEW_ROLES = new Set(['admin', 'leader', 'marketing', 'marketing_lead']);

function toNumber(value: unknown): number {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

function fmtCurrency(n: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(n ?? 0);
}

function fmtDate(value: string | null | undefined): string {
	if (!value) return '-';
	const d = new Date(value);
	if (!Number.isFinite(d.getTime())) return '-';
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function typeLabel(value: string): string {
	if (!value) return 'Other';
	return value.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function stageLabel(value: string): string {
	if (value === 'brief') return 'Brief';
	if (value === 'shoot') return 'Shoot';
	if (value === 'edit') return 'Edit';
	if (value === 'approval') return 'Approval';
	if (value === 'published') return 'Published';
	if (value === 'paid') return 'Paid';
	if (value === 'cancelled') return 'Cancelled';
	return value || 'Unknown';
}

type ReportRow = {
	title: string;
	contentType: string;
	stage: string;
	departmentName: string;
	projectName: string;
	dueDate: string | null;
	taskOpen: number;
	pendingApproval: boolean;
	budget: number;
	actual: number;
};

async function buildPdf(rows: ReportRow[]) {
	const PDFDocument = (await import('pdfkit')).default;

	return new Promise<Buffer>((resolve, reject) => {
		const doc = new PDFDocument({ size: 'LETTER', margin: 40, bufferPages: true });
		const chunks: Buffer[] = [];
		doc.on('data', (c: Buffer) => chunks.push(c));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);

		const totalBudget = rows.reduce((sum, row) => sum + row.budget, 0);
		const totalActual = rows.reduce((sum, row) => sum + row.actual, 0);
		const totalPendingApprovals = rows.filter((row) => row.pendingApproval).length;

		doc.font('Helvetica-Bold').fontSize(20).fillColor('#0f172a').text('Media Content Daily Review');
		doc.moveDown(0.2);
		doc.font('Helvetica').fontSize(10).fillColor('#475569').text(`Generated ${new Date().toLocaleString('en-US')}`);

		doc.moveDown(0.8);
		doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Summary');
		doc.moveDown(0.25);
		doc.font('Helvetica').fontSize(10).fillColor('#1f2937');
		doc.text(`Items listed: ${rows.length}`);
		doc.text(`Budget: ${fmtCurrency(totalBudget)} | Actual: ${fmtCurrency(totalActual)}`);
		doc.text(`Pending approvals: ${totalPendingApprovals}`);

		doc.moveDown(0.8);
		doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Content Items');
		doc.moveDown(0.25);

		if (rows.length === 0) {
			doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('No content items available.');
			doc.end();
			return;
		}

		for (const row of rows) {
			if (doc.y > 710) doc.addPage();

			doc.roundedRect(40, doc.y, 535, 72, 6).fillAndStroke('#f8fafc', '#e2e8f0');
			const top = doc.y + 8;

			doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10).text(row.title, 50, top, { width: 260, lineBreak: false });
			doc.fillColor('#334155').font('Helvetica').fontSize(8).text(`${typeLabel(row.contentType)} • ${stageLabel(row.stage)} • Due ${fmtDate(row.dueDate)}`, 50, top + 13, { width: 290, lineBreak: false });
			doc.text(`Department: ${row.departmentName}`, 50, top + 25, { width: 290, lineBreak: false });
			doc.text(`Project: ${row.projectName || '-'}`, 50, top + 37, { width: 290, lineBreak: false });

			doc.fillColor('#0f172a').font('Helvetica').fontSize(8)
				.text(`Open Tasks: ${row.taskOpen}`, 350, top)
				.text(`Pending Approval: ${row.pendingApproval ? 'Yes' : 'No'}`, 350, top + 12)
				.text(`Budget: ${fmtCurrency(row.budget)}`, 350, top + 24)
				.text(`Actual: ${fmtCurrency(row.actual)}`, 350, top + 36);

			doc.y = top + 62;
		}

		doc.end();
	});
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (!VIEW_ROLES.has(ctx.role)) return json({ message: 'Forbidden' }, { status: 403 });

	try {
		const [items, tasks] = await Promise.all([
			ctx.pb.collection('content_production').getFullList({
				sort: '-created',
				expand: 'department,project',
				fields: 'id,title,contentType,stage,dueDate,budget,actualCost,requiresApproval,approvalStatus,expand.department.name,expand.project.name'
			}).catch(() => []),
			ctx.pb.collection('tasks').getFullList({
				filter: 'contentProductionId != ""',
				fields: 'id,contentProductionId,status'
			}).catch(() => [])
		]);

		const taskOpenByContent = new Map<string, number>();
		for (const task of tasks as any[]) {
			const contentId = String(task.contentProductionId || '');
			if (!contentId) continue;
			if (['completed', 'cancelled'].includes(String(task.status || ''))) continue;
			taskOpenByContent.set(contentId, (taskOpenByContent.get(contentId) ?? 0) + 1);
		}

		const rows: ReportRow[] = (items as any[]).map((item: any) => ({
			title: item.title ?? 'Untitled Content',
			contentType: String(item.contentType ?? 'other'),
			stage: String(item.stage ?? 'brief'),
			departmentName: item.expand?.department?.name ?? 'Unassigned',
			projectName: item.expand?.project?.name ?? '',
			dueDate: item.dueDate ?? null,
			taskOpen: taskOpenByContent.get(String(item.id)) ?? 0,
			pendingApproval: !!item.requiresApproval && String(item.approvalStatus ?? '') === 'pending',
			budget: toNumber(item.budget),
			actual: toNumber(item.actualCost)
		}));

		const buf = await buildPdf(rows);
		const stamp = new Date().toISOString().slice(0, 10);

		return new Response(new Uint8Array(buf), {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="content-daily-report-${stamp}.pdf"`,
				'Content-Length': String(buf.length)
			}
		});
	} catch (err: any) {
		console.error('content report error:', err);
		return json({ message: err?.message ?? 'PDF generation failed' }, { status: 500 });
	}
};
