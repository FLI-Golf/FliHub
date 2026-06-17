<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		PartyPopper,
		ArrowRight,
		Info,
		ChevronDown,
		Calendar,
		MapPin,
		Users,
		ListTodo,
		AlertCircle,
		DollarSign,
		Wallet,
		Trophy,
		Star,
		SlidersHorizontal,
		RefreshCw,
		CheckCircle2,
		FilterX,
		FileDown,
		Package,
		Send,
		HandCoins,
		Database,
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const cards = $derived(data.cards ?? []);
	const canManageActions = $derived(Boolean(data.canManageActions));
	const totals = $derived(data.totals ?? {
		totalEvents: 0,
		scheduled: 0,
		inProgress: 0,
		completed: 0,
		totalBudget: 0,
		totalPaid: 0,
		totalPending: 0,
		pendingApprovals: 0
	});
	const bundleSummary = $derived(data.bundleSummary ?? {
		total: 0,
		draft: 0,
		posted: 0,
		paid: 0,
		directUnbundledCount: 0,
		directUnbundledPaymentIds: [],
		bundles: []
	});
	const bundles = $derived((bundleSummary.bundles ?? []) as any[]);

	function parseSnapshot(value: unknown) {
		if (typeof value !== 'string' || value.trim() === '') return null;
		try {
			return JSON.parse(value);
		} catch {
			return value;
		}
	}

	let headerExpanded = $state(false);
	let statusFilter = $state('all');
	let typeFilter = $state('all');
	let dateFilter = $state('all');
	let search = $state('');
	let runningAction = $state<Record<string, { generate: boolean; complete: boolean }>>({});
	let actionMessage = $state('');
	let actionTone = $state<'success' | 'error'>('success');
	let generatingReport = $state(false);
	let bundleBusy = $state<{ creating: boolean; posting: string | null; paying: string | null }>({
		creating: false,
		posting: null,
		paying: null
	});
	let verifyingCollection = $state(false);
	let selectedBundleId = $state<string | null>(null);

	$effect(() => {
		if (!selectedBundleId && bundles.length > 0) {
			selectedBundleId = String(bundles[0].id);
		}
		if (selectedBundleId && !bundles.some((bundle: any) => String(bundle.id) === selectedBundleId)) {
			selectedBundleId = bundles.length > 0 ? String(bundles[0].id) : null;
		}
	});

	const selectedBundle = $derived(
		bundles.find((bundle: any) => String(bundle.id) === selectedBundleId) ?? null
	);

	const departmentBudget = $derived(data.departmentBudget ?? {
		id: null,
		name: 'Operations',
		annualBudget: 0,
		actualExpenses: 0,
		availableBalance: 0,
		utilizationPct: 0,
		warningLevel: 'normal'
	});
	const availableStatuses = $derived(
		Array.from(new Set(cards.map((event: any) => String(event.status || 'draft')))).sort()
	);

	const availableTypes = $derived(
		Array.from(new Set(cards.map((event: any) => String(event.eventType || 'other')))).sort()
	);

	function isUpcoming(dateText: string | null | undefined) {
		if (!dateText) return false;
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const date = new Date(dateText);
		date.setHours(0, 0, 0, 0);
		return date.getTime() >= now.getTime();
	}

	function isWithinDays(dateText: string | null | undefined, days: number) {
		if (!dateText) return false;
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const end = new Date(now);
		end.setDate(end.getDate() + days);
		const date = new Date(dateText);
		date.setHours(0, 0, 0, 0);
		return date.getTime() >= now.getTime() && date.getTime() <= end.getTime();
	}

	const filteredCards = $derived(
		cards.filter((event: any) => {
			const q = search.trim().toLowerCase();
			const qMatch = q.length === 0
				|| String(event.name ?? '').toLowerCase().includes(q)
				|| String(event.location ?? '').toLowerCase().includes(q)
				|| String(event.tournamentName ?? '').toLowerCase().includes(q)
				|| typeLabel(String(event.eventType ?? '')).toLowerCase().includes(q);

			const statusMatch = statusFilter === 'all' || event.status === statusFilter;
			const typeMatch = typeFilter === 'all' || event.eventType === typeFilter;

			let dateMatch = true;
			if (dateFilter === 'upcoming') dateMatch = isUpcoming(event.eventDate);
			if (dateFilter === 'next30') dateMatch = isWithinDays(event.eventDate, 30);
			if (dateFilter === 'past') dateMatch = !isUpcoming(event.eventDate);

			return qMatch && statusMatch && typeMatch && dateMatch;
		})
	);

	const filteredTotals = $derived({
		totalPaid: filteredCards.reduce((sum: number, event: any) => sum + (event.spend?.paid ?? 0), 0),
		totalPending: filteredCards.reduce((sum: number, event: any) => sum + (event.spend?.pending ?? 0), 0),
		estimatedTaskCost: filteredCards.reduce((sum: number, event: any) => sum + (event.spend?.estimatedTaskCost ?? 0), 0),
		actualTaskCost: filteredCards.reduce((sum: number, event: any) => sum + (event.spend?.actualTaskCost ?? 0), 0),
	});

	function clearFilters() {
		statusFilter = 'all';
		typeFilter = 'all';
		dateFilter = 'all';
		search = '';
	}

	function buildReportUrl() {
		const query = new URLSearchParams();
		if (statusFilter !== 'all') query.set('status', statusFilter);
		if (typeFilter !== 'all') query.set('type', typeFilter);
		if (dateFilter !== 'all') query.set('date', dateFilter);
		if (search.trim()) query.set('search', search.trim());
		return `/api/events/report?${query.toString()}`;
	}

	async function downloadDailyReport() {
		actionMessage = '';
		generatingReport = true;

		try {
			const res = await fetch(buildReportUrl(), { method: 'GET' });
			if (!res.ok) {
				const text = await res.text().catch(() => '');
				throw new Error(text || `Failed (${res.status})`);
			}

			const blob = await res.blob();
			const fileName = `events-daily-report-${new Date().toISOString().slice(0, 10)}.pdf`;
			const objectUrl = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = objectUrl;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);

			actionTone = 'success';
			actionMessage = 'Daily events PDF report downloaded.';
		} catch (err: any) {
			actionTone = 'error';
			actionMessage = err?.message ?? 'Failed to generate PDF report.';
		} finally {
			generatingReport = false;
		}
	}

	async function generatePayments(eventId: string) {
		if (!canManageActions) return;
		actionMessage = '';
		runningAction = {
			...runningAction,
			[eventId]: { ...(runningAction[eventId] ?? { generate: false, complete: false }), generate: true }
		};

		try {
			const res = await fetch(`/api/events/${eventId}/payments/generate`, { method: 'POST' });
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body?.message ?? `Failed (${res.status})`);

			actionTone = 'success';
			const autoAssigned = Number(body?.bundleAssignment?.assigned ?? 0);
			actionMessage = autoAssigned > 0
				? `${body?.message ?? 'Payments generated.'} Auto-assigned ${autoAssigned} direct payments to draft bundles.`
				: (body?.message ?? 'Payments generated.');
			await invalidateAll();
		} catch (err: any) {
			actionTone = 'error';
			actionMessage = err?.message ?? 'Failed to generate payments.';
		} finally {
			runningAction = {
				...runningAction,
				[eventId]: { ...(runningAction[eventId] ?? { generate: false, complete: false }), generate: false }
			};
		}
	}

	async function createDraftBundleFromQueue() {
		if (!canManageActions) return;
		const ids = (bundleSummary.directUnbundledPaymentIds ?? []).slice(0, 25);
		if (!ids.length) {
			actionTone = 'error';
			actionMessage = 'No direct pending payments are available for bundling.';
			return;
		}

		bundleBusy = { ...bundleBusy, creating: true };
		actionMessage = '';
		try {
			const res = await fetch('/api/events/bundles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paymentIds: ids, name: `Draft Bundle (${ids.length} direct payouts)` })
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body?.message ?? `Failed (${res.status})`);

			actionTone = 'success';
			actionMessage = `Created draft bundle ${body?.bundle?.bundleNumber ?? ''} with ${ids.length} payment${ids.length === 1 ? '' : 's'}.`;
			await invalidateAll();
		} catch (err: any) {
			actionTone = 'error';
			actionMessage = err?.message ?? 'Failed to create draft bundle.';
		} finally {
			bundleBusy = { ...bundleBusy, creating: false };
		}
	}

	async function postBundle(bundleId: string) {
		if (!canManageActions) return;
		bundleBusy = { ...bundleBusy, posting: bundleId };
		actionMessage = '';
		try {
			const res = await fetch(`/api/events/bundles/${bundleId}/post`, { method: 'POST' });
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body?.message ?? `Failed (${res.status})`);
			actionTone = 'success';
			actionMessage = `Bundle ${body?.bundle?.bundleNumber ?? ''} posted with checksum ${String(body?.checksum ?? '').slice(0, 12)}...`;
			await invalidateAll();
		} catch (err: any) {
			actionTone = 'error';
			actionMessage = err?.message ?? 'Failed to post bundle.';
		} finally {
			bundleBusy = { ...bundleBusy, posting: null };
		}
	}

	async function payBundle(bundleId: string, label: string) {
		if (!canManageActions) return;
		if (!confirm(`Mark bundle ${label} as paid?`)) return;
		bundleBusy = { ...bundleBusy, paying: bundleId };
		actionMessage = '';
		try {
			const res = await fetch(`/api/events/bundles/${bundleId}/pay`, { method: 'POST' });
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body?.message ?? `Failed (${res.status})`);
			actionTone = 'success';
			actionMessage = `Bundle ${label} paid (${body?.paymentsMarkedPaid ?? 0} payments).`;
			await invalidateAll();
		} catch (err: any) {
			actionTone = 'error';
			actionMessage = err?.message ?? 'Failed to pay bundle.';
		} finally {
			bundleBusy = { ...bundleBusy, paying: null };
		}
	}

	async function runCollectionVerify() {
		if (!canManageActions) return;
		verifyingCollection = true;
		actionMessage = '';
		try {
			const verifyRes = await fetch('/api/admin/migrate-event-payment-bundles', { method: 'GET' });
			const verifyBody = await verifyRes.json().catch(() => ({}));
			if (!verifyRes.ok) throw new Error(verifyBody?.message ?? `Verify failed (${verifyRes.status})`);

			if (verifyBody?.exists) {
				actionTone = 'success';
				actionMessage = 'Collection check complete: event_payment_bundles already exists.';
				return;
			}

			const createRes = await fetch('/api/admin/migrate-event-payment-bundles', { method: 'POST' });
			const createBody = await createRes.json().catch(() => ({}));
			if (!createRes.ok) throw new Error(createBody?.message ?? `Create failed (${createRes.status})`);

			actionTone = 'success';
			actionMessage = createBody?.message ?? 'Collection created: event_payment_bundles.';
			await invalidateAll();
		} catch (err: any) {
			actionTone = 'error';
			actionMessage = err?.message ?? 'Failed to verify/create event payment bundle collection.';
		} finally {
			verifyingCollection = false;
		}
	}

	function bundleStatusClass(status: string) {
		if (status === 'paid') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
		if (status === 'posted') return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
		if (status === 'draft') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
		if (status === 'cancelled') return 'bg-red-500/15 text-red-300 border-red-500/30';
		return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
	}

	async function markCompleted(eventId: string, eventName: string) {
		if (!canManageActions) return;
		if (!confirm(`Mark "${eventName}" as completed?`)) return;

		actionMessage = '';
		runningAction = {
			...runningAction,
			[eventId]: { ...(runningAction[eventId] ?? { generate: false, complete: false }), complete: true }
		};

		try {
			const res = await fetch(`/api/events/${eventId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'completed' })
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body?.message ?? `Failed (${res.status})`);

			actionTone = 'success';
			actionMessage = `Marked ${eventName} as completed.`;
			await invalidateAll();
		} catch (err: any) {
			actionTone = 'error';
			actionMessage = err?.message ?? 'Failed to mark event as completed.';
		} finally {
			runningAction = {
				...runningAction,
				[eventId]: { ...(runningAction[eventId] ?? { generate: false, complete: false }), complete: false }
			};
		}
	}

	function fmt(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(amount || 0);
	}

	function fmtDate(value: string | null | undefined) {
		if (!value) return 'No date';
		const date = new Date(value);
		if (!Number.isFinite(date.getTime())) return 'No date';
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function statusPill(status: string) {
		switch (status) {
			case 'completed':
				return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
			case 'in_progress':
				return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
			case 'scheduled':
				return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
			case 'cancelled':
				return 'bg-red-500/15 text-red-300 border-red-500/30';
			default:
				return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
		}
	}

	function statusLabel(status: string) {
		if (status === 'in_progress') return 'In Progress';
		if (status === 'scheduled') return 'Scheduled';
		if (status === 'completed') return 'Completed';
		if (status === 'cancelled') return 'Cancelled';
		if (status === 'draft') return 'Draft';
		return status || 'Unknown';
	}

	function progressBarColor(progress: number) {
		if (progress >= 100) return 'bg-emerald-500';
		if (progress >= 50) return 'bg-blue-500';
		return 'bg-amber-500';
	}

	function budgetWarningStyles(level: string) {
		switch (level) {
			case 'critical':
				return {
					track: 'bg-red-950/60 border-red-500/30',
					fill: 'bg-gradient-to-r from-red-500 via-rose-500 to-orange-400',
					badge: 'text-red-200 bg-red-500/15 border-red-500/30'
				};
			case 'warning':
				return {
					track: 'bg-orange-950/60 border-orange-500/30',
					fill: 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400',
					badge: 'text-orange-200 bg-orange-500/15 border-orange-500/30'
				};
			case 'watch':
				return {
					track: 'bg-amber-950/60 border-amber-500/30',
					fill: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-lime-400',
					badge: 'text-amber-200 bg-amber-500/15 border-amber-500/30'
				};
			default:
				return {
					track: 'bg-emerald-950/50 border-emerald-500/20',
					fill: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300',
					badge: 'text-emerald-200 bg-emerald-500/15 border-emerald-500/30'
				};
		}
	}

	function budgetWarningLabel(level: string) {
		switch (level) {
			case 'watch':
				return 'Watch';
			case 'warning':
				return 'Warning';
			case 'critical':
				return 'Critical';
			default:
				return 'Healthy';
		}
	}

	function budgetPercent(amount: number) {
		if (departmentBudget.annualBudget <= 0) return 0;
		return Math.max(0, Math.min(100, Math.round((amount / departmentBudget.annualBudget) * 100)));
	}

	function typeLabel(value: string) {
		if (!value) return 'Other';
		return value
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (m) => m.toUpperCase());
	}
</script>

<svelte:head>
	<title>Manage Events - FliHub</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div>
			<div class="flex items-center gap-2 mb-1">
				<span class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
					<PartyPopper class="size-3" /> Overview Workspace
				</span>
			</div>
			<h1 class="text-2xl font-bold tracking-tight">Manage Events</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Event operations dashboard for bookings, tasks, approvals, and payout readiness.
			</p>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			<Button type="button" variant="outline" size="sm" class="gap-1.5" onclick={downloadDailyReport} disabled={generatingReport}>
				<FileDown class="size-3.5" /> {generatingReport ? 'Generating PDF...' : 'Daily PDF Report'}
			</Button>
			<Button href="/dashboard/events/new" size="sm" class="gap-1.5">
				New Event <ArrowRight class="size-3.5" />
			</Button>
			<Button href="/dashboard/events" variant="outline" size="sm" class="gap-1.5">
				Legacy Events View <ArrowRight class="size-3.5" />
			</Button>
		</div>
	</div>

	<button type="button" onclick={() => headerExpanded = !headerExpanded} class="w-full text-left group/info">
		<div class="rounded-xl border border-slate-700/60 {headerExpanded ? 'bg-slate-800/80' : 'bg-slate-800/40'} hover:bg-slate-800/80 transition-colors px-4 py-3">
			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<div class="size-7 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
						<Info class="size-3.5 text-orange-300" />
					</div>
					<p class="text-xs font-medium text-orange-200">
						{headerExpanded ? 'How to run this in ops meetings' : 'What is this page?'}
					</p>
				</div>
				<ChevronDown class="size-4 text-slate-500 group-hover/info:text-slate-300 transition-all duration-200 shrink-0 {headerExpanded ? 'rotate-180' : ''}" />
			</div>
			{#if headerExpanded}
				<div class="text-xs text-orange-100/80 leading-relaxed mt-3 pl-9 space-y-2">
					<p>
						Use these cards to manage each event as a unit: staffing, task execution, and payment flow.
					</p>
					<p>
						Prioritize cards with open approvals, high pending balances, or overdue task due dates.
					</p>
				</div>
			{/if}
		</div>
	</button>

	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<Card class="p-4 border-l-4 border-l-orange-500 bg-orange-950/30">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-orange-300/80 font-medium">Total Events</p>
				<div class="size-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
					<PartyPopper class="size-3.5 text-orange-300" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{totals.totalEvents}</p>
			<p class="text-[11px] text-orange-300/70 mt-0.5">{totals.scheduled} scheduled</p>
		</Card>

		<Card class="p-4 border-l-4 border-l-blue-500 bg-blue-950/30">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-blue-300/80 font-medium">In Progress</p>
				<div class="size-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
					<ListTodo class="size-3.5 text-blue-300" />
				</div>
			</div>
			<p class="text-2xl font-black text-white">{totals.inProgress}</p>
			<p class="text-[11px] text-blue-300/70 mt-0.5">{totals.completed} completed</p>
		</Card>

		<Card class="p-4 border-l-4 border-l-amber-500 bg-amber-950/30">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-amber-300/80 font-medium">Pending Payouts</p>
				<div class="size-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
					<AlertCircle class="size-3.5 text-amber-300" />
				</div>
			</div>
			<p class="text-lg font-black text-white">{fmt(totals.totalPending)}</p>
			<p class="text-[11px] text-amber-300/70 mt-0.5">{totals.pendingApprovals} approvals waiting</p>
		</Card>

		<Card class="p-4 border-l-4 border-l-emerald-500 bg-emerald-950/30">
			<div class="flex items-center justify-between mb-2">
				<p class="text-xs text-emerald-300/80 font-medium">Paid</p>
				<div class="size-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
					<Wallet class="size-3.5 text-emerald-300" />
				</div>
			</div>
			<p class="text-lg font-black text-white">{fmt(totals.totalPaid)}</p>
			<p class="text-[11px] text-emerald-300/70 mt-0.5">Budget {fmt(totals.totalBudget)}</p>
		</Card>
	</div>

	{#if actionMessage}
		<div class="rounded-xl border px-4 py-3 text-sm {actionTone === 'success' ? 'border-emerald-700/50 bg-emerald-950/35 text-emerald-200' : 'border-red-700/50 bg-red-950/30 text-red-200'}">
			{actionMessage}
		</div>
	{/if}

	<Card class="overflow-hidden border border-slate-700/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))] shadow-[0_0_0_1px_rgba(148,163,184,0.08),0_20px_50px_rgba(2,6,23,0.35)]">
		<div class="p-4 md:p-5">
			<div class="flex items-start justify-between gap-3 flex-wrap">
				<div>
					<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-300">
						<DollarSign class="size-3.5" /> Department Budget
					</div>
					<p class="text-xs text-slate-400 mt-1">{departmentBudget.name} annual budget tracking for event operations.</p>
				</div>
				<span
					class={`text-[11px] uppercase tracking-widest font-bold px-2 py-1 rounded border ${budgetWarningStyles(departmentBudget.warningLevel).badge}`}
					title={`Internal level: ${departmentBudget.warningLevel}`}
				>
					{budgetWarningLabel(departmentBudget.warningLevel)}
				</span>
			</div>

			<div class="mt-4 space-y-3">
				<div class="space-y-2 rounded-xl border border-slate-700/70 bg-slate-950/35 p-3">
					<div class="flex items-center justify-between text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
						<span>Running total</span>
						<span>{fmt(departmentBudget.actualExpenses)} / {fmt(departmentBudget.annualBudget)}</span>
					</div>
					<div class={`h-3 rounded-full border overflow-hidden shadow-inner ${budgetWarningStyles(departmentBudget.warningLevel).track}`}>
						<div class={`h-full ${budgetWarningStyles(departmentBudget.warningLevel).fill} transition-all duration-300`} style={`width: ${departmentBudget.utilizationPct}%`}></div>
					</div>
					<p class="text-[11px] text-slate-500">Actual spend only updates when payments move through the pipeline.</p>
				</div>

				<div class="flex items-center justify-between text-xs">
					<span class="text-slate-400">Budget utilization</span>
					<span class="text-slate-200 font-semibold">{departmentBudget.utilizationPct}%</span>
				</div>
				<div class={`h-4 rounded-full border overflow-hidden shadow-inner ${budgetWarningStyles(departmentBudget.warningLevel).track}`}>
					<div class={`h-full ${budgetWarningStyles(departmentBudget.warningLevel).fill} transition-all duration-300`} style={`width: ${departmentBudget.utilizationPct}%`}></div>
				</div>
				<div class="flex items-center justify-between text-[11px] text-slate-400">
					<span>{fmt(departmentBudget.actualExpenses)} allocated to event operations</span>
					<span>{fmt(departmentBudget.availableBalance)} remaining</span>
				</div>
				{#if filteredCards.length !== cards.length}
					{@const filteredProjectedSpend = filteredTotals.totalPaid + filteredTotals.totalPending}
					<div class="space-y-2 rounded-xl border border-slate-700/70 bg-slate-950/35 p-3">
						<div class="flex items-center justify-between text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
							<span>Filtered preview</span>
							<span>{fmt(filteredProjectedSpend)} / {fmt(departmentBudget.annualBudget)}</span>
						</div>
						<div class="h-2 rounded-full border border-slate-700 overflow-hidden bg-slate-800/80">
							<div class="h-full bg-slate-400/80 transition-all duration-300" style={`width: ${budgetPercent(filteredProjectedSpend)}%`}></div>
						</div>
						<p class="text-[11px] text-slate-500">Preview only. Filters can show probable spend, but the Operations budget is not reduced until payment records post.</p>
					</div>
				{/if}
				<div class="grid grid-cols-3 gap-2 text-xs">
					<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
						<p class="text-slate-400">Annual</p>
						<p class="text-slate-100 font-semibold">{fmt(departmentBudget.annualBudget)}</p>
					</div>
					<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
						<p class="text-slate-400">Allocated</p>
						<p class="text-slate-100 font-semibold">{fmt(departmentBudget.actualExpenses)}</p>
					</div>
					<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
						<p class="text-slate-400">Remaining</p>
						<p class="text-slate-100 font-semibold">{fmt(departmentBudget.availableBalance)}</p>
					</div>
				</div>
			</div>
		</div>
	</Card>

	<div class="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
		<div class="flex items-center justify-between gap-3 mb-3">
			<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-300">
				<SlidersHorizontal class="size-3.5" />
				Quick Filters
			</div>
			<div class="flex items-center gap-2">
				{#if canManageActions}
					<Button
						type="button"
						variant="outline"
						size="sm"
						class="gap-1.5"
						onclick={runCollectionVerify}
						disabled={verifyingCollection}
					>
						<Database class="size-3.5" />
						{verifyingCollection ? 'Verifying...' : 'Run Collection Verify'}
					</Button>
				{/if}
				<button type="button" onclick={clearFilters} class="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 rounded px-2 py-1">
					<FilterX class="size-3.5" /> Reset
				</button>
			</div>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-4 gap-2">
			<input
				type="text"
				bind:value={search}
				placeholder="Search name, location, type..."
				class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
			/>
			<select bind:value={statusFilter} class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
				<option value="all">All statuses</option>
				{#each availableStatuses as status}
					<option value={status}>{statusLabel(status)}</option>
				{/each}
			</select>
			<select bind:value={typeFilter} class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
				<option value="all">All types</option>
				{#each availableTypes as type}
					<option value={type}>{typeLabel(type)}</option>
				{/each}
			</select>
			<select bind:value={dateFilter} class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
				<option value="all">All dates</option>
				<option value="upcoming">Upcoming</option>
				<option value="next30">Next 30 days</option>
				<option value="past">Past</option>
			</select>
		</div>
		<p class="mt-2 text-xs text-slate-400">Showing {filteredCards.length} of {cards.length} events.</p>
	</div>

	<Card class="p-4 border border-slate-700/60 bg-slate-900/60">
		<div class="flex items-start justify-between gap-3 flex-wrap">
			<div>
				<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-300">
					<Package class="size-3.5" /> Payment Bundles
				</div>
				<p class="text-xs text-slate-400 mt-1">Create draft bundles, post with checksum, and transition posted bundles to paid.</p>
			</div>
			{#if canManageActions}
				<Button type="button" size="sm" variant="outline" onclick={createDraftBundleFromQueue} disabled={bundleBusy.creating || bundleSummary.directUnbundledCount === 0} class="gap-1.5">
					<Package class="size-3.5" />
					{bundleBusy.creating ? 'Creating...' : `Create Draft from Queue (${Math.min(bundleSummary.directUnbundledCount, 25)})`}
				</Button>
			{/if}
		</div>

		<div class="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-xs">
			<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
				<p class="text-slate-400">Total</p>
				<p class="text-slate-100 font-semibold">{bundleSummary.total}</p>
			</div>
			<div class="rounded-lg border border-amber-700/40 bg-amber-950/20 p-2">
				<p class="text-amber-300/80">Draft</p>
				<p class="text-amber-200 font-semibold">{bundleSummary.draft}</p>
			</div>
			<div class="rounded-lg border border-blue-700/40 bg-blue-950/20 p-2">
				<p class="text-blue-300/80">Posted</p>
				<p class="text-blue-200 font-semibold">{bundleSummary.posted}</p>
			</div>
			<div class="rounded-lg border border-emerald-700/40 bg-emerald-950/20 p-2">
				<p class="text-emerald-300/80">Paid</p>
				<p class="text-emerald-200 font-semibold">{bundleSummary.paid}</p>
			</div>
			<div class="rounded-lg border border-purple-700/40 bg-purple-950/20 p-2">
				<p class="text-purple-300/80">Direct Queue</p>
				<p class="text-purple-200 font-semibold">{bundleSummary.directUnbundledCount}</p>
			</div>
		</div>

		{#if bundles.length === 0}
			<p class="text-xs text-slate-400 mt-3">No bundles yet.</p>
		{:else}
			<div class="mt-3 space-y-2">
				{#each bundles.slice(0, 8) as bundle}
					<div class="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
						<div class="flex items-center justify-between gap-3 flex-wrap">
							<div class="min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="text-[11px] px-2 py-0.5 rounded border {bundleStatusClass(bundle.status)}">{statusLabel(bundle.status)}</span>
									<span class="text-xs text-slate-200 font-semibold">{bundle.bundleNumber}</span>
								</div>
								<p class="text-[11px] text-slate-400 mt-1">
									{bundle.itemCount || 0} items • {fmt(bundle.totalAmount || 0)}
									{#if bundle.postedAt} • posted {fmtDate(bundle.postedAt)}{/if}
									{#if bundle.paidAt} • paid {fmtDate(bundle.paidAt)}{/if}
								</p>
							</div>
							{#if canManageActions}
								<div class="flex items-center gap-2">
									<Button type="button" size="sm" variant="ghost" class="h-8 px-2 text-slate-300 hover:text-white" onclick={() => selectedBundleId = String(bundle.id)}>
										Details
									</Button>
									{#if bundle.status === 'draft'}
										<Button type="button" size="sm" variant="outline" class="gap-1.5" onclick={() => postBundle(bundle.id)} disabled={bundleBusy.posting === bundle.id || bundleBusy.paying === bundle.id}>
											<Send class="size-3.5" />
											{bundleBusy.posting === bundle.id ? 'Posting...' : 'Post'}
										</Button>
									{/if}
									{#if bundle.status === 'posted'}
										<Button type="button" size="sm" variant="outline" class="gap-1.5" onclick={() => payBundle(bundle.id, bundle.bundleNumber)} disabled={bundleBusy.paying === bundle.id || bundleBusy.posting === bundle.id}>
											<HandCoins class="size-3.5" />
											{bundleBusy.paying === bundle.id ? 'Paying...' : 'Mark Paid'}
										</Button>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	{#if selectedBundle}
		<Card class="p-4 border border-slate-700/60 bg-slate-900/60">
			<div class="flex items-start justify-between gap-3 flex-wrap">
				<div>
					<div class="flex items-center gap-2 flex-wrap">
						<span class="text-[11px] px-2 py-0.5 rounded border {bundleStatusClass(selectedBundle.status)}">{statusLabel(selectedBundle.status)}</span>
						<h3 class="text-base font-semibold text-white">{selectedBundle.bundleNumber}</h3>
					</div>
					<p class="text-xs text-slate-400 mt-1">{selectedBundle.name || 'Untitled bundle'}</p>
				</div>
				<p class="text-xs text-slate-400">{selectedBundle.itemCount || 0} items • {fmt(selectedBundle.totalAmount || 0)}</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
				<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
					<p class="text-slate-400">Department</p>
					<p class="text-slate-100 font-semibold mt-1">{selectedBundle.departmentName || 'Operations'}</p>
					<p class="text-slate-400 mt-1">{selectedBundle.accountLabel || 'Event Operations Account'}</p>
				</div>
				<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
					<p class="text-slate-400">Limits</p>
					<p class="text-slate-100 font-semibold mt-1">Max items: {selectedBundle.maxItemCount || '-'}</p>
					<p class="text-slate-400 mt-1">Max amount: {fmt(selectedBundle.maxAmountThreshold || 0)}</p>
				</div>
				<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
					<p class="text-slate-400">Snapshot</p>
					<p class="text-slate-100 font-semibold mt-1 break-all">{selectedBundle.snapshotChecksum || 'No checksum yet'}</p>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
				<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
					<p class="text-slate-400">Notes</p>
					<p class="text-slate-100 mt-1 whitespace-pre-wrap">{selectedBundle.notes || 'No notes added.'}</p>
				</div>
				<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-3">
					<p class="text-slate-400">Snapshot JSON</p>
					<pre class="mt-2 max-h-64 overflow-auto text-[11px] leading-snug text-slate-200 whitespace-pre-wrap break-words">{parseSnapshot(selectedBundle.snapshotJson) ? JSON.stringify(parseSnapshot(selectedBundle.snapshotJson), null, 2) : 'No snapshot stored yet.'}</pre>
				</div>
			</div>
		</Card>
	{/if}

	{#if filteredCards.length === 0}
		<Card class="p-8 border border-slate-700/60 bg-slate-900/60 text-center">
			<div class="mx-auto mb-3 size-12 rounded-xl bg-slate-800 flex items-center justify-center">
				<PartyPopper class="size-6 text-slate-400" />
			</div>
			<h2 class="text-lg font-semibold">No events match your filters</h2>
			<p class="text-sm text-slate-400 mt-1 mb-4">
				Adjust filters or create a new event to start managing bookings, tasks, and payouts.
			</p>
			<div class="flex justify-center gap-2">
				<Button href="/dashboard/events/new" size="sm">Create Event</Button>
				<Button type="button" variant="outline" size="sm" onclick={clearFilters}>Clear Filters</Button>
			</div>
		</Card>
	{:else}
		<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
			{#each filteredCards as event}
				<Card class="p-5 border border-slate-700/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.85),rgba(2,6,23,0.85))] hover:border-slate-500 hover:bg-slate-900 transition-colors">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex items-center gap-2 mb-2 flex-wrap">
								<span class="text-[11px] px-2 py-0.5 rounded border {statusPill(event.status)}">{statusLabel(event.status)}</span>
								<span class="text-[11px] px-2 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-300">{typeLabel(event.eventType)}</span>
							</div>
							<h2 class="text-lg font-bold leading-tight">{event.name}</h2>
							<p class="text-xs text-slate-400 mt-1 line-clamp-2">{event.description || 'No description provided.'}</p>
						</div>
						<div class="flex flex-col gap-2 shrink-0 min-w-[170px]">
							<Button href={`/dashboard/events/${event.id}`} variant="outline" size="sm" class="gap-1.5">
								View <ArrowRight class="size-3.5" />
							</Button>
							{#if canManageActions}
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={runningAction[event.id]?.generate}
									onclick={() => generatePayments(event.id)}
									class="gap-1.5"
								>
									<RefreshCw class="size-3.5 {runningAction[event.id]?.generate ? 'animate-spin' : ''}" />
									{runningAction[event.id]?.generate ? 'Generating...' : 'Generate Payments'}
								</Button>
								{#if event.status !== 'completed'}
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={runningAction[event.id]?.complete}
										onclick={() => markCompleted(event.id, event.name)}
										class="gap-1.5"
									>
										<CheckCircle2 class="size-3.5" />
										{runningAction[event.id]?.complete ? 'Updating...' : 'Mark Complete'}
									</Button>
								{/if}
							{/if}
							<Button href="/dashboard/approvals" variant="outline" size="sm" class="gap-1.5">
								Open Approvals <ArrowRight class="size-3.5" />
							</Button>
						</div>
					</div>

					<div class="mt-4 space-y-2">
						<div class="flex items-center justify-between text-xs">
							<span class="text-slate-400">Execution Progress</span>
							<span class="text-slate-200 font-semibold">{event.progressPct}%</span>
						</div>
						<div class="h-2 rounded-full bg-slate-800 overflow-hidden">
							<div class="h-full {progressBarColor(event.progressPct)}" style={`width: ${event.progressPct}%`}></div>
						</div>
						<div class="text-[11px] text-slate-500">
							{event.counts.taskDone} / {event.counts.tasks} tasks complete
						</div>
					</div>

					<div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
						<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
							<p class="text-slate-400">Talent</p>
							<p class="text-slate-100 font-semibold">{event.counts.confirmedTalent}/{event.counts.talent}</p>
						</div>
						<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
							<p class="text-slate-400">Approvals</p>
							<p class="text-amber-300 font-semibold">{event.counts.pendingApprovals}</p>
						</div>
						<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
							<p class="text-slate-400">Pending</p>
							<p class="text-blue-300 font-semibold">{fmt(event.spend.pending)}</p>
						</div>
						<div class="rounded-lg border border-slate-700 bg-slate-800/70 p-2">
							<p class="text-slate-400">Paid</p>
							<p class="text-emerald-300 font-semibold">{fmt(event.spend.paid)}</p>
						</div>
					</div>

					<div class="mt-4 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
						<span class="inline-flex items-center gap-1.5"><Calendar class="size-3.5" /> {fmtDate(event.nextDueTask?.dueDate ?? event.eventDate)}</span>
						{#if event.location}
							<span class="inline-flex items-center gap-1.5"><MapPin class="size-3.5" /> {event.location}</span>
						{/if}
						<span class="inline-flex items-center gap-1.5"><DollarSign class="size-3.5" /> Budget: {fmt(event.budget)}</span>
						<span class="inline-flex items-center gap-1.5"><Users class="size-3.5" /> Open tasks: {event.counts.taskOpen}</span>
						{#if event.tournamentName}
							<span class="inline-flex items-center gap-1.5"><Trophy class="size-3.5" /> {event.tournamentName}</span>
						{/if}
						{#if event.counts.bonusEligible > 0}
							<span class="inline-flex items-center gap-1.5"><Star class="size-3.5" /> Bonus eligible: {event.counts.bonusEligible}</span>
						{/if}
					</div>
				</Card>
			{/each}
		</div>

		<div class="grid grid-cols-1 md:grid-cols-4 gap-3">
			<Card class="p-4 border border-blue-700/40 bg-blue-950/25">
				<p class="text-xs text-blue-300/80">Filtered Pending</p>
				<p class="text-lg font-semibold mt-1">{fmt(filteredTotals.totalPending)}</p>
			</Card>
			<Card class="p-4 border border-emerald-700/40 bg-emerald-950/25">
				<p class="text-xs text-emerald-300/80">Filtered Paid</p>
				<p class="text-lg font-semibold mt-1">{fmt(filteredTotals.totalPaid)}</p>
			</Card>
			<Card class="p-4 border border-amber-700/40 bg-amber-950/25">
				<p class="text-xs text-amber-300/80">Task Est. Cost</p>
				<p class="text-lg font-semibold mt-1">{fmt(filteredTotals.estimatedTaskCost)}</p>
			</Card>
			<Card class="p-4 border border-teal-700/40 bg-teal-950/25">
				<p class="text-xs text-teal-300/80">Task Actual Cost</p>
				<p class="text-lg font-semibold mt-1">{fmt(filteredTotals.actualTaskCost)}</p>
			</Card>
		</div>
	{/if}
</div>