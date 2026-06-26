<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { ClipboardList, CheckCircle2, Clock, XCircle, DollarSign, Copy, Check, Info, ChevronDown, FileDown, ArrowRight, Receipt, AlertTriangle } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	const bankAccounts = $derived((data as any).bankAccounts ?? []);

	const STATUS_OPTIONS = ['open', 'paid', 'cancelled'];
	const SOURCE_OPTIONS = ['expense', 'reimbursement', 'bid', 'goal_task'];

	let searchTerm = $state('');
	let selectedStatuses = $state<string[]>([...STATUS_OPTIONS]);
	let selectedSources = $state<string[]>([]);
	let selectedProjects = $state<string[]>([]);
	let minAmountFilter = $state('');
	let maxAmountFilter = $state('');
	let approvedFrom = $state('');
	let approvedTo = $state('');
	let qbFilter = $state<'all' | 'recorded' | 'missing'>('all');
	let sortBy = $state('approved_desc');
	let copied        = $state<string | null>(null);
	let markingPaid   = $state<string | null>(null);
	let showAbout     = $state(false);
	let expandedQB    = $state<string | null>(null);
	let savingQB      = $state<string | null>(null);
	let qbResult      = $state<{ woId: string; expenseCreated: boolean; expenseId?: string; warning?: string } | null>(null);

	const EVENT_OPERATIONS_ACCOUNT_KEY = 'event operations account';

	// QB form state per WO
	let qbForms = $state<Record<string, { txnId: string; enteredBy: string; enteredDate: string; account: string; accountId: string; notes: string }>>({});

	$effect(() => {
		const today = new Date().toISOString().slice(0, 10);
		for (const wo of data.workOrders as any[]) {
			const matchedAccount = findBankAccountByLabel(String(wo.qb_account ?? ''));
			if (!qbForms[wo.id]) {
				qbForms[wo.id] = {
					txnId:       wo.qb_transaction_id  ?? '',
					enteredBy:   wo.qb_entered_by      ?? '',
					enteredDate: wo.qb_entered_date?.slice(0,10) ?? today,
					account:     wo.qb_account         ?? '',
					accountId:   matchedAccount?.id    ?? '',
					notes:       wo.qb_notes           ?? '',
				};
			}
		}
	});

	async function saveQB(woId: string) {
		qbResult = null;
		const f = qbForms[woId];
		const selectedAccount = bankAccounts.find((account: any) => account.id === f.accountId);
		const accountLabel = selectedAccount ? accountOptionLabel(selectedAccount) : String(f.account ?? '').trim();
		if (!isEventOperationsAccountLabel(accountLabel)) {
			qbResult = { woId, expenseCreated: false, warning: 'Select the Event Operations Account before generating this payout.' };
			return;
		}

		savingQB = woId;
		const generatedTxnId = f.txnId.trim() || generateInternalPaymentReference(woId);
		const res = await fetch(`/api/work-orders/${woId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				qb_transaction_id: generatedTxnId,
				qb_entered_date:   f.enteredDate,
				qb_account:        accountLabel,
				qb_account_id:     selectedAccount?.id ?? '',
				qb_notes:          f.notes,
				status:            'paid',
			})
		});
		const data = await res.json();
		savingQB = null;
		expandedQB = null;
		if (data._expenseCreated) {
			qbResult = { woId, expenseCreated: true, expenseId: data._expenseId };
		} else if (data._expenseWarning) {
			qbResult = { woId, expenseCreated: false, warning: data._expenseWarning };
		}
		await invalidateAll();
	}

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n ?? 0);

	function fmtDate(d: string | null | undefined) {
		if (!d) return '—';
		try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
		catch { return '—'; }
	}

	const projects = $derived([...new Set((data.workOrders as any[]).map((w: any) => w.projectName).filter(Boolean))].sort());

	$effect(() => {
		if (selectedSources.length === 0) {
			const present = [...new Set((data.workOrders as any[]).map((w: any) => String(w.source ?? '')).filter(Boolean))];
			selectedSources = SOURCE_OPTIONS.filter((s) => present.includes(s));
		}
		if (selectedProjects.length === 0 && projects.length > 0) {
			selectedProjects = [...projects];
		}
	});

	function toggleStatus(status: string) {
		selectedStatuses = selectedStatuses.includes(status)
			? selectedStatuses.filter((s) => s !== status)
			: [...selectedStatuses, status];
	}

	function toggleSource(source: string) {
		selectedSources = selectedSources.includes(source)
			? selectedSources.filter((s) => s !== source)
			: [...selectedSources, source];
	}

	function toggleProject(project: string) {
		selectedProjects = selectedProjects.includes(project)
			? selectedProjects.filter((p) => p !== project)
			: [...selectedProjects, project];
	}

	function clearFilters() {
		searchTerm = '';
		selectedStatuses = [...STATUS_OPTIONS];
		selectedSources = [...new Set((data.workOrders as any[]).map((w: any) => String(w.source ?? '')).filter(Boolean))];
		selectedProjects = [...projects];
		minAmountFilter = '';
		maxAmountFilter = '';
		approvedFrom = '';
		approvedTo = '';
		qbFilter = 'all';
		sortBy = 'approved_desc';
	}

	const filtered = $derived.by(() => {
		const q = searchTerm.trim().toLowerCase();
		const minAmount = minAmountFilter ? Number(minAmountFilter) : null;
		const maxAmount = maxAmountFilter ? Number(maxAmountFilter) : null;
		const fromTs = approvedFrom ? new Date(`${approvedFrom}T00:00:00`).getTime() : null;
		const toTs = approvedTo ? new Date(`${approvedTo}T23:59:59`).getTime() : null;

		let list = (data.workOrders as any[]).filter((w: any) => {
			if (selectedStatuses.length > 0 && !selectedStatuses.includes(w.status)) return false;
			if (selectedSources.length > 0 && !selectedSources.includes(w.source)) return false;
			if (selectedProjects.length > 0 && projects.length > 0 && !selectedProjects.includes(w.projectName)) return false;

			const amount = Number(w.amount ?? 0);
			if (minAmount !== null && !Number.isNaN(minAmount) && amount < minAmount) return false;
			if (maxAmount !== null && !Number.isNaN(maxAmount) && amount > maxAmount) return false;

			if (qbFilter === 'recorded' && !w.qb_transaction_id) return false;
			if (qbFilter === 'missing' && w.qb_transaction_id) return false;

			if (fromTs !== null || toTs !== null) {
				const ts = w.approvedDate ? new Date(w.approvedDate).getTime() : 0;
				if (fromTs !== null && ts < fromTs) return false;
				if (toTs !== null && ts > toTs) return false;
			}

			if (q) {
				const haystack = [
					String(w.work_order_number ?? ''),
					String(w.projectName ?? ''),
					String(w.projectCode ?? ''),
					String(w.description ?? ''),
					String(w.status ?? ''),
					String(w.source ?? ''),
					String(w.qb_transaction_id ?? ''),
					String(w._vendor?.name ?? ''),
					String(w._claim?.referenceNumber ?? '')
				].join(' ').toLowerCase();
				if (!haystack.includes(q)) return false;
			}

			return true;
		});

		list = [...list].sort((a: any, b: any) => {
			switch (sortBy) {
				case 'approved_asc':
					return new Date(a.approvedDate ?? 0).getTime() - new Date(b.approvedDate ?? 0).getTime();
				case 'amount_desc':
					return Number(b.amount ?? 0) - Number(a.amount ?? 0);
				case 'amount_asc':
					return Number(a.amount ?? 0) - Number(b.amount ?? 0);
				case 'wo_az':
					return String(a.work_order_number ?? '').localeCompare(String(b.work_order_number ?? ''));
				case 'project_az':
					return String(a.projectName ?? '').localeCompare(String(b.projectName ?? ''));
				case 'status_az':
					return String(a.status ?? '').localeCompare(String(b.status ?? ''));
				case 'approved_desc':
				default:
					return new Date(b.approvedDate ?? 0).getTime() - new Date(a.approvedDate ?? 0).getTime();
			}
		});

		return list;
	});

	const filteredStats = $derived({
		open: filtered.filter((w: any) => w.status === 'open').length,
		paid: filtered.filter((w: any) => w.status === 'paid').length,
		cancelled: filtered.filter((w: any) => w.status === 'cancelled').length,
		totalAmount: filtered.reduce((s: number, w: any) => s + (w.amount || 0), 0),
		openAmount: filtered.filter((w: any) => w.status === 'open').reduce((s: number, w: any) => s + (w.amount || 0), 0),
	});

	function statusColor(s: string) {
		switch (s) {
			case 'open':      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
			case 'paid':      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
			case 'cancelled': return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
			default:          return 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
		}
	}

	async function copyWO(wo: string) {
		await navigator.clipboard.writeText(wo).catch(() => {});
		copied = wo;
		setTimeout(() => { copied = null; }, 1800);
	}

	function userName(u: any) {
		if (!u) return '—';
		return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '—';
	}

	function findBankAccountByLabel(label: string) {
		const normalizedLabel = String(label ?? '').trim().toLowerCase();
		if (!normalizedLabel) return null;

		return bankAccounts.find((account: any) => accountOptionLabel(account).toLowerCase() === normalizedLabel) ?? null;
	}

	function accountOptionLabel(account: any) {
		const code = String(account?.code ?? '').trim();
		const name = String(account?.name ?? '').trim();
		return code && name ? `${code} - ${name}` : name || code || 'Unknown account';
	}

	function isEventOperationsAccountLabel(label: string) {
		return String(label ?? '').trim().toLowerCase().includes(EVENT_OPERATIONS_ACCOUNT_KEY);
	}

	function generateInternalPaymentReference(woId: string) {
		const wo = (data.workOrders as any[]).find((item: any) => item.id === woId);
		const base = String(wo?.work_order_number ?? woId).replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase();
		const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
		return `EVOP-${base}-${stamp}`;
	}

	function generatePDF(wo: any) {
		const fmt2 = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);
		const escHtml = (v: any) => String(v ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
		const escAttr = (v: any) => String(v ?? '')
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;');
		const d = (s: string) => {
			if (!s) return '—';
			try {
				const dt = new Date(s);
				if (isNaN(dt.getTime())) return s;
				return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
			} catch { return s; }
		};
		const dt = (s: string) => {
			if (!s) return '—';
			try {
				const dt = new Date(s);
				if (isNaN(dt.getTime())) return s;
				return dt.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
			} catch { return s; }
		};

		const isReimb   = wo.source === 'reimbursement';
		const isExpense = wo.source === 'expense';
		const isGoalTask = wo.source === 'goal_task';
		const isBid     = wo.source === 'bid';
		const goalName = wo._goal?.goalName || wo._goal?.name || wo.projectName || '—';
		const goalDescription = (wo._goal?.description || wo._goal?.descriptionOfGoal || '').replace(/<[^>]*>/g, '');
		const goalProgress = wo._goal?.targetValue
			? `${wo._goal?.currentValue ?? 0} / ${wo._goal?.targetValue ?? 0}`
			: String(wo._goal?.currentValue ?? '—');
		const goalTaskTitle = wo._goalTask?.title || wo._expense?.description || wo.description || '—';
		const goalTaskDescription = (wo._goalTask?.description || '').replace(/<[^>]*>/g, '');

		const claimItems = (wo._claimItems ?? []).map((item: any) => `
			<tr>
				<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${item.description || '—'}</td>
				<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center">${item.category || '—'}</td>
				<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${item.vendor || '—'}</td>
				<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${d(item.date)}</td>
				<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${fmt2(item.amount)}</td>
			</tr>`).join('');

		const claimReceiptBlocks = (wo._claimItems ?? []).map((item: any, idx: number) => {
			const receipts = Array.isArray(item._receiptAssets) ? item._receiptAssets : [];
			if (receipts.length === 0) return '';

			const cards = receipts.map((asset: any, assetIdx: number) => {
				const fileName = escHtml(asset.filename || `receipt-${assetIdx + 1}`);
				const fileUrl = escAttr(asset.url || '#');
				if (asset.isImage) {
					const thumbUrl = escAttr(asset.thumbUrl || asset.url || '#');
					return `
					<div style="width:180px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff">
						<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;color:inherit">
							<img src="${thumbUrl}" alt="${fileName}" style="display:block;width:100%;height:120px;object-fit:cover;background:#edf2f7" />
							<div style="padding:8px 10px;font-size:11px;color:#4a5568;word-break:break-word">${fileName}</div>
						</a>
					</div>`;
				}

				if (asset.isPdf) {
					return `
					<div style="width:220px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;padding:10px 12px;display:flex;flex-direction:column;gap:6px">
						<div style="font-size:11px;font-weight:700;color:#2d3748">PDF Receipt</div>
						<div style="font-size:11px;color:#4a5568;word-break:break-word">${fileName}</div>
						<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#2b6cb0;text-decoration:underline">Open PDF</a>
					</div>`;
				}

				return `
				<div style="width:220px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;padding:10px 12px;display:flex;flex-direction:column;gap:6px">
					<div style="font-size:11px;font-weight:700;color:#2d3748">Attachment</div>
					<div style="font-size:11px;color:#4a5568;word-break:break-word">${fileName}</div>
					<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#2b6cb0;text-decoration:underline">Open file</a>
				</div>`;
			}).join('');

			return `
			<div style="margin-bottom:14px">
				<div style="font-size:12px;font-weight:700;color:#2d3748;margin-bottom:8px">Item ${idx + 1}: ${escHtml(item.description || 'Untitled item')}</div>
				<div style="display:flex;flex-wrap:wrap;gap:10px">${cards}</div>
			</div>`;
		}).join('');

		const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Work Order Audit Report — ${wo.work_order_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a202c; background: #fff; padding: 40px; font-size: 13px; }
  .header { border-bottom: 3px solid #1a202c; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
  .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .wo-number { font-size: 28px; font-weight: 800; color: #2d3748; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-paid { background: #c6f6d5; color: #276749; }
  .badge-open { background: #fefcbf; color: #744210; }
  .badge-reimb { background: #e9d8fd; color: #553c9a; }
  .badge-expense { background: #bee3f8; color: #2a4365; }
  .badge-bid { background: #feebc8; color: #7b341e; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #718096; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .field label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #a0aec0; display: block; margin-bottom: 2px; }
  .field span { font-size: 13px; color: #2d3748; font-weight: 500; }
  .amount-big { font-size: 32px; font-weight: 800; color: #276749; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f7fafc; padding: 8px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #718096; border-bottom: 2px solid #e2e8f0; }
  th:last-child, td:last-child { text-align: right; }
  .chain { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
  .chain-step { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; font-size: 12px; }
  .chain-step strong { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #a0aec0; margin-bottom: 2px; }
  .arrow { color: #a0aec0; font-size: 16px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #a0aec0; display: flex; justify-content: space-between; }
  .note { background: #fffbeb; border: 1px solid #f6e05e; border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #744210; margin-bottom: 16px; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">FLI Golf</div>
    <div style="color:#718096;font-size:12px;margin-top:2px">Work Order Audit Report</div>
  </div>
  <div style="text-align:right">
    <div class="wo-number">${wo.work_order_number}</div>
    <div style="margin-top:4px">
      <span class="badge ${wo.status === 'paid' ? 'badge-paid' : 'badge-open'}">${wo.status}</span>
      &nbsp;
	<span class="badge ${isReimb ? 'badge-reimb' : isBid ? 'badge-bid' : isGoalTask ? 'badge-open' : 'badge-expense'}">${isReimb ? 'Reimbursement' : isBid ? 'Bid Award' : isGoalTask ? 'Goal Task' : 'Expense'}</span>
    </div>
    <div style="color:#718096;font-size:11px;margin-top:6px">Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Payment Summary</div>
  <div class="grid3">
    <div class="field"><label>Total Amount</label><span class="amount-big">${fmt2(wo.amount)}</span></div>
    <div class="field"><label>Payment Method</label><span>${(wo.paymentMethod || '—').replace('_',' ')}</span></div>
    <div class="field"><label>Paid Date</label><span>${d(wo.paidDate)}</span></div>
  </div>
</div>

<div class="section">
  <div class="section-title">Audit Chain — How This Payment Was Authorized</div>
  <div class="chain">
    ${isReimb ? `
    <div class="chain-step"><strong>1. Submission</strong>${userName(wo._submittedBy)} submitted a reimbursement claim</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>2. Admin Review</strong>Claim reviewed &amp; approved by ${userName(wo._approver)}</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>3. Payment</strong>Marked paid · ${d(wo.paidDate)}</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>4. Work Order</strong>${wo.work_order_number} created for QuickBooks</div>
	` : isBid ? `
    <div class="chain-step"><strong>1. Bid Submitted</strong>${userName(wo._submittedBy)} submitted bid from ${wo._vendor?.name || '—'}</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>2. Shortlisted</strong>Bid moved to shortlist for committee review</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>3. Quorum Vote</strong>${wo._approvalVoters?.length ? wo._approvalVoters.length + ' voter(s) approved' : 'Approved by committee'}</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>4. Awarded</strong>Bid awarded · ${d(wo._bid?.awardedAt)}</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>5. Work Order</strong>${wo.work_order_number} created for QuickBooks</div>
	` : isGoalTask ? `
	<div class="chain-step"><strong>1. Goal Task</strong>${goalTaskTitle}</div>
	<span class="arrow">→</span>
	<div class="chain-step"><strong>2. Goal</strong>${goalName}</div>
	<span class="arrow">→</span>
	<div class="chain-step"><strong>3. Approval</strong>${wo._approval ? `Approved by ${userName(wo._approval?.expand?.approver)} on ${d(wo._approval?.reviewedDate)}` : 'Approved'}</div>
	<span class="arrow">→</span>
	<div class="chain-step"><strong>4. Work Order</strong>${wo.work_order_number} created for QuickBooks</div>
	` : `
    <div class="chain-step"><strong>1. Submission</strong>${userName(wo._submittedBy)} submitted an expense</div>
    <span class="arrow">→</span>
    <div class="chain-step"><strong>2. Approval</strong>${wo._approval ? `Approved by ${userName(wo._approval?.expand?.approver)} on ${d(wo._approval?.reviewedDate)}` : 'Approved'}</div>
    <span class="arrow">→</span>
    ${wo._task ? `<div class="chain-step"><strong>3. Task</strong>${wo._task?.title || '—'}</div><span class="arrow">→</span>` : ''}
    ${wo._project ? `<div class="chain-step"><strong>${wo._task ? '4' : '3'}. Project</strong>${wo._project?.name || '—'}</div><span class="arrow">→</span>` : ''}
    <div class="chain-step"><strong>Work Order</strong>${wo.work_order_number} created for QuickBooks</div>
    `}
  </div>
</div>

<div class="grid2">
  <div class="section">
    <div class="section-title">Submitted By</div>
    <div class="field"><label>Name</label><span>${userName(wo._submittedBy)}</span></div>
    ${wo._submittedBy?.email ? `<div class="field" style="margin-top:8px"><label>Email</label><span>${wo._submittedBy.email}</span></div>` : ''}
  </div>
  <div class="section">
    <div class="section-title">Approved By</div>
    <div class="field"><label>Name</label><span>${userName(wo._approver)}</span></div>
    <div class="field" style="margin-top:8px"><label>Approved Date</label><span>${d(wo.approvedDate)}</span></div>
  </div>
</div>

${isBid && wo._vendor ? `
<div class="section">
  <div class="section-title">Vendor</div>
  <div class="grid3">
    <div class="field"><label>Company</label><span>${wo._vendor.name || '—'}</span></div>
    <div class="field"><label>Contact</label><span>${wo._vendor.contactName || '—'}</span></div>
    <div class="field"><label>Email</label><span>${wo._vendor.email || '—'}</span></div>
  </div>
  ${(wo._vendor.phone || wo._vendor.address || wo._vendor.website) ? `
  <div class="grid3" style="margin-top:10px">
    <div class="field"><label>Phone</label><span>${wo._vendor.phone || '—'}</span></div>
    <div class="field"><label>Address</label><span>${wo._vendor.address || '—'}</span></div>
    <div class="field"><label>Website</label><span>${wo._vendor.website || '—'}</span></div>
  </div>` : ''}
</div>` : ''}

${isBid && wo._bid ? `
<div class="section">
  <div class="section-title">Bid Details</div>
  <div class="grid3">
    <div class="field"><label>Bid Amount</label><span style="font-size:18px;font-weight:800;color:#276749">${fmt2(wo._bid.amount)}</span></div>
    <div class="field"><label>Timeline</label><span>${wo._bid.timeline || '—'}</span></div>
    <div class="field"><label>Submitted</label><span>${d(wo._bid.submittedAt)}</span></div>
  </div>
  ${wo._bid.scope ? `<div class="note" style="margin-top:12px"><strong>Scope:</strong> ${wo._bid.scope}</div>` : ''}
  ${wo._bid.notes ? `<div class="note" style="margin-top:8px">${wo._bid.notes}</div>` : ''}
</div>` : ''}

${isBid && wo._approvalVoters?.length ? `
<div class="section">
  <div class="section-title">Approval Voters (${wo._approvalVoters.length})</div>
  <table>
    <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
    <tbody>
      ${wo._approvalVoters.map((v: any) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${[v.firstName, v.lastName].filter(Boolean).join(' ') || v.email || '—'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${v.email || '—'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${v.role || '—'}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

${wo._project || wo._task ? `
<div class="section">
  <div class="section-title">Project / Task Reference</div>
  <div class="grid2">
    ${wo._project ? `<div class="field"><label>Project</label><span>${wo._project?.name || '—'}</span></div>` : ''}
    ${wo._task ? `<div class="field"><label>Task</label><span>${wo._task?.title || '—'}</span></div>` : ''}
  </div>
</div>` : ''}

${isGoalTask ? `
<div class="section">
	<div class="section-title">Goal Reference</div>
	<div class="grid3">
		<div class="field"><label>Goal</label><span>${goalName}</span></div>
		<div class="field"><label>Status</label><span>${wo._goal?.status || '—'}</span></div>
		<div class="field"><label>Priority</label><span>${wo._goal?.priority || wo._goalTask?.priority || '—'}</span></div>
	</div>
	<div class="grid3" style="margin-top:10px">
		<div class="field"><label>Category</label><span>${wo._goal?.category || '—'}</span></div>
		<div class="field"><label>Deadline</label><span>${d(wo._goal?.deadline || wo._goal?.dueDate || wo._goalTask?.dueDate)}</span></div>
		<div class="field"><label>Progress</label><span>${goalProgress}</span></div>
	</div>
	${(wo._goal?.targetMetric || wo._goal?.responsiblePerson || wo._goal?.progressMode) ? `
	<div class="grid3" style="margin-top:10px">
		<div class="field"><label>Target Metric</label><span>${wo._goal?.targetMetric || '—'}</span></div>
		<div class="field"><label>Responsible</label><span>${wo._goal?.responsiblePerson || '—'}</span></div>
		<div class="field"><label>Progress Mode</label><span>${String(wo._goal?.progressMode || '—').replace('_',' ')}</span></div>
	</div>` : ''}
	${goalDescription ? `<div class="note" style="margin-top:12px"><strong>Goal Summary:</strong> ${goalDescription}</div>` : ''}
</div>

<div class="section">
	<div class="section-title">Goal Task Detail</div>
	<div class="grid3">
		<div class="field"><label>Task</label><span>${goalTaskTitle}</span></div>
		<div class="field"><label>Task Status</label><span>${wo._goalTask?.status || '—'}</span></div>
		<div class="field"><label>Task Due Date</label><span>${d(wo._goalTask?.dueDate)}</span></div>
	</div>
	<div class="grid3" style="margin-top:10px">
		<div class="field"><label>Estimated Cost</label><span>${fmt2(wo._goalTask?.estimatedCost)}</span></div>
		<div class="field"><label>Actual Cost</label><span>${fmt2(wo._goalTask?.actualCost)}</span></div>
		<div class="field"><label>Contribution</label><span>${wo._goalTask?.progressContribution ?? '—'}</span></div>
	</div>
	${goalTaskDescription ? `<div class="note" style="margin-top:12px"><strong>Task Summary:</strong> ${goalTaskDescription}</div>` : ''}
	${wo._goalTask?.notes ? `<div class="note" style="margin-top:8px">${String(wo._goalTask.notes).replace(/<[^>]*>/g,'')}</div>` : ''}
</div>` : ''}

${isReimb && wo._claim ? `
<div class="section">
  <div class="section-title">Reimbursement Claim — ${wo._claim?.title || ''}</div>
  <div class="grid3" style="margin-bottom:12px">
    <div class="field"><label>Reference</label><span>${wo._claim?.referenceNumber || '—'}</span></div>
    <div class="field"><label>Status</label><span>${wo._claim?.status || '—'}</span></div>
    <div class="field"><label>Total</label><span>${fmt2(wo._claim?.totalAmount)}</span></div>
  </div>
  ${claimItems ? `
  <table>
    <thead><tr><th>Description</th><th>Category</th><th>Vendor</th><th>Date</th><th>Amount</th></tr></thead>
    <tbody>${claimItems}</tbody>
    <tfoot><tr>
      <td colspan="4" style="padding:8px;font-weight:700;border-top:2px solid #2d3748">Total</td>
      <td style="padding:8px;font-weight:800;text-align:right;border-top:2px solid #2d3748;color:#276749">${fmt2(wo._claim?.totalAmount)}</td>
    </tr></tfoot>
  </table>` : ''}
  ${wo._claim?.notes ? `<div class="note" style="margin-top:12px">Notes: ${wo._claim.notes}</div>` : ''}
</div>` : ''}

${isReimb && claimReceiptBlocks ? `
<div class="section">
	<div class="section-title">Receipts &amp; Supporting Files</div>
	${claimReceiptBlocks}
</div>` : ''}

${isExpense && wo._expense ? `
<div class="section">
  <div class="section-title">Expense Detail</div>
  <div class="grid3">
    <div class="field"><label>Description</label><span>${wo._expense?.description || '—'}</span></div>
    <div class="field"><label>Category</label><span>${wo._expense?.category || '—'}</span></div>
    <div class="field"><label>Date</label><span>${d(wo._expense?.date)}</span></div>
  </div>
  ${wo._expense?.notes ? `<div class="note" style="margin-top:12px">${wo._expense.notes.replace(/<[^>]*>/g,'')}</div>` : ''}
</div>` : ''}

${isBid && wo._expense ? `
<div class="section">
  <div class="section-title">Linked Expense</div>
  <div class="grid3">
    <div class="field"><label>Description</label><span>${wo._expense?.description || '—'}</span></div>
    <div class="field"><label>Category</label><span>${wo._expense?.category || '—'}</span></div>
    <div class="field"><label>Status</label><span>${wo._expense?.status || '—'}</span></div>
  </div>
  ${wo._expense?.notes ? `<div class="note" style="margin-top:12px">${wo._expense.notes.replace(/<[^>]*>/g,'')}</div>` : ''}
</div>` : ''}

${wo._approval ? `
<div class="section">
  <div class="section-title">Approval Record</div>
  <div class="grid3">
    <div class="field"><label>Status</label><span>${wo._approval?.status || '—'}</span></div>
    <div class="field"><label>Requested</label><span>${d(wo._approval?.requestedDate)}</span></div>
    <div class="field"><label>Reviewed</label><span>${d(wo._approval?.reviewedDate)}</span></div>
  </div>
  ${wo._approval?.comments ? `<div class="note" style="margin-top:12px">${wo._approval.comments.replace(/<[^>]*>/g,'')}</div>` : ''}
</div>` : ''}

${wo.notes ? `
<div class="section">
  <div class="section-title">Notes</div>
  <div class="note">${wo.notes}</div>
</div>` : ''}

<p style="margin:4px 0 10px;color:#475569;font-size:12px;font-weight:600">A WO means it is ready to pay out from the Event Operations Account.</p>

<div class="section" style="border:2px solid ${wo.qb_transaction_id ? '#276749' : '#e2e8f0'};border-radius:8px;padding:16px;background:${wo.qb_transaction_id ? '#f0fff4' : '#fffbeb'}">
  <div class="section-title" style="color:${wo.qb_transaction_id ? '#276749' : '#744210'}">QuickBooks Entry ${wo.qb_transaction_id ? '— Recorded' : '— Pending'}</div>
  ${wo.qb_transaction_id ? `
  <div class="grid3">
    <div class="field"><label>QB Transaction ID</label><span style="font-size:18px;font-weight:800;color:#276749">${wo.qb_transaction_id}</span></div>
    <div class="field"><label>QB Account</label><span>${wo.qb_account || '—'}</span></div>
    <div class="field"><label>Date Entered</label><span>${d(wo.qb_entered_date)}</span></div>
  </div>
  ${wo._qbEnteredBy ? `<div class="field" style="margin-top:8px"><label>Entered By</label><span>${userName(wo._qbEnteredBy)}</span></div>` : wo.qb_entered_by ? `<div class="field" style="margin-top:8px"><label>Entered By</label><span>${wo.qb_entered_by}</span></div>` : ''}
  ${wo.qb_notes ? `<div class="note" style="margin-top:10px;background:#c6f6d5;border-color:#9ae6b4;color:#276749">${wo.qb_notes}</div>` : ''}
  ` : `
	  <p style="color:#744210;font-size:12px">⚠️ This work order has already moved through the payout pipeline. Finance can now manually enter the payment in QuickBooks using the WO number, total amount, and payment manifest below. No approval action is needed on this page.</p>
  `}
</div>

<div class="footer">
  <span>FLI Golf — Confidential Financial Document</span>
  <span>${wo.work_order_number} · Generated ${new Date().toISOString()}</span>
</div>

</body>
</html>`;

		const win = window.open('', '_blank');
		if (!win) return;
		win.document.write(html);
		win.document.close();
		win.focus();
		setTimeout(() => win.print(), 900);
	}

	async function markPaid(woId: string, expenseId: string) {
		markingPaid = woId;
		try {
			const res = await fetch('/api/expenses', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ expenseId, status: 'paid', paidDate: new Date().toISOString() })
			});
			if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
			await invalidateAll();
		} catch (e: any) {
			alert('Failed to mark paid: ' + e.message);
		} finally {
			markingPaid = null;
		}
	}
</script>

<svelte:head><title>Work Orders — FliHub</title></svelte:head>

<div class="flex flex-col gap-6">

	<!-- Header -->
	<div>
		<h1 class="text-4xl font-bold mb-1 tracking-tight">Work Orders</h1>
		<p class="text-muted-foreground">Work orders ready for manual QuickBooks payment processing</p>
	</div>

	<!-- About this page -->
	<div class="rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden">
		<button onclick={() => showAbout = !showAbout}
			class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/30 transition-colors text-left">
			<div class="flex items-center gap-2.5">
				<Info class="size-4 text-slate-400 shrink-0" />
				<span class="text-sm font-medium text-slate-300">About this page &amp; how work orders are created</span>
			</div>
			<ChevronDown class="size-4 text-slate-500 transition-transform {showAbout ? 'rotate-180' : ''}" />
		</button>

		{#if showAbout}
		<div class="border-t border-slate-700 px-5 py-5 space-y-5 text-sm text-slate-300">

			<div class="space-y-1.5">
				<p class="text-xs font-bold uppercase tracking-wide text-slate-400">What is a Work Order?</p>
				<p>A Work Order (WO) is the single authoritative record of a payout batch made by FLI Golf. When a WO exists, the payout has already moved through the internal pipeline and finance can manually enter it in QuickBooks. The WO number is the reference used for that entry, and it is stamped on every related record so the payment can be fully traced from origin to settlement.</p>
			</div>

			<div class="space-y-3">
				<p class="text-xs font-bold uppercase tracking-wide text-slate-400">How Work Orders Are Created</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div class="rounded-lg border border-blue-700/40 bg-blue-950/20 p-4 space-y-2">
						<p class="text-xs font-bold text-blue-300 uppercase tracking-wide">Path 1 — Expense Approval</p>
						<div class="flex flex-col gap-1.5 text-xs text-slate-400">
							{#each [
								['Submitted', 'Team member submits an expense linked to a task'],
								['Approval queue', 'Expense appears in /dashboard/approvals for admin review'],
								['Approved', 'Admin approves and the payout is authorized'],
								['Work Order created', 'WO number stamped on expense, task, and work_orders record'],
								['QuickBooks', 'Finance manually enters the payment using the WO number'],
							] as [step, desc], i}
								<div class="flex items-start gap-2">
									<span class="size-5 rounded-full bg-blue-900/60 text-blue-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
									<span><strong class="text-slate-200">{step}</strong> — {desc}</span>
								</div>
							{/each}
						</div>
					</div>
					<div class="rounded-lg border border-violet-700/40 bg-violet-950/20 p-4 space-y-2">
						<p class="text-xs font-bold text-violet-300 uppercase tracking-wide">Path 2 — Reimbursement Claim</p>
						<div class="flex flex-col gap-1.5 text-xs text-slate-400">
							{#each [
								['New Claim', 'Team member creates a claim with line items and receipts'],
								['Submitted → Under Review → Approved', 'CPA reviews for tax compliance, admin approves'],
								['Paid', 'Admin marks paid — WO number stamped on claim and all line items, department budget debited'],
								['Work Order created', 'Electronic payment record created — Ina uses the WO number to enter the payment in QuickBooks'],
								['QB Entry', 'Ina records the QuickBooks transaction ID, account, and date on the Work Order'],
								['Expense submitted', 'An Expense record (category: Reimbursement) is automatically created and submitted to the approval pipeline'],
								['Expense approved', 'Final approval in the expenses pipeline — audit chain complete'],
							] as [step, desc], i}
								<div class="flex items-start gap-2">
									<span class="size-5 rounded-full bg-violet-900/60 text-violet-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
									<span><strong class="text-slate-200">{step}</strong> — {desc}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="space-y-2">
				<p class="text-xs font-bold uppercase tracking-wide text-slate-400">Complete Audit Chain</p>
				<p class="text-xs text-slate-400 leading-relaxed">Every paid reimbursement produces <strong class="text-slate-200">three linked records</strong> — all required for a complete audit trail:</p>
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
					<div class="rounded-lg border border-violet-700/40 bg-violet-950/20 p-3 space-y-1">
						<p class="font-semibold text-violet-300">1. Reimbursement Claim</p>
						<p class="text-slate-400">The original request — claimant, line items, receipts, CPA review. WO number stamped when paid.</p>
					</div>
					<div class="rounded-lg border border-blue-700/40 bg-blue-950/20 p-3 space-y-1">
						<p class="font-semibold text-blue-300">2. Work Order</p>
						<p class="text-slate-400">The payment authorization record. Ina uses the WO number to enter the payment in QuickBooks. QB transaction ID recorded here.</p>
					</div>
					<div class="rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-3 space-y-1">
						<p class="font-semibold text-emerald-300">3. Expense (Reimbursement)</p>
						<p class="text-slate-400">Created automatically when QB entry is saved. Goes through the approval pipeline — final approval settles the payment in the financial record.</p>
					</div>
				</div>
				<p class="text-xs text-slate-500">Click <strong class="text-slate-400">Audit Report</strong> on any row to generate a PDF of the complete chain — suitable for IRS audit, QuickBooks reconciliation, or internal review.</p>
			</div>

		</div>
		{/if}
	</div>

	<!-- Stat cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Open</p>
					<p class="text-2xl font-bold">{filteredStats.open}</p>
					<p class="text-xs text-amber-400 mt-1">{fmt(filteredStats.openAmount)}</p>
				</div>
				<Clock class="size-8 text-amber-500 opacity-40" />
			</div>
		</Card>
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Paid</p>
					<p class="text-2xl font-bold">{filteredStats.paid}</p>
				</div>
				<CheckCircle2 class="size-8 text-emerald-500 opacity-40" />
			</div>
		</Card>
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Cancelled</p>
					<p class="text-2xl font-bold">{filteredStats.cancelled}</p>
				</div>
				<XCircle class="size-8 text-slate-500 opacity-40" />
			</div>
		</Card>
		<Card class="p-5">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Total Amount</p>
					<p class="text-2xl font-bold">{fmt(filteredStats.totalAmount)}</p>
					<p class="text-xs text-muted-foreground mt-1">{filtered.length} of {data.workOrders.length}</p>
				</div>
				<DollarSign class="size-8 text-blue-500 opacity-40" />
			</div>
		</Card>
	</div>

	<!-- Filters -->
	<Card class="p-4">
		<div class="space-y-4">
			<div class="flex flex-wrap items-end gap-3">
				<div class="min-w-[240px] flex-1">
					<label class="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Search</label>
					<input
						bind:value={searchTerm}
						placeholder="WO #, project, description, QB ID, vendor"
						class="w-full px-3 py-2 border rounded-lg bg-background text-sm"
					/>
				</div>
				<div class="w-36">
					<label class="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Min Amount</label>
					<input bind:value={minAmountFilter} type="number" min="0" placeholder="0" class="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
				</div>
				<div class="w-36">
					<label class="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Max Amount</label>
					<input bind:value={maxAmountFilter} type="number" min="0" placeholder="No max" class="w-full px-3 py-2 border rounded-lg bg-background text-sm" />
				</div>
				<div class="w-44">
					<label class="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Approved From</label>
					<input bind:value={approvedFrom} type="date" class="w-full px-3 py-2 border rounded-lg bg-background text-sm [color-scheme:dark]" />
				</div>
				<div class="w-44">
					<label class="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Approved To</label>
					<input bind:value={approvedTo} type="date" class="w-full px-3 py-2 border rounded-lg bg-background text-sm [color-scheme:dark]" />
				</div>
				<div class="w-44">
					<label class="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">QB Entry</label>
					<select bind:value={qbFilter} class="w-full px-3 py-2 border rounded-lg bg-background text-sm">
						<option value="all">All</option>
						<option value="recorded">Recorded in QB</option>
						<option value="missing">Missing QB entry</option>
					</select>
				</div>
				<div class="w-48">
					<label class="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Sort</label>
					<select bind:value={sortBy} class="w-full px-3 py-2 border rounded-lg bg-background text-sm">
						<option value="approved_desc">Newest approved</option>
						<option value="approved_asc">Oldest approved</option>
						<option value="amount_desc">Amount high → low</option>
						<option value="amount_asc">Amount low → high</option>
						<option value="wo_az">WO number A → Z</option>
						<option value="project_az">Project A → Z</option>
						<option value="status_az">Status A → Z</option>
					</select>
				</div>
				<button type="button" onclick={clearFilters} class="px-3 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:border-slate-400 hover:text-slate-100 transition-colors">Clear Filters</button>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs text-slate-400 uppercase tracking-wide mr-1">Status</span>
				{#each STATUS_OPTIONS as status}
					<button
						type="button"
						onclick={() => toggleStatus(status)}
						class={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedStatuses.includes(status)
							? statusColor(status)
							: 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'}`}
					>
						{status}
					</button>
				{/each}
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs text-slate-400 uppercase tracking-wide mr-1">Source</span>
				{#each SOURCE_OPTIONS as source}
					<button
						type="button"
						onclick={() => toggleSource(source)}
						class={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedSources.includes(source)
							? 'bg-violet-900/40 text-violet-300 border-violet-700/50'
							: 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'}`}
					>
						{source}
					</button>
				{/each}
			</div>

			{#if projects.length > 0}
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-xs text-slate-400 uppercase tracking-wide mr-1">Projects</span>
				{#each projects as p}
					<button
						type="button"
						onclick={() => toggleProject(p)}
						class={`text-xs px-2.5 py-1 rounded-full border transition-colors ${selectedProjects.includes(p)
							? 'bg-blue-900/40 text-blue-300 border-blue-700/50'
							: 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'}`}
					>
						{p}
					</button>
				{/each}
			</div>
			{/if}

			<p class="text-sm text-muted-foreground">Showing {filtered.length} of {data.workOrders.length}</p>
		</div>
	</Card>

	<!-- Table -->
	{#if filtered.length === 0}
		<Card class="p-10 text-center">
			<ClipboardList class="size-10 text-slate-600 mx-auto mb-3" />
			{#if data.workOrders.length === 0}
				<p class="text-muted-foreground">No work orders yet. They are created automatically when an expense is approved.</p>
			{:else}
				<p class="text-muted-foreground">No work orders match these filters.</p>
				<div class="mt-3">
					<button
						type="button"
						onclick={clearFilters}
						class="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 text-sm hover:border-slate-400 hover:text-slate-100 transition-colors"
					>
						Clear Filters
					</button>
				</div>
			{/if}
		</Card>
	{:else}
		<Card class="overflow-hidden p-0">

			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-slate-700 bg-slate-800/50">
							<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">WO #</th>
							<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Project</th>
							<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</th>
							<th class="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
							<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Approved</th>
							<th class="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800">
						{#each filtered as wo (wo.id)}
							<tr class="hover:bg-slate-800/30 transition-colors">
								<!-- WO Number — copy to clipboard -->
								<td class="px-4 py-3">
									<button
										type="button"
										onclick={() => copyWO(wo.work_order_number)}
										class="flex items-center gap-1.5 font-mono font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group"
										title="Copy to clipboard"
									>
										{wo.work_order_number}
										{#if copied === wo.work_order_number}
											<Check class="size-3.5 text-emerald-400" />
										{:else}
											<Copy class="size-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
										{/if}
									</button>
								</td>
								<td class="px-4 py-3">
									<div class="font-medium text-slate-200 truncate max-w-[160px]">{wo.projectName || '—'}</div>
									<div class="text-xs text-slate-500">{wo.projectCode}</div>
								</td>
								<td class="px-4 py-3 text-slate-300 max-w-[200px] truncate">{wo.description || '—'}</td>
								<td class="px-4 py-3 text-right font-semibold tabular-nums text-slate-100">{fmt(wo.amount)}</td>
								<td class="px-4 py-3 text-slate-400 text-xs">{fmtDate(wo.approvedDate)}</td>
								<td class="px-4 py-3">
									<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {statusColor(wo.status)}">
										{wo.status}
									</span>
								</td>

								<td class="px-4 py-3">
									<div class="flex items-center gap-2 flex-wrap">
										<!-- QB entry button — shown when no QB txn yet -->
										{#if !wo.qb_transaction_id}
											<button
												type="button"
												onclick={() => expandedQB = expandedQB === wo.id ? null : wo.id}
												class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-900/40 border border-blue-700/40 text-blue-300 hover:bg-blue-900/60 transition-colors whitespace-nowrap"
											>
												<DollarSign class="size-3.5" /> Record in QB
											</button>
										{:else}
											<span class="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-emerald-900/30 border border-emerald-700/30 text-emerald-400 font-mono">
												<CheckCircle2 class="size-3" /> {wo.qb_transaction_id}
											</span>
											<button
												type="button"
												onclick={() => expandedQB = expandedQB === wo.id ? null : wo.id}
												class="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2"
											>edit</button>
										{/if}
										<button
											type="button"
											onclick={() => generatePDF(wo)}
											class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-600/50 text-slate-300 hover:bg-slate-600/60 hover:text-slate-100 transition-colors whitespace-nowrap"
										>
											<FileDown class="size-3.5" /> Audit Report
										</button>
									</div>
								</td>
							</tr>

							<!-- QB entry panel -->
							{#if expandedQB === wo.id}
							{@const f = qbForms[wo.id] ?? { txnId:'', enteredBy:'', enteredDate: new Date().toISOString().slice(0,10), account:'', accountId:'', notes:'' }}
							{@const selectedAccount = bankAccounts.find((account: any) => account.id === f.accountId) ?? findBankAccountByLabel(f.account)}
							{@const selectedAccountLabel = selectedAccount ? accountOptionLabel(selectedAccount) : String(f.account ?? '').trim()}
							{@const accountGateOpen = isEventOperationsAccountLabel(selectedAccountLabel)}
							<tr class="bg-blue-950/20 border-b border-blue-800/30">
								<td colspan="8" class="px-6 py-4">
									<div class="max-w-3xl space-y-3">
										<p class="text-xs font-bold text-blue-300 uppercase tracking-wide flex items-center gap-2">
											<DollarSign class="size-3.5" /> QuickBooks Transaction Entry
										</p>
										<p class="text-xs text-slate-400">Select the payout account first. If the Event Operations Account is selected, the payout fields unlock and the payment can be generated for QuickBooks.</p>
										{#if !accountGateOpen}
											<div class="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3">
												<p class="text-xs font-semibold text-amber-300">Event Operations Account required</p>
												<p class="text-xs text-amber-200/80 mt-1">Choose Event Operations Account to unlock the payout fields and generate the payment reference.</p>
											</div>
										{:else}
											<div class="rounded-lg border border-emerald-700/50 bg-emerald-950/30 p-3">
												<p class="text-xs font-semibold text-emerald-300">Event Operations Account selected</p>
												<p class="text-xs text-emerald-200/80 mt-1">The payout is ready to generate. A system reference will be assigned if you leave the QB transaction field blank.</p>
											</div>
										{/if}

										<!-- Expense preview — reimbursement WOs only -->
										{#if wo.source === 'reimbursement' && !wo.expense}
										<div class="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 space-y-1.5">
											<p class="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
												<Receipt class="size-3.5" /> This will also create an Expense record for approval
											</p>
											<p class="text-xs text-amber-200/70 leading-relaxed">
												Saving this QB entry will automatically submit an <strong class="text-amber-200">Expense</strong> record to the approval pipeline. The expense will appear in <a href="/dashboard/approvals" class="underline underline-offset-2 hover:text-amber-100">Approvals</a> with status <strong class="text-amber-200">Pending</strong> — it must be approved there before the payment is fully settled in the financial record.
											</p>
											<div class="mt-2 rounded border border-amber-800/40 bg-slate-900/60 p-2.5 text-[11px] font-mono space-y-0.5 text-slate-300">
												<p><span class="text-slate-500">description:</span> Reimbursement — {wo.description} ({wo.work_order_number})</p>
												<p><span class="text-slate-500">amount:</span> {fmt(wo.amount)}</p>
												<p><span class="text-slate-500">category:</span> Reimbursement</p>
												<p><span class="text-slate-500">status:</span> <span class="text-amber-400">submitted → pending approval</span></p>
												<p><span class="text-slate-500">invoice #:</span> {wo.work_order_number}</p>
												<p><span class="text-slate-500">notes:</span> QB Transaction: {f.txnId || '<txn id>'}{f.account ? ` · Account: ${f.account}` : ''}</p>
											</div>
										</div>
										{:else if wo.source === 'reimbursement' && wo.expense}
										<div class="rounded-lg border border-emerald-700/50 bg-emerald-950/30 p-3 flex items-center gap-2">
											<CheckCircle2 class="size-4 text-emerald-400 shrink-0" />
											<p class="text-xs text-emerald-300">Expense already created for this work order — updating QB details only.</p>
										</div>
										{/if}
										<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
											<div>
												<label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">QB Account</label>
												{#if bankAccounts.length > 0}
													<select bind:value={f.accountId}
														class="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
														<option value="">Select bank account</option>
														{#each bankAccounts as account}
															<option value={account.id}>{accountOptionLabel(account)}</option>
														{/each}
													</select>
												{:else}
													<input bind:value={f.account} placeholder="e.g. 1000 - Operating Checking"
														class="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600" />
												{/if}
											</div>
											<div>
												<label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">QB Transaction ID *</label>
												<input bind:value={f.txnId} placeholder="Auto-generated if blank"
													disabled={!accountGateOpen}
													class="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 disabled:opacity-50" />
											</div>
											<div>
												<label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Date Entered in QB</label>
												<input type="date" bind:value={f.enteredDate}
													disabled={!accountGateOpen}
													class="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark] disabled:opacity-50" />
											</div>
											<div>


												<label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Entered By</label>
												<p class="text-xs text-slate-400 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800/50">You (set automatically)</p>
											</div>
										</div>
										<div>
											<label class="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">QB Notes</label>
											<input bind:value={f.notes} placeholder="Any additional notes for the QB entry…"
												disabled={!accountGateOpen}
												class="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 disabled:opacity-50" />
										</div>
										<div class="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-400">
											<span class="font-semibold text-slate-300">Internal reference:</span> {f.txnId.trim() || 'generated automatically on save'}
										</div>
										<div class="flex items-center gap-3 pt-1">
											<button onclick={() => saveQB(wo.id)} disabled={savingQB === wo.id || !accountGateOpen}
												class="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-blue-700/60 border border-blue-600/50 text-blue-100 hover:bg-blue-700/80 transition-colors disabled:opacity-50 font-semibold">
												{savingQB === wo.id ? 'Saving…' : 'Generate Payment & Save QB Entry'}
											</button>
											<button onclick={() => expandedQB = null}
												class="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2">Cancel</button>
										</div>
										{#if qbResult && qbResult.woId === wo.id && qbResult.warning}
											<div class="rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
												{qbResult.warning}
											</div>
										{/if}
									</div>
								</td>
							</tr>
							{/if}

						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{/if}
</div>
