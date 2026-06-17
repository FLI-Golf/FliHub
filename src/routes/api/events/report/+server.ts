import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch } from '$lib/infra/pocketbase/pbClient';

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
		maximumFractionDigits: 0,
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

function statusLabel(status: string): string {
	if (status === 'in_progress') return 'In Progress';
	if (status === 'scheduled') return 'Scheduled';
	if (status === 'completed') return 'Completed';
	if (status === 'cancelled') return 'Cancelled';
	if (status === 'draft') return 'Draft';
	return status || 'Unknown';
}

function isUpcoming(dateText: string | null | undefined): boolean {
	if (!dateText) return false;
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const date = new Date(dateText);
	date.setHours(0, 0, 0, 0);
	return date.getTime() >= now.getTime();
}

function isWithinDays(dateText: string | null | undefined, days: number): boolean {
	if (!dateText) return false;
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const end = new Date(now);
	end.setDate(end.getDate() + days);
	const date = new Date(dateText);
	date.setHours(0, 0, 0, 0);
	return date.getTime() >= now.getTime() && date.getTime() <= end.getTime();
}

type ReportRow = {
	name: string;
	status: string;
	eventType: string;
	eventDate: string | null;
	location: string;
	talentCount: number;
	taskOpen: number;
	pendingApprovals: number;
	paid: number;
	pending: number;
	budget: number;
	progressPct: number;
};

