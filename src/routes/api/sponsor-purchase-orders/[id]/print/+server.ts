/**
 * GET /api/sponsor-purchase-orders/:id/print
 * Returns a print-ready HTML page for a single sponsor Purchase Order.
 * Opening this URL in a new tab and using the browser's Print dialog
 * produces a clean PDF suitable for sending to the sponsor.
 */
import type { RequestHandler } from './$types';
import { RequestContext } from '$lib/infra/RequestContext';
import { getAdminPocketBase } from '$lib/infra/pocketbase/pbClient';

const fmt = (n: number) =>
	new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n ?? 0);

const fmtDate = (d: string | null | undefined) => {
	if (!d) return '—';
	try { return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
	catch { return '—'; }
};

const PO_STATUS_LABEL: Record<string, string> = {
	draft: 'Draft', sent: 'Sent', acknowledged: 'Acknowledged',
	invoiced: 'Invoiced', partial: 'Partial Payment', paid: 'Paid',
	overdue: 'Overdue', disputed: 'Disputed', cancelled: 'Cancelled',
};

export const GET: RequestHandler = async ({ locals, url, params }) => {
	const ctx = await RequestContext.fromApi(locals, url);
	if (!ctx) return new Response('Unauthorized', { status: 401 });

	const adminPb = await getAdminPocketBase();

	const po = await adminPb.collection('sponsor_purchase_orders').getOne(params.id, {
		expand: 'sponsorId,createdBy,assignedTo',
	}).catch(() => null);

	if (!po) return new Response('Purchase order not found', { status: 404 });

	const sponsor = po.expand?.sponsorId ?? null;
	const rep     = po.expand?.assignedTo ?? po.expand?.createdBy ?? null;
	const repName = rep ? ([rep.firstName, rep.lastName].filter(Boolean).join(' ') || rep.email) : '—';
	const repEmail = rep?.email ?? '';

	const statusLabel = PO_STATUS_LABEL[po.status] ?? po.status;
	const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${po.po_number} — FLI Golf League</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11pt;
      color: #1e293b;
      background: #fff;
      padding: 0;
    }

    /* ── Print controls (hidden when printing) ── */
    .print-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 40px;
      background: #0f172a;
      color: #94a3b8;
      font-size: 10pt;
      gap: 12px;
    }
    .print-bar strong { color: #f1f5f9; }
    .print-btn {
      background: #f97316;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 8px 20px;
      font-size: 10pt;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: 0.02em;
    }
    .print-btn:hover { background: #ea6c0a; }

    @media print {
      .print-bar { display: none; }
      body { padding: 0; }
    }

    /* ── Document ── */
    .doc {
      max-width: 760px;
      margin: 0 auto;
      padding: 48px 48px 64px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .org-name {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .org-sub {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 3px;
    }
    .po-meta {
      text-align: right;
    }
    .po-number {
      font-size: 15pt;
      font-weight: 700;
      color: #0f172a;
      font-family: 'Courier New', monospace;
    }
    .po-status {
      display: inline-block;
      margin-top: 5px;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: ${po.status === 'paid' ? '#d1fae5' : po.status === 'overdue' ? '#fee2e2' : '#fef3c7'};
      color: ${po.status === 'paid' ? '#065f46' : po.status === 'overdue' ? '#991b1b' : '#92400e'};
    }

    /* Parties */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }
    .party-block h3 {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .party-block p {
      font-size: 10.5pt;
      color: #1e293b;
      line-height: 1.6;
    }
    .party-block .company { font-weight: 700; font-size: 12pt; }

    /* Summary table */
    .summary {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .summary thead tr {
      background: #0f172a;
      color: #f1f5f9;
    }
    .summary thead th {
      padding: 9px 14px;
      text-align: left;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .summary thead th:last-child { text-align: right; }
    .summary tbody td {
      padding: 10px 14px;
      font-size: 10.5pt;
      border-top: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .summary tbody td:last-child { text-align: right; font-weight: 700; }
    .summary tfoot td {
      padding: 10px 14px;
      border-top: 2px solid #0f172a;
      font-weight: 700;
      font-size: 12pt;
    }
    .summary tfoot td:last-child { text-align: right; color: #0f172a; }

    /* Details grid */
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
      padding: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .detail-item label {
      display: block;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #64748b;
      margin-bottom: 3px;
    }
    .detail-item span {
      font-size: 10pt;
      color: #1e293b;
      font-weight: 600;
    }

    /* Terms / deliverables */
    .section {
      margin-bottom: 22px;
    }
    .section h3 {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }
    .section p {
      font-size: 10pt;
      color: #334155;
      line-height: 1.65;
      white-space: pre-wrap;
    }

    /* Signature block */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }
    .sig-block p { font-size: 9pt; color: #64748b; margin-bottom: 32px; }
    .sig-line {
      border-top: 1px solid #1e293b;
      padding-top: 5px;
      font-size: 9pt;
      color: #475569;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Screen-only print bar -->
  <div class="print-bar">
    <span><strong>${po.po_number}</strong> — ${sponsor?.companyName ?? 'Sponsor'}</span>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="doc">

    <!-- Header -->
    <div class="header">
      <div>
        <div class="org-name">FLI Golf League</div>
        <div class="org-sub">FLI Golf League, LLC &nbsp;·&nbsp; Professional Disc Golf</div>
      </div>
      <div class="po-meta">
        <div class="po-number">${po.po_number}</div>
        <div>
          <span class="po-status">${statusLabel}</span>
        </div>
        <div style="font-size:8.5pt;color:#64748b;margin-top:6px;">Issued: ${today}</div>
        ${po.dueDate ? `<div style="font-size:8.5pt;color:#64748b;">Due: ${fmtDate(po.dueDate)}</div>` : ''}
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party-block">
        <h3>From</h3>
        <p>
          <span class="company">FLI Golf League, LLC</span><br />
          Professional Disc Golf League<br />
          ${repName !== '—' ? `Sales Representative: ${repName}` : ''}<br />
          ${repEmail ? repEmail : ''}
        </p>
      </div>
      <div class="party-block">
        <h3>To</h3>
        <p>
          <span class="company">${sponsor?.companyName ?? '—'}</span><br />
          ${sponsor?.primaryContactName ? sponsor.primaryContactName + '<br />' : ''}
          ${sponsor?.primaryContactEmail ? sponsor.primaryContactEmail + '<br />' : ''}
          ${sponsor?.location ?? ''}
        </p>
      </div>
    </div>

    <!-- Line items -->
    <table class="summary">
      <thead>
        <tr>
          <th style="width:40%">Description</th>
          <th>Period</th>
          <th>Year</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${po.description || `Sponsorship Agreement — ${sponsor?.companyName ?? ''}`}</td>
          <td>
            ${po.period_start || po.period_end
              ? `${fmtDate(po.period_start)} – ${fmtDate(po.period_end)}`
              : '—'}
          </td>
          <td>${po.year ?? new Date().getFullYear()}</td>
          <td>${fmt(po.amount ?? 0)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3">Total Due</td>
          <td>${fmt(po.amount ?? 0)}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Details -->
    <div class="details">
      <div class="detail-item">
        <label>PO Number</label>
        <span style="font-family:'Courier New',monospace">${po.po_number}</span>
      </div>
      <div class="detail-item">
        <label>Status</label>
        <span>${statusLabel}</span>
      </div>
      <div class="detail-item">
        <label>Year</label>
        <span>${po.year ?? '—'}</span>
      </div>
      <div class="detail-item">
        <label>Issue Date</label>
        <span>${today}</span>
      </div>
      <div class="detail-item">
        <label>Due Date</label>
        <span>${fmtDate(po.dueDate)}</span>
      </div>
      <div class="detail-item">
        <label>Sponsor Tier</label>
        <span>${sponsor?.tier?.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? '—'}</span>
      </div>
    </div>

    ${po.terms ? `
    <div class="section">
      <h3>Payment Terms</h3>
      <p>${po.terms}</p>
    </div>` : ''}

    ${po.deliverables ? `
    <div class="section">
      <h3>Deliverables</h3>
      <p>${po.deliverables}</p>
    </div>` : ''}

    ${po.notes ? `
    <div class="section">
      <h3>Notes</h3>
      <p>${po.notes}</p>
    </div>` : ''}

    <!-- Signature block -->
    <div class="signatures">
      <div class="sig-block">
        <p>Authorized by FLI Golf League, LLC</p>
        <div class="sig-line">Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date</div>
        <div style="margin-top:8px;font-size:9pt;color:#475569;">${repName !== '—' ? repName : 'Authorized Representative'}</div>
      </div>
      <div class="sig-block">
        <p>Accepted by ${sponsor?.companyName ?? 'Sponsor'}</p>
        <div class="sig-line">Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date</div>
        <div style="margin-top:8px;font-size:9pt;color:#475569;">${sponsor?.primaryContactName ?? 'Authorized Representative'}</div>
      </div>
    </div>

    <div class="footer">
      ${po.po_number} &nbsp;·&nbsp; FLI Golf League, LLC &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; Generated ${today}
    </div>

  </div>

</body>
</html>`;

	return new Response(html, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
};
