<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { RotateCcw, Loader2, FileText, CheckCircle, ExternalLink, Users, ChevronDown, ChevronUp, X, Pencil } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let showAddResultModal = $state(false);
	let clearingTestData   = $state(false);
	let generatingWO       = $state(false);
	let showPayoutTable    = $state(false); // collapsed by default
	let showResultsHelp    = $state(false);
	let generatingWorkOrders = $state(false);
	let workOrderActionError = $state('');

	// Per-pro inline manager cut editing (row-level)
	let mgrEdits = $state<Record<string, { editing: boolean; cutPct: number; saving: boolean }>>({});

	// Pre-initialise edit state for all results so getMgrEdit never writes inside a derived/template
	$effect(() => {
		for (const r of data.results) {
			if (!mgrEdits[r.id]) {
				mgrEdits[r.id] = { editing: false, cutPct: r.managerCutPercentage ?? 0, saving: false };
			}
		}
	});

	const getMgrEdit = (resultId: string, defaultPct: number) =>
		mgrEdits[resultId] ?? { editing: false, cutPct: defaultPct, saving: false };

	// Manager cut overlay modal — shows all pros at once
	let showMgrOverlay  = $state(false);
	let mgrOverlaySaving = $state(false);

	// Build overlay rows from results: one row per unique pro
	type OverlayRow = {
		resultId:   string;
		proId:      string;
		proName:    string;
		gender:     string;
		placement:  number;
		franchise:  string;
		gross:      number;
		cutPct:     number;
		managerName:  string;
		managerEmail: string;
	};

	const overlayRows = $derived((): OverlayRow[] => {
		return data.results.map((r: any) => {
			const pro = data.prosMap?.[r.pro] ?? {};
			return {
				resultId:     r.id,
				proId:        r.pro,
				proName:      r.expand?.pro?.name ?? pro.name ?? r.pro,
				gender:       r.expand?.pro?.gender ?? pro.gender ?? 'male',
				placement:    r.placement,
				franchise:    r.expand?.franchise?.name ?? 'No Franchise',
				gross:        r.proEarnings ?? 0,
				cutPct:       r.managerCutPercentage ?? pro.managerCutPercentage ?? 0,
				managerName:  pro.managerName ?? '',
				managerEmail: pro.managerEmail ?? '',
			};
		}).sort((a, b) => a.placement - b.placement);
	});

	// Local editable state for the overlay (keyed by resultId)
	let overlayEdits = $state<Record<string, { cutPct: number; managerName: string; managerEmail: string }>>({});

	function initOverlay() {
		const edits: typeof overlayEdits = {};
		for (const row of overlayRows()) {
			edits[row.resultId] = {
				cutPct:       row.cutPct,
				managerName:  row.managerName,
				managerEmail: row.managerEmail,
			};
		}
		overlayEdits = edits;
		showMgrOverlay = true;
	}

	// Bulk preset
	function applyBulkPct(pct: number) {
		const edits = { ...overlayEdits };
		for (const key of Object.keys(edits)) edits[key] = { ...edits[key], cutPct: pct };
		overlayEdits = edits;
	}

	const fmt = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	const fmtFull = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

	const formatCurrency = fmt;

	// Group results by franchise — $derived value (not function)
	const byFranchise = $derived(
		(() => {
			const map = new Map<string, { franchiseId: string; franchiseName: string; results: any[] }>();
			for (const r of data.results) {
				const fid   = r.franchise ?? '__none__';
				const fname = r.expand?.franchise?.name ?? 'No Franchise';
				if (!map.has(fid)) map.set(fid, { franchiseId: fid, franchiseName: fname, results: [] });
				map.get(fid)!.results.push(r);
			}
			for (const g of map.values()) g.results.sort((a, b) => a.placement - b.placement);
			const groups = Array.from(map.values());
			// Use franchiseRank if any result has it set, otherwise fall back to earnings
			const hasRank = groups.some(g => g.results.some(r => r.franchiseRank > 0));
			return groups.sort((a, b) => {
				if (hasRank) {
					const aRank = a.results.find(r => r.franchiseRank > 0)?.franchiseRank ?? 9999;
					const bRank = b.results.find(r => r.franchiseRank > 0)?.franchiseRank ?? 9999;
					return aRank - bRank;
				}
				const aTotal = a.results.reduce((s, r) => s + (r.proEarnings || 0), 0);
				const bTotal = b.results.reduce((s, r) => s + (r.proEarnings || 0), 0);
				return bTotal - aTotal;
			});
		})()
	);
	const noFranchiseGroup = $derived(
		byFranchise.find((g: any) => g.franchiseId === '__none__') ?? null
	);
	const unassignedFranchiseCount = $derived(noFranchiseGroup ? noFranchiseGroup.results.length : 0);

	const totalProPayments = $derived(
		(data.proPayments ?? []).filter((p: any) => p.recipient === 'pro').reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
	);
	const totalMgrPayments = $derived(
		(data.proPayments ?? []).filter((p: any) => p.recipient === 'manager').reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
	);
	const totalPayments = $derived(totalProPayments + totalMgrPayments);
	const pendingCount  = $derived((data.proPayments ?? []).filter((p: any) => p.status === 'pending').length);
	const paidCount     = $derived((data.proPayments ?? []).filter((p: any) => p.status === 'paid').length);
	const workOrderCount = $derived((data.workOrders ?? []).length);
	const totalWorkOrderAmount = $derived((data.workOrders ?? []).reduce((s: number, wo: any) => s + (wo.amount ?? 0), 0));
	const workOrdersByRecipient = $derived(() => {
		const grouped = new Map<string, any[]>();
		for (const workOrder of (data.workOrders ?? [])) {
			const notes = String(workOrder.notes ?? '').toLowerCase();
			const recipient = /\[fp:/i.test(notes) ? 'franchise' : notes.includes('manager') ? 'manager' : 'pro';
			if (!grouped.has(recipient)) grouped.set(recipient, []);
			grouped.get(recipient)!.push(workOrder);
		}
		for (const list of grouped.values()) {
			list.sort((a, b) => String(a.work_order_number ?? '').localeCompare(String(b.work_order_number ?? '')));
		}
		return Array.from(grouped.entries()).map(([recipient, workOrders]) => ({
			recipient,
			workOrders,
			total: workOrders.reduce((sum, wo) => sum + (wo.amount ?? 0), 0),
		}));
	});
	const workOrderMappings = $derived(() => {
		const byPaymentId = new Map<string, any>();
		for (const wo of (data.workOrders ?? [])) {
			const idsFromRelation = Array.isArray(wo.proPayment) ? wo.proPayment : [];
			const idsFromNotes = Array.from(String(wo.notes ?? '').matchAll(/\[PP:([a-zA-Z0-9]+)\]/g)).map(match => match[1]);
			for (const paymentId of [...new Set([...idsFromRelation, ...idsFromNotes])]) {
				byPaymentId.set(paymentId, wo);
			}
		}

		return (data.proPayments ?? [])
			.map((payment: any) => {
				const workOrder = byPaymentId.get(payment.id) ?? null;
				return {
					paymentId: payment.id,
					paymentName: payment.expand?.pro?.name ?? payment.pro ?? 'Unknown',
					recipient: payment.recipient ?? 'n/a',
					amount: payment.amount ?? 0,
					workOrderNumber: workOrder?.work_order_number ?? 'n/a',
					workOrderStatus: workOrder?.status ?? 'missing',
				};
			})
			.sort((a: any, b: any) => {
				const recipientOrder = a.recipient.localeCompare(b.recipient);
				return recipientOrder !== 0 ? recipientOrder : a.paymentName.localeCompare(b.paymentName);
			});
	});

	let expandedFranchises = $state<Set<string>>(new Set());
	let expandedPayout     = $state<number | null>(null);



	const toggleFranchise = (id: string) => {
		const next = new Set(expandedFranchises);
		if (next.has(id)) next.delete(id); else next.add(id);
		expandedFranchises = next;
	};
	const togglePayout = (n: number) => expandedPayout = expandedPayout === n ? null : n;

	// Franchise drag-to-reorder — client-side only until Save Order is clicked
	let franchiseOrder      = $state<typeof byFranchise>([]);
	let franchiseOrderDirty = $state(false);
	let franchiseSaving     = $state(false);
	let dragFranchiseId     = $state<string | null>(null);
	let dragOverFranchiseId = $state<string | null>(null);

	// Sync franchiseOrder from server data on load — never overwrite unsaved drag changes
	let franchiseOrderInitialised = false;
	$effect(() => {
		// Touch byFranchise to subscribe; only sync before first user interaction
		const snapshot = [...byFranchise];
		if (!franchiseOrderInitialised) {
			franchiseOrder = snapshot;
			franchiseOrderDirty = false;
			franchiseOrderInitialised = true;
		}
	});

	function onFranchiseDragStart(e: DragEvent, fid: string) {
		dragFranchiseId = fid;
		if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', fid); }
	}
	function onFranchiseDragOver(e: DragEvent, fid: string) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverFranchiseId = fid;
	}
	function onFranchiseDragEnd() { dragFranchiseId = null; dragOverFranchiseId = null; }

	function onFranchiseDrop(e: DragEvent, targetFid: string) {
		e.preventDefault();
		if (!dragFranchiseId || dragFranchiseId === targetFid) { onFranchiseDragEnd(); return; }

		// Reorder client-side only
		const next = [...franchiseOrder];
		const fromIdx = next.findIndex(g => g.franchiseId === dragFranchiseId);
		const toIdx   = next.findIndex(g => g.franchiseId === targetFid);
		const [moved] = next.splice(fromIdx, 1);
		next.splice(toIdx, 0, moved);
		franchiseOrder = next;
		franchiseOrderDirty = true;
		onFranchiseDragEnd();
	}

	async function saveFranchiseOrder() {
		franchiseSaving = true;
		const order = franchiseOrder.map(g => g.franchiseId);
		const fd = new FormData();
		fd.append('order', JSON.stringify(order));
		await fetch('?/reorderFranchises', { method: 'POST', body: fd });
		franchiseSaving = false;
		franchiseOrderDirty = false;
		location.reload();
	}

	// Result drag-to-reorder state
	let dragResultId  = $state<string | null>(null);
	let dragOverId    = $state<string | null>(null);
	let reorderSaving = $state(false);

	function onDragStart(e: DragEvent, resultId: string) {
		dragResultId = resultId;
		if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', resultId); }
	}
	function onDragOver(e: DragEvent, resultId: string) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverId = resultId;
	}
	function onDragEnd() { dragResultId = null; dragOverId = null; }

	async function onDrop(e: DragEvent, targetResultId: string) {
		e.preventDefault();
		if (!dragResultId || dragResultId === targetResultId) { onDragEnd(); return; }

		// Find placements and swap
		const src = data.results.find((r: any) => r.id === dragResultId);
		const tgt = data.results.find((r: any) => r.id === targetResultId);
		if (!src || !tgt) { onDragEnd(); return; }

		reorderSaving = true;
		const fd = new FormData();
		fd.append('srcId', dragResultId);
		fd.append('tgtId', targetResultId);
		fd.append('srcPlacement', String(src.placement));
		fd.append('tgtPlacement', String(tgt.placement));

		await fetch('?/swapPlacements', { method: 'POST', body: fd });
		onDragEnd();
		reorderSaving = false;
		// Reload page data
		location.reload();
	}

	const totalFranchiseCut = $derived(data.results.reduce((s: number, r: any) => s + (r.franchiseEarnings || 0), 0));
	const franchiseCutPct   = $derived(data.franchiseCutPercentage ?? 0);
	const noFranchiseCut    = $derived(franchiseCutPct === 0);

	// Payment lookup by tournamentResult id
	const paymentByResult = $derived(() => {
		const map: Record<string, { pro: any; mgr: any }> = {};
		for (const p of (data.proPayments ?? [])) {
			if (!p.tournamentResult) continue;
			if (!map[p.tournamentResult]) map[p.tournamentResult] = { pro: null, mgr: null };
			if (p.recipient === 'pro')     map[p.tournamentResult].pro = p;
			if (p.recipient === 'manager') map[p.tournamentResult].mgr = p;
		}
		return map;
	});

	const placementLabel = (n: number) =>
		n === 1 ? '🥇 1st' : n === 2 ? '🥈 2nd' : n === 3 ? '🥉 3rd' : `${n}${ordinal(n)}`;
	function ordinal(n: number) {
		const s = ['th', 'st', 'nd', 'rd'];
		const v = n % 100;
		return s[(v - 20) % 10] || s[v] || s[0];
	}
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">{data.tournament.name}</h1>
			<p class="text-muted-foreground">
				Season {data.tournament.season} • Tournament #{data.tournament.tournamentNumber || 'N/A'}
			</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/talent/tournaments">← Back</Button>
			<Button href="/dashboard/talent/tournaments/{data.tournament.id}/ops" variant="outline"
				class="gap-1.5 border-slate-600 text-slate-300 hover:bg-slate-700">
				⚙ Ops
			</Button>
			<Button onclick={() => (showAddResultModal = true)}>Add Result</Button>
		</div>
	</div>

	<!-- Tournament Details -->
	<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
		<h2 class="text-xl font-semibold mb-4 text-slate-100">Tournament Details</h2>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div>
				<div class="text-sm text-muted-foreground">Dates</div>
				<div class="font-medium">
					{formatDate(data.tournament.startDate)} - {formatDate(data.tournament.endDate)}
				</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">Location</div>
				<div class="font-medium">{data.tournament.location || 'TBD'}</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">Venue</div>
				<div class="font-medium">{data.tournament.venue || 'TBD'}</div>
			</div>
			<div>
				<div class="text-sm text-muted-foreground">Status</div>
				<Badge
					class={data.tournament.status === 'completed'
						? 'bg-green-100 text-green-800'
						: data.tournament.status === 'in_progress'
							? 'bg-blue-100 text-blue-800'
							: 'bg-gray-100 text-gray-800'}
				>
					{data.tournament.status}
				</Badge>
			</div>
		</div>
	</div>

	<!-- Payout Structure -->
	<div class="bg-slate-800 border border-slate-700 rounded-xl p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold text-slate-100">Payout Structure</h2>
			{#if noFranchiseCut}
				<span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300">
					★ Season 1 — 100% to Pros · No Franchise Cut
				</span>
			{:else}
				<span class="text-xs text-slate-500">Franchise cut: {franchiseCutPct}%</span>
			{/if}
		</div>

		<!-- Summary cards -->
		<div class="grid grid-cols-2 {noFranchiseCut ? 'md:grid-cols-3' : 'md:grid-cols-5'} gap-4 mb-6">
			<div class="text-center p-4 bg-blue-900/30 border border-blue-700/40 rounded-lg">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Total Prize Pool</div>
				<div class="text-2xl font-bold text-blue-300">{formatCurrency(data.tournament.prizePool)}</div>
			</div>
			{#if !noFranchiseCut}
				<div class="text-center p-4 bg-purple-900/30 border border-purple-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Franchise Cut ({franchiseCutPct}%)</div>
					<div class="text-2xl font-bold text-purple-300">{formatCurrency(data.franchiseCut)}</div>
				</div>
				<div class="text-center p-4 bg-emerald-900/30 border border-emerald-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Pro Cut ({100 - franchiseCutPct}%)</div>
					<div class="text-2xl font-bold text-emerald-300">{formatCurrency(data.proCut)}</div>
				</div>
			{:else}
				<div class="text-center p-4 bg-emerald-900/30 border border-emerald-600/60 rounded-lg col-span-1">
					<div class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Pro Cut (100%)</div>
					<div class="text-2xl font-bold text-emerald-300">{formatCurrency(data.proCut)}</div>
				</div>
			{/if}
			<div class="text-center p-4 bg-cyan-900/30 border border-cyan-700/40 rounded-lg">
				<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Men's Purse</div>
				<div class="text-2xl font-bold text-cyan-300">{formatCurrency(data.divisionPurse)}</div>
			</div>
			{#if !noFranchiseCut}
				<div class="text-center p-4 bg-pink-900/30 border border-pink-700/40 rounded-lg">
					<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Women's Purse</div>
					<div class="text-2xl font-bold text-pink-300">{formatCurrency(data.divisionPurse)}</div>
				</div>
			{/if}
		</div>

		<!-- Placement Payouts table -->
		<div class="border-t border-slate-700 pt-4">
			<button type="button" onclick={() => showPayoutTable = !showPayoutTable}
				class="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/40 hover:bg-slate-700/70 transition-colors text-left group mb-3">
				<div class="flex items-center gap-3">
					<span class="text-base font-bold text-slate-100">Placement Payouts</span>
					<span class="text-xs text-slate-400">view a breakdown for each payout per tournament position</span>
				</div>
				<span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-600 group-hover:bg-slate-500 text-slate-200 transition-colors shrink-0">
					{showPayoutTable ? '▲ hide' : '▼ show'}
				</span>
			</button>
		{#if showPayoutTable}
			<div class="space-y-1">
				{#each data.payoutStructure as payout}
					{@const topThree = payout.placement <= 3}
					{@const franchiseTotal = payout.amount * 2}
					{@const resultAtPlacement = data.results.filter(r => r.placement === payout.placement)}
					<div class="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm {topThree ? 'bg-slate-700/30 border border-slate-600' : 'bg-slate-800/30 border border-slate-700/60'}">
						<span class="font-semibold text-slate-200 w-20 shrink-0">{placementLabel(payout.placement)}</span>
						{#if resultAtPlacement.length > 0}
							<span class="text-xs text-slate-400 flex-1 truncate px-2">
								{resultAtPlacement.map(r => r.expand?.franchise?.name ?? '').filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
							</span>
						{:else}
							<span class="flex-1"></span>
						{/if}
						<span class="font-bold text-emerald-300">{formatCurrency(franchiseTotal)}</span>
					</div>
				{/each}

				<!-- Totals row -->
				<div class="flex items-center justify-between px-4 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 text-sm font-semibold mt-1">
					<span class="text-slate-300">Total</span>
					<span class="text-emerald-300">{formatCurrency(data.payoutStructure.reduce((s, p) => s + p.amount * 2, 0))}</span>
				</div>
			</div>
			<p class="text-xs text-slate-500 mt-2">
				* Franchise total = Men's + Women's division combined.
				{#if noFranchiseCut}Season 1: franchise cut waived — pros receive 100% of the purse.{/if}
			</p>
		{/if}
		</div>

	<!-- Results by Franchise -->
	<div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
		<div class="border-b border-slate-700">
			<div class="flex items-center justify-between px-5 py-3 gap-2 flex-wrap">
				<div class="flex items-center gap-2">
					<p class="font-semibold text-slate-200 text-sm">Results by Franchise ({franchiseOrder.length})</p>
					{#if franchiseOrderDirty}
						<button type="button" onclick={saveFranchiseOrder} disabled={franchiseSaving}
							class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition-colors">
							{#if franchiseSaving}<Loader2 class="size-3 animate-spin" />{/if}
							Save Order
						</button>
						<button type="button" onclick={() => { franchiseOrder = [...byFranchise]; franchiseOrderDirty = false; franchiseOrderInitialised = true; }}
							class="text-xs px-2 py-1 rounded-lg border border-slate-600 text-slate-400 hover:text-slate-200 transition-colors">
							Reset
						</button>
					{/if}
				</div>
					<button type="button" onclick={() => showResultsHelp = !showResultsHelp}
						class="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors select-none">
						{showResultsHelp ? 'hide help' : '?'}
					</button>
				</div>
				<div class="flex items-center gap-2">
					{#if data.results.length > 0}
						<button type="button" onclick={initOverlay}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-700/60 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 text-xs font-semibold transition-colors">
							<Users class="size-3.5" /> Manager Cuts
						</button>
					{/if}
					<Button onclick={saveFranchiseOrder} disabled={franchiseSaving} size="sm" variant="outline">
					{#if franchiseSaving}<Loader2 class="size-3 animate-spin mr-1" />{/if}
					Update Payouts
				</Button>
				</div>
			</div>
		</div>

		{#if unassignedFranchiseCount > 0}
			<div class="px-5 py-2.5 border-b border-amber-900/40 bg-amber-950/20 text-xs text-amber-300">
				{unassignedFranchiseCount} result{unassignedFranchiseCount === 1 ? '' : 's'} currently have no franchise assignment.
			</div>
		{/if}

		{#if showResultsHelp}
			<div class="border-b border-slate-700 bg-slate-900/60 px-5 py-4 text-xs text-slate-400">
				<p class="font-semibold text-slate-300 mb-2">How to use this list</p>
				<ul class="space-y-1.5">
					<li>▸ <span class="text-slate-300">Click a franchise row</span> to expand and see individual pro results.</li>
					<li>▸ <span class="text-slate-300">Drag the ⠿ handle</span> on any pro row to swap placement numbers with another row.</li>
					<li>▸ <span class="text-slate-300">Click the % button</span> on a pro row to edit their manager cut inline.</li>
					<li>▸ <span class="text-slate-300">Manager Cuts</span> opens a bulk overlay to set manager name, email, and cut % for all pros at once.</li>
					<li>▸ Franchises are ranked by total gross earnings. Pros within each franchise are sorted by placement.</li>
				</ul>
			</div>
		{/if}



		{#if data.results.length === 0}
			<div class="text-center py-12 text-slate-500">No results yet. Add results to see payouts.</div>
		{:else}
			<div class="divide-y divide-slate-700/50">
				{#each franchiseOrder as group, gi}
					{@const groupTotal = group.results.reduce((s, r) => s + (r.proEarnings || 0), 0)}
					{@const groupMgr   = group.results.reduce((s, r) => s + (r.managerEarnings || 0), 0)}
					{@const groupNet   = groupTotal - groupMgr}
					{@const isOpen     = expandedFranchises.has(group.franchiseId)}

					<div>
						<!-- Franchise header: drag handle | rank | name | toggle -->
						<div class="flex items-stretch transition-colors {dragOverFranchiseId === group.franchiseId && dragFranchiseId !== group.franchiseId ? 'border-t-2 border-blue-500 bg-blue-950/10' : 'hover:bg-slate-700/20'} {dragFranchiseId === group.franchiseId ? 'opacity-40' : ''}"
							ondragover={(e) => onFranchiseDragOver(e, group.franchiseId)}
							ondragleave={() => dragOverFranchiseId = null}
							ondrop={(e) => onFranchiseDrop(e, group.franchiseId)}>

							<!-- Drag handle -->
							<div class="flex items-center px-3 cursor-grab active:cursor-grabbing shrink-0 select-none text-slate-500 hover:text-slate-300 transition-colors"
								draggable="true"
								ondragstart={(e) => onFranchiseDragStart(e, group.franchiseId)}
								ondragend={onFranchiseDragEnd}>
								<svg class="size-4" fill="currentColor" viewBox="0 0 20 20">
									<path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zM7 8a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zM7 14a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
								</svg>
							</div>

							<!-- Rank number -->
							<div class="flex items-center w-6 shrink-0 text-slate-500 font-black text-sm select-none">
								{gi + 1}
							</div>

							<!-- Clickable toggle area -->
							<button type="button" onclick={() => toggleFranchise(group.franchiseId)}
								class="flex-1 flex items-center justify-between py-3 pr-5 text-left gap-3 min-w-0">
								<div class="min-w-0">
									<p class="font-bold text-white text-sm truncate">{group.franchiseName}</p>
									<p class="text-xs text-slate-500">
										{group.results.length} pro{group.results.length !== 1 ? 's' : ''}
										· gross {fmt(groupTotal)}
										{#if groupMgr > 0} · mgr −{fmt(groupMgr)}{/if}
									</p>
								</div>
								<div class="flex items-center gap-3 shrink-0">
									<div class="text-right">
										<p class="font-bold text-emerald-300 text-sm">{fmt(groupNet)}</p>
										<p class="text-[10px] text-slate-500">net to pros</p>
									</div>
									<svelte:component this={isOpen ? ChevronUp : ChevronDown} class="size-4 text-slate-400" />
								</div>
							</button>
						</div>

						<!-- Per-pro rows (expanded) -->
						{#if isOpen}
							<div class="bg-slate-900/40 divide-y divide-slate-800">
								{#if reorderSaving}
									<div class="px-5 py-2 text-xs text-slate-500 flex items-center gap-2">
										<Loader2 class="size-3 animate-spin" /> Saving order…
									</div>
								{/if}
								{#each group.results as result}
									{@const isDragOver = dragOverId === result.id && dragResultId !== result.id}
									{@const payments = paymentByResult()[result.id] ?? { pro: null, mgr: null }}
									{@const gross    = result.proEarnings || 0}
									{@const mgrPct   = result.managerCutPercentage || 0}
									{@const mgrAmt   = result.managerEarnings || 0}
									{@const netAmt   = result.netProEarnings || gross}
									{@const edit     = getMgrEdit(result.id, mgrPct)}

									<div class="transition-colors {isDragOver ? 'border-t-2 border-blue-500 bg-blue-950/10' : ''} {dragResultId === result.id ? 'opacity-40' : ''}"
										ondragover={(e) => onDragOver(e, result.id)}
										ondragleave={() => dragOverId = null}
										ondrop={(e) => onDrop(e, result.id)}>
										<div class="flex items-stretch">

											<!-- Result drag handle -->
											<div class="flex items-center px-3 cursor-grab active:cursor-grabbing shrink-0 select-none"
												draggable="true"
												ondragstart={(e) => onDragStart(e, result.id)}
												ondragend={onDragEnd}>
												<svg class="size-3.5 text-slate-500 hover:text-slate-300" fill="currentColor" viewBox="0 0 20 20">
													<path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 2zM7 8a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zM7 14a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
												</svg>
											</div>

											<!-- Placement number — editable -->
											<div class="flex items-center w-12 shrink-0 select-none">
												<input
													type="number"
													min="1"
													value={result.placement}
													onclick={(e) => e.stopPropagation()}
													onkeydown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
													onblur={async (e) => {
														const val = parseInt((e.target as HTMLInputElement).value);
														if (!val || val === result.placement) return;
														const fd = new FormData();
														fd.append('resultId', result.id);
														fd.append('placement', String(val));
														await fetch('?/setPlacement', { method: 'POST', body: fd });
														location.reload();
													}}
													class="w-10 bg-transparent font-black text-xs text-center {result.placement <= 3 ? 'text-amber-400' : 'text-slate-500'} border border-transparent hover:border-slate-600 focus:border-blue-500 focus:bg-slate-800 focus:text-slate-100 rounded px-1 py-0.5 outline-none transition-colors"
												/>
											</div>

											<!-- Row content -->
											<div class="flex-1 py-3 pr-5">
												<div class="flex items-center gap-3 flex-wrap">

											<!-- Pro name + division -->
											<div class="flex-1 min-w-0">
												<p class="font-semibold text-slate-100 text-sm">{result.expand?.pro?.name || 'Unknown'}</p>
												<p class="text-xs text-slate-500">{result.division === 'womens' ? 'FPO' : 'MPO'}</p>
											</div>

											<!-- Earnings columns -->
											<div class="flex items-center gap-4 text-xs shrink-0">
												<div class="text-right">
													<p class="text-slate-400 text-[10px]">Gross</p>
													<p class="font-semibold text-slate-200">{fmt(gross)}</p>
												</div>
												{#if mgrPct > 0}
													<div class="text-right">
														<p class="text-amber-400 text-[10px]">Mgr {mgrPct}%</p>
														<p class="font-semibold text-amber-300">−{fmt(mgrAmt)}</p>
													</div>
												{/if}
												<div class="text-right">
													<p class="text-emerald-400 text-[10px]">Net</p>
													<p class="font-bold text-emerald-300">{fmt(netAmt)}</p>
												</div>
												<!-- Payment status -->
												{#if payments.pro}
													<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border
														{payments.pro.status === 'paid' ? 'text-emerald-400 border-emerald-700 bg-emerald-950/40' : 'text-amber-400 border-amber-700 bg-amber-950/40'}">
														{payments.pro.status}
													</span>
												{/if}

												<!-- Manager cut edit button -->
												<button type="button"
													onclick={() => { edit.editing = !edit.editing; edit.cutPct = mgrPct; }}
													class="flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-semibold transition-colors
														{edit.editing ? 'border-amber-600 bg-amber-900/40 text-amber-300' : 'border-slate-600 bg-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-700'}">
													<Users class="size-3" />
													{mgrPct > 0 ? `${mgrPct}%` : 'Mgr'}
												</button>
											</div>
										</div>

										<!-- Manager cut editor (inline) -->
										{#if edit.editing}
											<div class="mt-2 ml-11 flex items-center gap-2 flex-wrap">
												<form method="POST" action="?/setManagerCut" use:enhance={() => {
													edit.saving = true;
													return async ({ update }) => { await update(); edit.saving = false; edit.editing = false; };
												}} class="flex items-center gap-2">
													<input type="hidden" name="proId"    value={result.pro} />
													<input type="hidden" name="resultId" value={result.id} />
													<label class="text-xs text-slate-400">Manager cut %</label>
													<input type="number" name="cutPct" min="0" max="50" step="1"
														value={edit.cutPct}
														oninput={(e) => { edit.cutPct = Number((e.target as HTMLInputElement).value); }}
														class="w-20 rounded border border-slate-600 bg-slate-800 text-slate-100 px-2 py-1 text-sm text-center" />
													<button type="submit" disabled={edit.saving}
														class="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
														{#if edit.saving}<Loader2 class="size-3 animate-spin" />{:else}Apply{/if}
													</button>
													<button type="button" onclick={() => edit.editing = false}
														class="px-2 py-1 rounded border border-slate-600 text-slate-400 text-xs hover:bg-slate-700 transition-colors">Cancel</button>
												</form>
												{#if result.expand?.pro?.managerName}
													<span class="text-xs text-amber-400/70">{result.expand.pro.managerName}</span>
												{/if}
											</div>
										{/if}
									</div>
									</div><!-- /flex-1 row content -->
								</div><!-- /flex items-stretch -->
								{/each}

								<!-- Franchise subtotal -->
								<div class="px-5 py-2 flex items-center justify-between bg-slate-800/60 text-xs">
									<span class="text-slate-500 font-semibold uppercase tracking-wide">{group.franchiseName} subtotal</span>
									<div class="flex items-center gap-4">
										<span class="text-slate-400">Gross: <span class="text-slate-200 font-semibold">{fmt(groupTotal)}</span></span>
										{#if groupMgr > 0}<span class="text-slate-400">Mgr: <span class="text-amber-300 font-semibold">−{fmt(groupMgr)}</span></span>{/if}
										<span class="text-slate-400">Net: <span class="text-emerald-300 font-bold">{fmt(groupNet)}</span></span>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Tournament Work Orders -->
{#if data.results.length > 0}
<div class="container mx-auto px-6 pb-2">
	<div class="rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden">

		<!-- Header -->
		<div class="flex items-center justify-between px-5 py-4 gap-3 flex-wrap">
			<div class="flex items-center gap-3">
				<div class="size-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-900/40 border border-blue-700">
					<FileText class="size-4 text-blue-400" />
				</div>
				<div>
					<p class="font-bold text-white text-sm">
						Tournament Work Orders
					</p>
					<p class="text-xs text-slate-500 mt-0.5">
						{workOrderCount} work orders · {fmt(totalWorkOrderAmount)} total
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2 shrink-0">
				<form method="POST" action="?/generateWorkOrders" use:enhance={() => {
					workOrderActionError = '';
					generatingWO = true;
					return async ({ result, update }) => {
						try {
							await update();
							if (result.type === 'failure' && result.data?.error) {
								workOrderActionError = String(result.data.error);
							}
							await invalidateAll();
						} finally {
							generatingWO = false;
						}
					};
				}}>
					<button type="submit" disabled={generatingWO}
						class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
						{#if generatingWO}<Loader2 class="size-3.5 animate-spin" />{:else}<FileText class="size-3.5" />{/if}
						Generate Work Orders
					</button>
				</form>
				<a href="/dashboard/work-orders" class="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 transition-colors" title="View all work orders">
					<ExternalLink class="size-3.5" />
				</a>
			</div>
		</div>

		{#if workOrderActionError}
			<div class="border-t border-red-900/40 px-5 py-3 text-xs text-red-300 bg-red-950/20">
				{workOrderActionError}
			</div>
		{/if}

		<!-- Work order summary strip -->
		{#if (data.proPayments ?? []).length > 0}
			<div class="border-t border-slate-700/50 px-5 py-3 flex flex-wrap gap-5 text-xs bg-slate-900/30">
				<span class="text-slate-400">Pros: <span class="text-emerald-300 font-semibold">{fmt(totalProPayments)}</span></span>
				<span class="text-slate-400">Managers: <span class="text-amber-300 font-semibold">{fmt(totalMgrPayments)}</span></span>
				<span class="text-slate-400">Total: <span class="text-white font-bold">{fmt(totalPayments)}</span></span>
				<span class="text-slate-400 ml-auto">
					{#if pendingCount > 0}
						<span class="text-amber-400">{pendingCount} pending</span>
					{/if}
					{#if paidCount > 0}
						<span class="text-emerald-400 ml-2">{paidCount} paid</span>
					{/if}
				</span>
			</div>
		{/if}
		<!-- Work order list -->
		{#if (data.workOrders ?? []).length > 0}
			<div class="border-t border-slate-700/50 px-5 py-4 space-y-3">
				<div class="rounded-lg border border-slate-700 bg-slate-950/40 overflow-hidden">
					<div class="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
						<p class="text-xs font-semibold text-slate-300">Payment to Work Order Mapping</p>
						<p class="text-[10px] text-slate-500">Grouped by recipient</p>
					</div>
					<div class="overflow-x-auto">
						<table class="min-w-full text-left text-xs">
							<thead class="text-slate-500 uppercase tracking-wide">
								<tr class="border-b border-slate-800">
									<th class="px-4 py-2 font-semibold">Recipient</th>
									<th class="px-4 py-2 font-semibold">Payment</th>
									<th class="px-4 py-2 font-semibold">Work Order</th>
									<th class="px-4 py-2 font-semibold text-right">Amount</th>
								</tr>
							</thead>
							<tbody>
								{#each workOrderMappings as row}
									<tr class="border-b border-slate-800/70 last:border-b-0">
										<td class="px-4 py-2 align-top">
											<Badge class={row.recipient === 'manager' ? 'bg-amber-900/40 text-amber-300 border border-amber-700' : row.recipient === 'franchise' ? 'bg-purple-900/40 text-purple-300 border border-purple-700' : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'}>
												{row.recipient}
											</Badge>
										</td>
										<td class="px-4 py-2 align-top text-slate-200">{row.paymentName}</td>
										<td class="px-4 py-2 align-top font-mono text-blue-300">{row.workOrderNumber}</td>
										<td class="px-4 py-2 align-top text-right font-semibold text-slate-100">{fmt(row.amount)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				{#each workOrdersByRecipient() as group}
					<div class="rounded-lg border border-slate-700 bg-slate-900/40 overflow-hidden">
						<div class="px-4 py-2.5 flex items-center justify-between gap-3 border-b border-slate-800">
							<div class="flex items-center gap-2 min-w-0">
								<Badge class={group.recipient === 'manager' ? 'bg-amber-900/40 text-amber-300 border border-amber-700' : group.recipient === 'franchise' ? 'bg-purple-900/40 text-purple-300 border border-purple-700' : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700'}>
									{group.recipient}
								</Badge>
								<p class="text-xs text-slate-400 truncate">{group.workOrders.length} work order{group.workOrders.length === 1 ? '' : 's'}</p>
							</div>
							<p class="text-xs font-semibold text-slate-200">{fmt(group.total)}</p>
						</div>
						<div class="divide-y divide-slate-800">
							{#each group.workOrders as workOrder}
								<div class="px-4 py-2.5 flex items-center justify-between gap-3">
									<div class="min-w-0">
										<p class="font-mono text-xs text-blue-300 truncate">{workOrder.work_order_number}</p>
										<p class="text-[10px] text-slate-500 truncate">{workOrder.description || 'Tournament payout work order'} · {workOrder.status}</p>
									</div>
									<div class="text-right shrink-0">
										<p class="text-xs font-bold text-emerald-300">{fmt(workOrder.amount ?? 0)}</p>
										<p class="text-[10px] text-slate-500">{workOrder.proPayment?.length ?? 0} payment(s)</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="border-t border-slate-700/50 px-5 py-4 text-sm text-slate-500">
				No work orders yet. Use <span class="text-slate-300 font-semibold">Generate Work Orders</span> to create one work order per payment.
			</div>
		{/if}
	</div>
</div>
{/if}

<!-- Testing Tools -->
{#if data.results.length > 0}
	<div class="container mx-auto px-6 pb-2">
		<details class="group rounded-xl border border-red-900/40 bg-red-950/10 overflow-hidden">
			<summary class="flex items-center gap-2 px-4 py-3 cursor-pointer text-xs font-semibold text-red-400 hover:text-red-300 list-none select-none">
				<RotateCcw class="size-3.5" />
				Testing Tools
				<span class="text-red-700 font-normal ml-1">— clear seeded data for this tournament</span>
			</summary>
			<div class="px-4 pb-4 pt-1 border-t border-red-900/30">
				<p class="text-xs text-slate-500 mb-3">
					Deletes all {data.results.length} results, associated payments, and work orders for this tournament. Resets status to <span class="text-slate-400">scheduled</span>.
				</p>
				<form method="POST" action="?/clearTestData" use:enhance={() => {
					clearingTestData = true;
					return async ({ update }) => { await update(); clearingTestData = false; };
				}}>
					<button type="submit" disabled={clearingTestData}
						class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-800/60 border border-red-700/60 text-red-300 text-xs font-semibold transition-colors disabled:opacity-50">
						{#if clearingTestData}
							<Loader2 class="size-3.5 animate-spin" />
						{:else}
							<RotateCcw class="size-3.5" />
						{/if}
						Clear Test Data
					</button>
				</form>
			</div>
		</details>
	</div>
{/if}

<!-- Manager Cut Overlay -->
{#if showMgrOverlay}
<div class="fixed inset-0 bg-black/70 flex items-start justify-center z-50 overflow-y-auto py-8 px-4">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl">

		<!-- Header -->
		<div class="flex items-center justify-between px-6 py-4 border-b border-slate-700">
			<div>
				<h2 class="text-lg font-bold text-white">Manager Cuts — {data.tournament.name}</h2>
				<p class="text-xs text-slate-400 mt-0.5">Set manager % per pro. Saves to talent record and recalculates payments.</p>
			</div>
			<button type="button" onclick={() => showMgrOverlay = false}
				class="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors">
				<X class="size-5" />
			</button>
		</div>

		<!-- Bulk presets -->
		<div class="px-6 py-3 border-b border-slate-800 flex items-center gap-3 flex-wrap">
			<span class="text-xs text-slate-500 font-semibold uppercase tracking-wide">Bulk set all:</span>
			{#each [0, 10, 12, 15, 20] as pct}
				<button type="button" onclick={() => applyBulkPct(pct)}
					class="text-xs px-2.5 py-1 rounded-full border border-slate-600 bg-slate-800 hover:border-amber-600 hover:text-amber-300 text-slate-400 transition-colors font-semibold">
					{pct === 0 ? 'None' : `${pct}%`}
				</button>
			{/each}
			<span class="text-xs text-slate-600 ml-2">or edit individually below</span>
		</div>

		<!-- Pro rows -->
		<div class="divide-y divide-slate-800 max-h-[60vh] overflow-y-auto">
			{#each overlayRows() as row}
				{@const edit = overlayEdits[row.resultId] ?? { cutPct: row.cutPct, managerName: row.managerName, managerEmail: row.managerEmail }}
				{@const mgrAmt = edit.cutPct > 0 ? Math.round(row.gross * edit.cutPct) / 100 : 0}
				{@const netAmt = row.gross - mgrAmt}

				<div class="px-6 py-3 grid grid-cols-[auto_1fr_auto] gap-4 items-start">
					<!-- Left: pro info -->
					<div class="flex items-center gap-2 pt-1">
						<span class="text-xs font-black w-7 text-center {row.placement <= 3 ? 'text-amber-400' : 'text-slate-500'}">#{row.placement}</span>
						<div>
							<p class="text-sm font-semibold text-slate-100">{row.proName}</p>
							<p class="text-[10px] text-slate-500">{row.franchise} · {row.gender === 'female' ? 'FPO' : 'MPO'}</p>
						</div>
					</div>

					<!-- Middle: manager fields -->
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
						<div>
							<label class="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Manager Name</label>
							<input type="text" value={edit.managerName}
								oninput={(e) => { overlayEdits[row.resultId] = { ...edit, managerName: (e.target as HTMLInputElement).value }; }}
								placeholder="No manager"
								class="w-full rounded border border-slate-700 bg-slate-800 text-slate-100 px-2 py-1.5 text-xs placeholder:text-slate-600" />
						</div>
						<div>
							<label class="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Manager Email</label>
							<input type="email" value={edit.managerEmail}
								oninput={(e) => { overlayEdits[row.resultId] = { ...edit, managerEmail: (e.target as HTMLInputElement).value }; }}
								placeholder="email@example.com"
								class="w-full rounded border border-slate-700 bg-slate-800 text-slate-100 px-2 py-1.5 text-xs placeholder:text-slate-600" />
						</div>
						<div>
							<label class="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Cut %</label>
							<input type="number" min="0" max="50" step="1" value={edit.cutPct}
								oninput={(e) => { overlayEdits[row.resultId] = { ...edit, cutPct: Number((e.target as HTMLInputElement).value) }; }}
								class="w-full rounded border border-slate-700 bg-slate-800 text-slate-100 px-2 py-1.5 text-xs text-center" />
						</div>
					</div>

					<!-- Right: earnings preview -->
					<div class="text-right text-xs pt-1 shrink-0">
						<p class="text-slate-400">Gross <span class="text-slate-200 font-semibold">{fmt(row.gross)}</span></p>
						{#if mgrAmt > 0}
							<p class="text-amber-400">Mgr −{fmt(mgrAmt)}</p>
						{/if}
						<p class="text-emerald-300 font-bold">Net {fmt(netAmt)}</p>
					</div>
				</div>
			{/each}
		</div>

		<!-- Footer: apply all -->
		<div class="px-6 py-4 border-t border-slate-700 flex items-center justify-between gap-3">
			<p class="text-xs text-slate-500">
				Changes apply to talent records + recalculate all payment amounts.
			</p>
			<div class="flex items-center gap-2">
				<button type="button" onclick={() => showMgrOverlay = false}
					class="px-4 py-2 rounded-lg border border-slate-600 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
					Cancel
				</button>
				<form method="POST" action="?/applyManagerCuts" use:enhance={() => {
					mgrOverlaySaving = true;
					return async ({ update }) => { await update(); mgrOverlaySaving = false; showMgrOverlay = false; };
				}}>
					<input type="hidden" name="cuts" value={JSON.stringify(
						Object.entries(overlayEdits).map(([resultId, e]) => ({
							resultId,
							cutPct:       e.cutPct,
							managerName:  e.managerName,
							managerEmail: e.managerEmail,
						}))
					)} />
					<button type="submit" disabled={mgrOverlaySaving}
						class="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
						{#if mgrOverlaySaving}<Loader2 class="size-4 animate-spin" />{:else}<CheckCircle class="size-4" />{/if}
						Apply All Cuts
					</button>
				</form>
			</div>
		</div>
	</div>
</div>
{/if}

<!-- Add Result Modal -->
{#if showAddResultModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
			<h2 class="text-2xl font-bold mb-4 text-slate-100">Add Tournament Result</h2>
			<form method="POST" action="?/addResult" use:enhance>
				<div class="space-y-4">
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Division *</label>
						<select name="division" required class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
							<option value="mens">Men's</option>
							<option value="womens">Women's</option>
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Pro *</label>
						<select name="pro" required class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
							<option value="">Select Pro</option>
							{#each data.pros as pro}
								<option value={pro.id}>{pro.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Franchise</label>
						<select name="franchise" class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm">
							<option value="">None / Independent</option>
							{#each data.franchises as franchise}
								<option value={franchise.id}>{franchise.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Placement *</label>
						<input
							type="number"
							name="placement"
							required
							min="1"
							max="20"
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Score</label>
						<input
							type="text"
							name="score"
							placeholder="e.g., -15"
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Rounds</label>
						<input
							type="number"
							name="rounds"
							min="1"
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Notes</label>
						<textarea name="notes" rows="2" class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm"></textarea>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-6">
					<Button type="button" variant="outline" onclick={() => (showAddResultModal = false)}>Cancel</Button>
					<Button type="submit">Add Result</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