async function buildPdf(rows: ReportRow[], filters: { status: string; type: string; date: string; search: string }) {
	const PDFDocument = (await import('pdfkit')).default;

	return new Promise<Buffer>((resolve, reject) => {
		const doc = new PDFDocument({ size: 'LETTER', margin: 40, bufferPages: true });
		const chunks: Buffer[] = [];
		doc.on('data', (c: Buffer) => chunks.push(c));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);

		const totalPaid = rows.reduce((sum, row) => sum + row.paid, 0);
		const totalPending = rows.reduce((sum, row) => sum + row.pending, 0);
		const totalBudget = rows.reduce((sum, row) => sum + row.budget, 0);
		const totalApprovals = rows.reduce((sum, row) => sum + row.pendingApprovals, 0);

		doc.font('Helvetica-Bold').fontSize(20).fillColor('#0f172a').text('Events Daily Team Review');
		doc.moveDown(0.2);
		doc.font('Helvetica').fontSize(10).fillColor('#475569').text(`Generated ${new Date().toLocaleString('en-US')}`);
		doc.text(`Filters: status=${filters.status || 'all'}, type=${filters.type || 'all'}, date=${filters.date || 'all'}, search=${filters.search || 'none'}`);

		doc.moveDown(0.8);
		doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Summary');
		doc.moveDown(0.25);
		doc.font('Helvetica').fontSize(10).fillColor('#1f2937');
		doc.text(`Events listed: ${rows.length}`);
		doc.text(`Pending payouts: ${fmtCurrency(totalPending)} | Paid: ${fmtCurrency(totalPaid)} | Budget: ${fmtCurrency(totalBudget)}`);
		doc.text(`Pending approvals: ${totalApprovals}`);

		doc.moveDown(0.8);
		doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Event List');
		doc.moveDown(0.25);

		if (rows.length === 0) {
			doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('No events matched the selected filters.');
			doc.end();
			return;
		}

		for (const row of rows) {
			if (doc.y > 710) doc.addPage();

			doc.roundedRect(40, doc.y, 535, 66, 6).fillAndStroke('#f8fafc', '#e2e8f0');
			const top = doc.y + 8;

			doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10).text(row.name, 50, top, { width: 250, lineBreak: false });
			doc.fillColor('#334155').font('Helvetica').fontSize(8).text(`${typeLabel(row.eventType)} • ${statusLabel(row.status)} • ${fmtDate(row.eventDate)}`, 50, top + 13, { width: 300, lineBreak: false });
			doc.text(row.location || '-', 50, top + 25, { width: 300, lineBreak: false });

			doc.fillColor('#0f172a').font('Helvetica').fontSize(8)
				.text(`Talent: ${row.talentCount}`, 320, top)
				.text(`Open Tasks: ${row.taskOpen}`, 320, top + 11)
				.text(`Approvals: ${row.pendingApprovals}`, 320, top + 22)
				.text(`Progress: ${row.progressPct}%`, 320, top + 33);

			doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8)
				.text(`Pending ${fmtCurrency(row.pending)}`, 430, top)
				.text(`Paid ${fmtCurrency(row.paid)}`, 430, top + 12)
				.text(`Budget ${fmtCurrency(row.budget)}`, 430, top + 24);

			doc.y = top + 58;
		}

		doc.end();
	});
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });
	if (!VIEW_ROLES.has(ctx.role)) return json({ message: 'Forbidden' }, { status: 403 });

	const status = (url.searchParams.get('status') ?? 'all').trim();
	const type = (url.searchParams.get('type') ?? 'all').trim();
	const date = (url.searchParams.get('date') ?? 'all').trim();
	const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();

	try {
		const [events, eventTalent, eventPayments, eventTasks] = await Promise.all([
			adminFetch('special_events', {
				sort: '-eventDate',
				fields: 'id,name,eventType,status,eventDate,location,budget,description'
			}).catch(() => []),
			adminFetch('event_talent', {
				fields: 'id,event,status'
			}).catch(() => []),
			adminFetch('event_payments', {
				fields: 'id,event,status,amount'
			}).catch(() => []),
			adminFetch('event_tasks', {
				fields: 'id,event,status'
			}).catch(() => []),
		]);

		const talentByEvent = new Map<string, number>();
		for (const row of eventTalent as any[]) {
			if (!row?.event) continue;
			talentByEvent.set(row.event, (talentByEvent.get(row.event) ?? 0) + 1);
		}

		const taskStatsByEvent = new Map<string, { open: number; done: number; total: number }>();
		for (const row of eventTasks as any[]) {
			if (!row?.event) continue;
			const current = taskStatsByEvent.get(row.event) ?? { open: 0, done: 0, total: 0 };
			current.total += 1;
			if (row.status === 'completed') current.done += 1;
			if (!['completed', 'cancelled'].includes(row.status)) current.open += 1;
			taskStatsByEvent.set(row.event, current);
		}

		const paymentStatsByEvent = new Map<string, { paid: number; pending: number; approvals: number }>();
		for (const row of eventPayments as any[]) {
			if (!row?.event) continue;
			const current = paymentStatsByEvent.get(row.event) ?? { paid: 0, pending: 0, approvals: 0 };
			const amount = toNumber(row.amount);
			if (row.status === 'paid') current.paid += amount;
			if (['pending', 'approval_required', 'approved'].includes(row.status)) current.pending += amount;
			if (row.status === 'approval_required') current.approvals += 1;
			paymentStatsByEvent.set(row.event, current);
		}

		const rows: ReportRow[] = (events as any[])
			.map((event: any) => {
				const taskStats = taskStatsByEvent.get(event.id) ?? { open: 0, done: 0, total: 0 };
				const paymentStats = paymentStatsByEvent.get(event.id) ?? { paid: 0, pending: 0, approvals: 0 };
				const progressPct = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : (event.status === 'completed' ? 100 : 0);

				return {
					name: event.name ?? 'Untitled Event',
					status: String(event.status ?? 'draft'),
					eventType: String(event.eventType ?? 'other'),
					eventDate: event.eventDate ?? null,
					location: event.location ?? '',
					talentCount: talentByEvent.get(event.id) ?? 0,
					taskOpen: taskStats.open,
					pendingApprovals: paymentStats.approvals,
					paid: paymentStats.paid,
					pending: paymentStats.pending,
					budget: toNumber(event.budget),
					progressPct: Math.max(0, Math.min(100, progressPct)),
				};
			})
			.filter((row) => {
				const statusMatch = status === 'all' || row.status === status;
				const typeMatch = type === 'all' || row.eventType === type;

				let dateMatch = true;
				if (date === 'upcoming') dateMatch = isUpcoming(row.eventDate);
				if (date === 'next30') dateMatch = isWithinDays(row.eventDate, 30);
				if (date === 'past') dateMatch = !isUpcoming(row.eventDate);

				const qMatch = !search
					|| row.name.toLowerCase().includes(search)
					|| row.location.toLowerCase().includes(search)
					|| typeLabel(row.eventType).toLowerCase().includes(search);

				return statusMatch && typeMatch && dateMatch && qMatch;
			});

		const buf = await buildPdf(rows, { status, type, date, search });
		const stamp = new Date().toISOString().slice(0, 10);

		return new Response(new Uint8Array(buf), {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="events-daily-report-${stamp}.pdf"`,
				'Content-Length': String(buf.length),
			},
		});
	} catch (err: any) {
		console.error('events report error:', err);
		return json({ message: err?.message ?? 'PDF generation failed' }, { status: 500 });
	}
};