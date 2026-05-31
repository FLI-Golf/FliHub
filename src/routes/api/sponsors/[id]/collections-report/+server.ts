/**
 * GET  /api/sponsors/:id/collections-report?format=print  → HTML print page
 * POST /api/sponsors/:id/collections-report               → PDF download
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { adminFetch, getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

const C = {
	navy: '#0f172a', slate: '#1e293b', slateL: '#334155',
	muted: '#64748b', border: '#cbd5e1', bg: '#f8fafc', white: '#ffffff',
	green: '#10b981', blue: '#3b82f6', amber: '#f59e0b',
	red: '#ef4444', orange: '#f97316', gray: '#94a3b8', teal: '#14b8a6',
};

function fmt(n: number) {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
}
function fmtDate(d: string | null | undefined) {
	if (!d) return '—';
	try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
	catch { return '—'; }
}
function fmtDT(d: string | null | undefined) {
	if (!d) return '—';
	try { return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
	catch { return '—'; }
}

const PO_STATUS_LABEL: Record<string, string> = {
	draft: 'Draft', sent: 'Sent', acknowledged: 'Acknowledged', invoiced: 'Invoiced',
	partial: 'Partial', paid: 'Paid', overdue: 'Overdue', disputed: 'Disputed',
	resolved: 'Resolved', write_off: 'Write-Off', bad_debt: 'Bad Debt', cancelled: 'Cancelled',
};
const PMT_STATUS_LABEL: Record<string, string> = {
	scheduled: 'Scheduled', invoiced: 'Invoiced', partial: 'Partial',
	overdue: 'Overdue', disputed: 'Disputed', received: 'Received',
	write_off: 'Write-Off', bad_debt: 'Bad Debt',
};
const AUDIT_LABEL: Record<string, string> = {
	'po.sent': 'PO Sent', 'po.acknowledged': 'PO Acknowledged', 'po.invoiced': 'Invoiced',
	'po.partial': 'Partial Payment', 'po.paid': 'Paid — WO Created', 'po.overdue': 'Marked Overdue',
	'po.disputed': 'Dispute Opened', 'po.resolved': 'Dispute Resolved',
	'po.write_off': 'Written Off', 'po.bad_debt': 'Bad Debt', 'po.cancelled': 'PO Cancelled',
	'payment.received': 'Payment Received', 'payment.overdue': 'Payment Overdue',
	'payment.disputed': 'Payment Disputed', 'payment.write_off': 'Payment Written Off',
};

async function loadSponsorData(sponsorId: string) {
	const [sponsor, payments, pos, auditLog] = await Promise.all([
		adminFetch('sponsors', { filter: `id="${sponsorId}"`, expand: 'assignedTo' }).then(r => r[0] ?? null),
		adminFetch('sponsor_payments', { filter: `sponsor="${sponsorId}"`, sort: '-dueDate' }),
		adminFetch('sponsor_purchase_orders', { filter: `sponsorId="${sponsorId}"`, sort: '-created' }),
		adminFetch('sponsor_audit_log', { filter: `sponsorId="${sponsorId}"`, sort: '-created' }),
	]);
	return { sponsor, payments, pos, auditLog };
}

// ── HTML print view ───────────────────────────────────────────────────────────
export const GET: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return new Response('Unauthorized', { status: 401 });

	const { sponsor, payments, pos, auditLog } = await loadSponsorData(params.id);
	if (!sponsor) return new Response('Sponsor not found', { status: 404 });

	const received  = payments.filter((p: any) => p.status === 'received').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
	const overdue   = payments.filter((p: any) => p.status === 'overdue').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
	const disputed  = payments.filter((p: any) => p.status === 'disputed').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
	const writeOff  = payments.filter((p: any) => ['write_off','bad_debt'].includes(p.status)).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
	const committed = sponsor.annualCommitment ?? 0;
	const rate      = committed > 0 ? Math.round((received / committed) * 100) : 0;
	const rep       = sponsor.expand?.assignedTo;
	const repName   = rep ? ([rep.firstName, rep.lastName].filter(Boolean).join(' ') || rep.email) : '—';

	const poRows = pos.map((po: any) => `
		<tr>
			<td>${po.po_number}</td>
			<td>${PO_STATUS_LABEL[po.status] ?? po.status}</td>
			<td>${fmtDate(po.dueDate)}</td>
			<td style="text-align:right">${fmt(po.amount)}</td>
			<td>${po.description ?? ''}</td>
			<td>${po.disputeReason ?? po.writeOffReason ?? ''}</td>
		</tr>`).join('');

	const pmtRows = payments.map((p: any) => `
		<tr>
			<td>${PMT_STATUS_LABEL[p.status] ?? p.status}</td>
			<td>${p.paymentType ?? ''}</td>
			<td>${fmtDate(p.dueDate)}</td>
			<td>${fmtDate(p.receivedDate)}</td>
			<td style="text-align:right">${fmt(p.amount)}</td>
			<td>${p.qb_transaction_id ?? ''}</td>
			<td>${p.notes ?? ''}</td>
		</tr>`).join('');

	const auditRows = auditLog.map((e: any) => `
		<tr>
			<td>${fmtDT(e.created)}</td>
			<td>${AUDIT_LABEL[e.action] ?? e.action}</td>
			<td>${e.fromStatus ?? ''} → ${e.toStatus ?? ''}</td>
			<td style="text-align:right">${e.amount ? fmt(e.amount) : ''}</td>
			<td>${e.notes ?? ''}</td>
		</tr>`).join('');

	const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${sponsor.companyName} — Collections Report</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 20px; }
  h1 { font-size: 18px; margin: 0 0 4px; } h2 { font-size: 13px; margin: 16px 0 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
  .meta { color: #64748b; font-size: 10px; margin-bottom: 12px; }
  .tiles { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .tile { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; min-width: 100px; }
  .tile-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
  .tile-value { font-size: 16px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { background: #f1f5f9; text-align: left; padding: 4px 6px; font-size: 10px; border: 1px solid #e2e8f0; }
  td { padding: 3px 6px; border: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .green { color: #10b981; } .red { color: #ef4444; } .orange { color: #f97316; } .gray { color: #94a3b8; }
  @media print { body { margin: 0; } }
</style>
</head><body>
<h1>${sponsor.companyName}</h1>
<div class="meta">
  Tier: ${sponsor.tier ?? '—'} &nbsp;|&nbsp; Stage: ${sponsor.pipeline_stage ?? sponsor.status ?? '—'} &nbsp;|&nbsp;
  Rep: ${repName} &nbsp;|&nbsp; Report generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
</div>
<div class="tiles">
  <div class="tile"><div class="tile-label">Committed</div><div class="tile-value">${fmt(committed)}</div></div>
  <div class="tile"><div class="tile-label">Received</div><div class="tile-value green">${fmt(received)}</div></div>
  <div class="tile"><div class="tile-label">Overdue</div><div class="tile-value red">${fmt(overdue)}</div></div>
  <div class="tile"><div class="tile-label">Disputed</div><div class="tile-value orange">${fmt(disputed)}</div></div>
  <div class="tile"><div class="tile-label">Written Off</div><div class="tile-value gray">${fmt(writeOff)}</div></div>
  <div class="tile"><div class="tile-label">Collection Rate</div><div class="tile-value">${rate}%</div></div>
</div>
<h2>Purchase Orders</h2>
<table><thead><tr><th>PO #</th><th>Status</th><th>Due Date</th><th>Amount</th><th>Description</th><th>Notes</th></tr></thead>
<tbody>${poRows || '<tr><td colspan="6" style="color:#94a3b8">No purchase orders</td></tr>'}</tbody></table>
<h2>Payments</h2>
<table><thead><tr><th>Status</th><th>Type</th><th>Due</th><th>Received</th><th>Amount</th><th>QB Ref</th><th>Notes</th></tr></thead>
<tbody>${pmtRows || '<tr><td colspan="7" style="color:#94a3b8">No payments</td></tr>'}</tbody></table>
<h2>Audit Log</h2>
<table><thead><tr><th>Date/Time</th><th>Action</th><th>Transition</th><th>Amount</th><th>Notes</th></tr></thead>
<tbody>${auditRows || '<tr><td colspan="5" style="color:#94a3b8">No audit entries</td></tr>'}</tbody></table>
<script>window.onload = () => window.print();<\/script>
</body></html>`;

	return new Response(html, { headers: { 'Content-Type': 'text/html' } });
};

// ── PDF download ──────────────────────────────────────────────────────────────
export const POST: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return json({ message: 'Unauthorized' }, { status: 401 });

	const { sponsor, payments, pos, auditLog } = await loadSponsorData(params.id);
	if (!sponsor) return json({ message: 'Sponsor not found' }, { status: 404 });

	const received  = payments.filter((p: any) => p.status === 'received').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
	const overdue   = payments.filter((p: any) => p.status === 'overdue').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
	const disputed  = payments.filter((p: any) => p.status === 'disputed').reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
	const writeOff  = payments.filter((p: any) => ['write_off','bad_debt'].includes(p.status)).reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
	const committed = sponsor.annualCommitment ?? 0;
	const rate      = committed > 0 ? Math.round((received / committed) * 100) : 0;
	const rep       = sponsor.expand?.assignedTo;
	const repName   = rep ? ([rep.firstName, rep.lastName].filter(Boolean).join(' ') || rep.email) : '—';

	try {
		const PDFDocument = (await import('pdfkit')).default;
		const buf = await new Promise<Buffer>((resolve, reject) => {
			const doc = new PDFDocument({ size: 'LETTER', margin: 40, bufferPages: true,
				info: { Title: `${sponsor.companyName} — Collections Report`, Author: 'FLI Golf League' } });
			const chunks: Buffer[] = [];
			doc.on('data', (c: Buffer) => chunks.push(c));
			doc.on('end', () => resolve(Buffer.concat(chunks)));
			doc.on('error', reject);

			const W = doc.page.width - 80;
			const col = (n: number, total: number) => (W / total) * n;

			// Header
			doc.rect(0, 0, doc.page.width, 60).fill(C.navy);
			doc.fillColor(C.white).fontSize(18).font('Helvetica-Bold').text(sponsor.companyName, 40, 16);
			doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
				.text(`Tier: ${sponsor.tier ?? '—'}  ·  Stage: ${sponsor.pipeline_stage ?? '—'}  ·  Rep: ${repName}  ·  Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 40, 40);

			// Summary tiles
			doc.y = 80;
			const tiles = [
				{ label: 'Committed',      value: fmt(committed), color: C.slate },
				{ label: 'Received',       value: fmt(received),  color: C.green },
				{ label: 'Overdue',        value: fmt(overdue),   color: C.red },
				{ label: 'Disputed',       value: fmt(disputed),  color: C.orange },
				{ label: 'Written Off',    value: fmt(writeOff),  color: C.muted },
				{ label: 'Collection %',   value: `${rate}%`,     color: rate >= 80 ? C.green : rate >= 50 ? C.amber : C.red },
			];
			const tw = W / tiles.length;
			tiles.forEach((t, i) => {
				const tx = 40 + i * tw;
				doc.rect(tx, 78, tw - 4, 44).fill(C.bg).stroke(C.border);
				doc.fillColor(C.muted).fontSize(7).font('Helvetica').text(t.label.toUpperCase(), tx + 6, 84);
				doc.fillColor(t.color).fontSize(13).font('Helvetica-Bold').text(t.value, tx + 6, 96);
			});
			doc.y = 134;

			// Section helper
			function section(title: string) {
				doc.moveDown(0.5);
				doc.rect(40, doc.y, W, 16).fill(C.slate);
				doc.fillColor(C.white).fontSize(9).font('Helvetica-Bold').text(title, 46, doc.y - 13);
				doc.moveDown(0.3);
			}

			// Table helper
			function tableRow(cols: string[], widths: number[], y: number, isHeader = false, rowColor = C.white) {
				let x = 40;
				if (!isHeader) doc.rect(40, y - 2, W, 14).fill(rowColor).stroke(C.border);
				cols.forEach((text, i) => {
					doc.fillColor(isHeader ? C.white : C.navy).fontSize(7)
						.font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
						.text(String(text ?? '').slice(0, 60), x + 3, y, { width: widths[i] - 6, lineBreak: false });
					x += widths[i];
				});
			}

			// POs table
			section('Purchase Orders');
			const poW = [col(1.5,8), col(1,8), col(1,8), col(1,8), col(2.5,8), col(1,8)];
			doc.rect(40, doc.y, W, 16).fill(C.slateL);
			tableRow(['PO Number','Status','Due Date','Amount','Description','Notes'], poW, doc.y + 3, true);
			doc.moveDown(1.2);
			pos.forEach((po: any, i: number) => {
				if (doc.y > 680) { doc.addPage(); doc.y = 40; }
				const bg = i % 2 === 0 ? C.white : C.bg;
				tableRow([po.po_number, PO_STATUS_LABEL[po.status]??po.status, fmtDate(po.dueDate), fmt(po.amount), po.description??'', po.disputeReason??po.writeOffReason??''], poW, doc.y, false, bg);
				doc.moveDown(0.9);
			});
			if (pos.length === 0) { doc.fillColor(C.muted).fontSize(8).text('No purchase orders', 46); doc.moveDown(0.5); }

			// Payments table
			section('Payments');
			const pmW = [col(1,7), col(1,7), col(1,7), col(1,7), col(1,7), col(1,7), col(1,7)];
			doc.rect(40, doc.y, W, 16).fill(C.slateL);
			tableRow(['Status','Type','Due','Received','Amount','QB Ref','Notes'], pmW, doc.y + 3, true);
			doc.moveDown(1.2);
			payments.forEach((p: any, i: number) => {
				if (doc.y > 680) { doc.addPage(); doc.y = 40; }
				const bg = i % 2 === 0 ? C.white : C.bg;
				tableRow([PMT_STATUS_LABEL[p.status]??p.status, p.paymentType??'', fmtDate(p.dueDate), fmtDate(p.receivedDate), fmt(p.amount), p.qb_transaction_id??'', p.notes??''], pmW, doc.y, false, bg);
				doc.moveDown(0.9);
			});
			if (payments.length === 0) { doc.fillColor(C.muted).fontSize(8).text('No payments', 46); doc.moveDown(0.5); }

			// Audit log
			section('Audit Log');
			const auW = [col(1.5,6), col(1.5,6), col(1,6), col(1,6), col(1,6)];
			doc.rect(40, doc.y, W, 16).fill(C.slateL);
			tableRow(['Date/Time','Action','Transition','Amount','Notes'], auW, doc.y + 3, true);
			doc.moveDown(1.2);
			auditLog.forEach((e: any, i: number) => {
				if (doc.y > 680) { doc.addPage(); doc.y = 40; }
				const bg = i % 2 === 0 ? C.white : C.bg;
				const trans = e.fromStatus && e.toStatus ? `${e.fromStatus} → ${e.toStatus}` : '';
				tableRow([fmtDT(e.created), AUDIT_LABEL[e.action]??e.action, trans, e.amount?fmt(e.amount):'', e.notes??''], auW, doc.y, false, bg);
				doc.moveDown(0.9);
			});
			if (auditLog.length === 0) { doc.fillColor(C.muted).fontSize(8).text('No audit entries', 46); }

			// Page numbers
			const pages = doc.bufferedPageRange();
			for (let i = 0; i < pages.count; i++) {
				doc.switchToPage(i);
				doc.fillColor(C.muted).fontSize(7).text(`Page ${i + 1} of ${pages.count}  ·  FLI Golf League — Confidential`, 40, doc.page.height - 30, { align: 'center', width: W });
			}

			doc.end();
		});

		return new Response(buf as unknown as BodyInit, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${sponsor.companyName.replace(/\s+/g, '-').toLowerCase()}-collections-${new Date().toISOString().slice(0,10)}.pdf"`,
			},
		});
	} catch (err: any) {
		return json({ message: err?.message ?? 'PDF generation failed' }, { status: 500 });
	}
};
