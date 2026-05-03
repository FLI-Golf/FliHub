<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Plus, X, ChevronDown, Pencil, Shield, FileText, AlertCircle, CheckCircle2, Clock, Download, Loader, Trash2 } from 'lucide-svelte';
	import type { PageData } from './$types';
	import {
		TRADEMARK_STATUS_LABELS, TRADEMARK_STATUS_COLORS, TRADEMARK_PIPELINE,
		MARK_TYPE_LABELS, TRADEMARK_CLASS_LABELS, LOGO_VARIANT_LABELS
	} from '$lib/domain/schemas/trademark.schema';

	let { data }: { data: PageData } = $props();

	const pbUrl = 'https://pocketbase-production-6ab5.up.railway.app';

	// ── Helpers ───────────────────────────────────────────────────────────────
	function getLogoUrl(franchise: any) {
		const file = franchise.logoMini?.[0] ?? franchise.logoFull?.[0];
		if (!file) return null;
		return `${pbUrl}/api/files/${franchise.collectionId}/${franchise.id}/${file}?thumb=80x80`;
	}

	function fmtDate(d: string) {
		return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
	}

	// ── Derived data ──────────────────────────────────────────────────────────
	// Group filings by franchiseId
	const filingsByFranchise = $derived(
		data.franchises.map((f: any) => ({
			franchise: f,
			filings: data.filings.filter((fi: any) => fi.franchiseId === f.id)
		}))
	);

	// Summary counts
	const totalFilings   = $derived(data.filings.length);
	const approvedCount  = $derived(data.filings.filter((f: any) => f.status === 'approved').length);
	const filedCount     = $derived(data.filings.filter((f: any) => ['filed','published'].includes(f.status)).length);
	const pendingCount   = $derived(data.filings.filter((f: any) => ['not_filed','attorney_review'].includes(f.status)).length);
	const issueCount     = $derived(data.filings.filter((f: any) => ['opposition','rejected','abandoned'].includes(f.status)).length);

	// ── Filter state ──────────────────────────────────────────────────────────
	let filterStatus     = $state('all');
	let filterFranchise  = $state('all');
	let expandedFranchise = $state<string | null>(null);

	const filteredFilings = $derived(
		data.filings.filter((f: any) => {
			if (filterStatus !== 'all' && f.status !== filterStatus) return false;
			if (filterFranchise !== 'all' && f.franchiseId !== filterFranchise) return false;
			return true;
		})
	);

	// ── New filing modal ──────────────────────────────────────────────────────
	let showNew   = $state(false);
	let saving    = $state(false);
	let err       = $state('');
	let newForm   = $state({
		franchiseId: '',
		markType: 'word_mark',
		logoVariant: 'none',
		trademarkClass: 'ic_041',
		status: 'not_filed',
		usptoAppNumber: '',
		usptoSerialNumber: '',
		filedDate: '',
		attorneyNotes: '',
		internalNotes: ''
	});

	async function submitNew(e: SubmitEvent) {
		e.preventDefault();
		if (!newForm.franchiseId) { err = 'Select a franchise'; return; }
		saving = true; err = '';
		try {
			const res = await fetch('/api/trademarks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newForm)
			});
			if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? `Error ${res.status}`); }
			showNew = false;
			newForm = { franchiseId: '', markType: 'word_mark', logoVariant: 'none', trademarkClass: 'ic_041', status: 'not_filed', usptoAppNumber: '', usptoSerialNumber: '', filedDate: '', attorneyNotes: '', internalNotes: '' };
			await invalidateAll();
		} catch (e: any) { err = e.message ?? 'Failed'; }
		finally { saving = false; }
	}

	// ── Edit filing modal ─────────────────────────────────────────────────────
	let editFiling  = $state<any | null>(null);
	let editSaving  = $state(false);
	let editErr     = $state('');

	function openEdit(filing: any) {
		editFiling = { ...filing };
		editErr = '';
	}

	async function submitEdit(e: SubmitEvent) {
		e.preventDefault();
		if (!editFiling) return;
		editSaving = true; editErr = '';
		try {
			const res = await fetch(`/api/trademarks/${editFiling.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editFiling)
			});
			if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? `Error ${res.status}`); }
			editFiling = null;
			await invalidateAll();
		} catch (e: any) { editErr = e.message ?? 'Failed'; }
		finally { editSaving = false; }
	}

	const INPUT  = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-500';
	const SELECT = INPUT + ' cursor-pointer';
	const LABEL  = 'block text-xs font-medium text-slate-400 mb-1';

	// ── Delete filing ─────────────────────────────────────────────────────────
	let confirmDelete = $state<any | null>(null); // filing to confirm deletion
	let deleting      = $state(false);

	async function deleteFiling() {
		if (!confirmDelete) return;
		deleting = true;
		try {
			const res = await fetch(`/api/trademarks/${confirmDelete.id}`, { method: 'DELETE' });
			if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? `Error ${res.status}`); }
			confirmDelete = null;
			await invalidateAll();
		} catch (e: any) { alert(e.message ?? 'Delete failed'); }
		finally { deleting = false; }
	}

	// ── Tab state ─────────────────────────────────────────────────────────────
	let activeTab = $state<'franchises' | 'league'>('franchises');

	// ── PDF generation ────────────────────────────────────────────────────────
	let pdfLoading = $state<string | null>(null); // key of which button is loading

	async function generatePDF(opts: {
		key: string;
		mode: 'combined' | 'individual';
		franchiseIds?: string[];
		includeLeague?: boolean;
		markIndex?: number;
	}) {
		pdfLoading = opts.key;
		try {
			const res = await fetch('/api/trademarks/pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mode:         opts.mode,
					franchiseIds: opts.franchiseIds,
					includeLeague:opts.includeLeague ?? false,
					markIndex:    opts.markIndex
				})
			});
			if (!res.ok) {
				const d = await res.json().catch(() => ({}));
				alert(d.message ?? `PDF generation failed (${res.status})`);
				return;
			}
			// Trigger browser download
			const blob = await res.blob();
			const url  = URL.createObjectURL(blob);
			const a    = document.createElement('a');
			a.href     = url;
			a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
				?? 'FLI-Trademark.pdf';
			a.click();
			URL.revokeObjectURL(url);
		} catch (e: any) {
			alert(e.message ?? 'PDF generation failed');
		} finally {
			pdfLoading = null;
		}
	}
</script>

<svelte:head><title>Trademark Pipeline — FliHub</title></svelte:head>

<div class="space-y-6 max-w-7xl">

	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Trademark Pipeline</h1>
			<p class="text-muted-foreground mt-1">Track USPTO filings for all 12 franchise names and logos</p>
		</div>

		<div class="flex items-center gap-2 flex-wrap justify-end shrink-0">
			<Button
				onclick={() => generatePDF({ key: 'all', mode: 'combined' })}
				disabled={pdfLoading !== null || totalFilings === 0}
				class="gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600"
			>
				{#if pdfLoading === 'all'}<Loader class="size-4 animate-spin" />{:else}<Download class="size-4" />{/if}
				All Franchises
			</Button>
			<Button
				onclick={() => generatePDF({ key: 'all+league', mode: 'combined', includeLeague: true })}
				disabled={pdfLoading !== null || totalFilings === 0}
				class="gap-2 bg-violet-700 hover:bg-violet-600 text-white"
			>
				{#if pdfLoading === 'all+league'}<Loader class="size-4 animate-spin" />{:else}<Download class="size-4" />{/if}
				All + League
			</Button>
			{#if data.isAdmin}
				<Button onclick={() => { showNew = true; err = ''; }} class="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
					<Plus class="size-4" /> New Filing
				</Button>
			{/if}
		</div>
	</div>

	<!-- Metrics row -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<Card class="p-4 bg-slate-800/50 border-slate-700">
			<p class="text-xs text-slate-400 uppercase tracking-wide">Total Filings</p>
			<p class="text-3xl font-bold text-slate-100 mt-1">{totalFilings}</p>
			<p class="text-xs text-slate-500 mt-0.5">across {data.franchises.length} franchises</p>
		</Card>
		<Card class="p-4 bg-emerald-950/40 border-emerald-800">
			<p class="text-xs text-emerald-400 uppercase tracking-wide">Approved</p>
			<p class="text-3xl font-bold text-emerald-300 mt-1">{approvedCount}</p>
			<p class="text-xs text-emerald-600 mt-0.5">registered marks</p>
		</Card>
		<Card class="p-4 bg-violet-950/40 border-violet-800">
			<p class="text-xs text-violet-400 uppercase tracking-wide">In Progress</p>
			<p class="text-3xl font-bold text-violet-300 mt-1">{filedCount}</p>
			<p class="text-xs text-violet-600 mt-0.5">filed or published</p>
		</Card>
		<Card class="p-4 {issueCount > 0 ? 'bg-orange-950/40 border-orange-800' : 'bg-slate-800/50 border-slate-700'}">
			<p class="text-xs {issueCount > 0 ? 'text-orange-400' : 'text-slate-400'} uppercase tracking-wide">Needs Attention</p>
			<p class="text-3xl font-bold {issueCount > 0 ? 'text-orange-300' : 'text-slate-400'} mt-1">{issueCount}</p>
			<p class="text-xs {issueCount > 0 ? 'text-orange-600' : 'text-slate-600'} mt-0.5">opposition / rejected</p>
		</Card>
	</div>

	<!-- Tab switcher -->
	<div class="flex items-center gap-1 border-b border-slate-700">
		<button
			onclick={() => activeTab = 'franchises'}
			class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px {activeTab === 'franchises' ? 'border-violet-500 text-violet-300' : 'border-transparent text-slate-400 hover:text-slate-200'}"
		>
			Franchises
			<span class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full {activeTab === 'franchises' ? 'bg-violet-900/60 text-violet-300' : 'bg-slate-700 text-slate-400'}">{data.filings.length}</span>
		</button>
		<button
			onclick={() => activeTab = 'league'}
			class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px {activeTab === 'league' ? 'border-violet-500 text-violet-300' : 'border-transparent text-slate-400 hover:text-slate-200'}"
		>
			League
			<span class="ml-1.5 text-xs px-1.5 py-0.5 rounded-full {activeTab === 'league' ? 'bg-violet-900/60 text-violet-300' : 'bg-slate-700 text-slate-400'}">{data.leagueFilings?.length ?? 0}</span>
		</button>
	</div>

	{#if activeTab === 'franchises'}
	<!-- Filters -->
	<div class="flex flex-wrap gap-3 items-center">
		<select bind:value={filterStatus} class="text-sm rounded-lg border border-slate-600 bg-slate-800 text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500">
			<option value="all">All Statuses</option>
			{#each Object.entries(TRADEMARK_STATUS_LABELS) as [val, label]}
				<option value={val}>{label}</option>
			{/each}
		</select>
		<select bind:value={filterFranchise} class="text-sm rounded-lg border border-slate-600 bg-slate-800 text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500">
			<option value="all">All Franchises</option>
			{#each data.franchises as f}
				<option value={f.id}>{f.name}</option>
			{/each}
		</select>
		{#if filterStatus !== 'all' || filterFranchise !== 'all'}
			<button onclick={() => { filterStatus = 'all'; filterFranchise = 'all'; }} class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1">
				<X class="size-3.5" /> Clear filters
			</button>
			<span class="text-xs text-slate-500">{filteredFilings.length} result{filteredFilings.length !== 1 ? 's' : ''}</span>
		{/if}
	</div>

	<!-- Franchise accordion grid -->
	<div class="space-y-3">
		{#each filingsByFranchise as { franchise, filings: fFilings }}
			{@const visible = filterFranchise === 'all' || filterFranchise === franchise.id}
			{@const statusFiltered = filterStatus === 'all' ? fFilings : fFilings.filter((f: any) => f.status === filterStatus)}
			{#if visible && (filterStatus === 'all' || statusFiltered.length > 0)}
				{@const approved  = fFilings.filter((f: any) => f.status === 'approved').length}
				{@const total     = fFilings.length}
				{@const hasIssue  = fFilings.some((f: any) => ['opposition','rejected','abandoned'].includes(f.status))}
				{@const isOpen    = expandedFranchise === franchise.id}

				<Card class="bg-slate-800/50 border-slate-700 overflow-hidden">
					<!-- Franchise header row -->
					<button
						onclick={() => expandedFranchise = isOpen ? null : franchise.id}
						class="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-700/30 transition-colors"
					>
						<!-- Logo -->
						<div
							class="size-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
							style="background: linear-gradient(135deg, {franchise.primaryColor || '#6d28d9'} 0%, {franchise.secondaryColor || '#4c1d95'} 100%)"
						>
							{#if getLogoUrl(franchise)}
								<img src={getLogoUrl(franchise)} alt={franchise.name} class="size-9 object-contain" />
							{:else}
								<span class="text-white font-bold text-sm">{franchise.name.slice(0,2)}</span>
							{/if}
						</div>

						<!-- Name + progress -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="font-semibold text-slate-100">{franchise.name}</span>
								{#if hasIssue}
									<AlertCircle class="size-4 text-orange-400 shrink-0" />
								{/if}
							</div>
							<div class="flex items-center gap-3 mt-1">
								<!-- Mini progress bar -->
								<div class="flex-1 max-w-32 bg-slate-700 rounded-full h-1.5 overflow-hidden">
									<div
										class="h-full rounded-full bg-emerald-500 transition-all"
										style="width: {total > 0 ? Math.round((approved / total) * 100) : 0}%"
									></div>
								</div>
								<span class="text-xs text-slate-400">{approved}/{total} approved</span>
							</div>
						</div>

						<!-- Status pills summary -->
						<div class="hidden md:flex items-center gap-1.5 flex-wrap justify-end max-w-xs">
							{#each fFilings.slice(0, 6) as f}
								<span class="text-[10px] px-1.5 py-0.5 rounded border {TRADEMARK_STATUS_COLORS[f.status]}">
									{TRADEMARK_STATUS_LABELS[f.status]}
								</span>
							{/each}
							{#if fFilings.length > 6}
								<span class="text-[10px] text-slate-500">+{fFilings.length - 6}</span>
							{/if}
						</div>

						<ChevronDown class="size-4 text-slate-400 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
					</button>

					<!-- Expanded filings table -->
					{#if isOpen}
						<div class="border-t border-slate-700">
							{#if statusFiltered.length === 0}
								<p class="text-sm text-slate-500 px-4 py-3">No filings match the current filter.</p>
							{:else}
								<div class="overflow-x-auto">
									<table class="w-full text-sm">
										<thead>
											<tr class="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-700/60 bg-slate-900/30">
												<th class="px-4 py-2.5">Mark Type</th>
												<th class="px-4 py-2.5">Logo Variant</th>
												<th class="px-4 py-2.5">Class</th>
												<th class="px-4 py-2.5">Status</th>
												<th class="px-4 py-2.5">USPTO #</th>
												<th class="px-4 py-2.5">Filed</th>
												<th class="px-4 py-2.5">Approved</th>
												<th class="px-4 py-2.5">Attorney Notes</th>
												{#if data.isAdmin}
													<th class="px-4 py-2.5"></th>
												{/if}
											</tr>
										</thead>
										<tbody class="divide-y divide-slate-700/40">
											{#each statusFiltered as filing}
												<tr class="hover:bg-slate-700/20 group">
													<td class="px-4 py-2.5 text-slate-200 font-medium whitespace-nowrap">
														{MARK_TYPE_LABELS[filing.markType] ?? filing.markType}
													</td>
													<td class="px-4 py-2.5 text-slate-400 whitespace-nowrap text-xs">
														{LOGO_VARIANT_LABELS[filing.logoVariant] ?? filing.logoVariant}
													</td>
													<td class="px-4 py-2.5 text-slate-400 whitespace-nowrap text-xs">
														{TRADEMARK_CLASS_LABELS[filing.trademarkClass] ?? filing.trademarkClass}
													</td>
													<td class="px-4 py-2.5 whitespace-nowrap">
														<span class="text-xs px-2 py-0.5 rounded-full border {TRADEMARK_STATUS_COLORS[filing.status]}">
															{TRADEMARK_STATUS_LABELS[filing.status]}
														</span>
													</td>
													<td class="px-4 py-2.5 font-mono text-xs text-slate-300 whitespace-nowrap">
														{filing.usptoAppNumber || '—'}
													</td>
													<td class="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">
														{fmtDate(filing.filedDate)}
													</td>
													<td class="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">
														{fmtDate(filing.approvedDate)}
													</td>
													<td class="px-4 py-2.5 text-slate-500 text-xs max-w-48 truncate" title={filing.attorneyNotes}>
														{filing.attorneyNotes || '—'}
													</td>
													{#if data.isAdmin}
														<td class="px-4 py-2.5">
															<div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
																<button onclick={() => openEdit(filing)} class="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-slate-200" title="Edit">
																	<Pencil class="size-3.5" />
																</button>
																<button onclick={() => confirmDelete = filing} class="p-1 rounded hover:bg-red-900/50 text-slate-400 hover:text-red-400" title="Delete">
																	<Trash2 class="size-3.5" />
																</button>
															</div>
														</td>
													{/if}
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}

							<!-- Per-franchise actions -->
							<div class="px-4 py-3 border-t border-slate-700/60 flex items-center gap-4">
								{#if data.isAdmin}
									<button
										onclick={() => { newForm.franchiseId = franchise.id; showNew = true; err = ''; }}
										class="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors"
									>
										<Plus class="size-3.5" /> Add filing
									</button>
								{/if}
								{#if fFilings.length > 0}
									<button
										onclick={() => generatePDF({ key: `pdf-${franchise.id}`, mode: 'combined', franchiseIds: [franchise.id] })}
										disabled={pdfLoading !== null}
										class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-40"
									>
										{#if pdfLoading === `pdf-${franchise.id}`}
											<Loader class="size-3.5 animate-spin" />
										{:else}
											<Download class="size-3.5" />
										{/if}
										Download PDF
									</button>
								{/if}
							</div>
						</div>
					{/if}
				</Card>
			{/if}
		{/each}
	</div>
	{/if}<!-- end franchises tab -->

	<!-- ── League Tab ────────────────────────────────────────────────────── -->
	{#if activeTab === 'league'}
		{#if !data.league}
			<div class="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-6 text-sm text-slate-500 justify-center">
				No league record found in PocketBase.
			</div>
		{:else}
			{@const lg = data.league}
			{@const lgFilings = data.leagueFilings ?? []}
			{@const lgApproved = lgFilings.filter((f: any) => f.status === 'approved').length}

			<Card class="bg-slate-800/50 border-slate-700 overflow-hidden">
				<!-- League header -->
				<div class="flex items-center gap-4 p-4 border-b border-slate-700">
					<div class="size-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-700 to-violet-900">
						{#if lg.logoMens?.[0]}
							<img src="{`https://pocketbase-production-6ab5.up.railway.app/api/files/${lg.collectionId}/${lg.id}/${lg.logoMens[0]}?thumb=80x80`}" alt="FLI Golf League" class="size-9 object-contain" />
						{:else}
							<span class="text-white font-bold text-sm">FLI</span>
						{/if}
					</div>
					<div class="flex-1">
						<p class="font-semibold text-slate-100">{lg.name ?? 'FLI Golf League'}</p>
						<p class="text-xs text-slate-400 mt-0.5">{lgApproved}/{lgFilings.length} approved</p>
					</div>
					{#if data.isAdmin}
						<button
							onclick={() => { newForm.franchiseId = lg.id; showNew = true; err = ''; }}
							class="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors"
						>
							<Plus class="size-3.5" /> Add filing
						</button>
					{/if}
					{#if lgFilings.length > 0}
						<button
							onclick={() => generatePDF({ key: 'league-pdf', mode: 'combined', includeLeague: true, franchiseIds: [] })}
							disabled={pdfLoading !== null}
							class="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-40"
						>
							{#if pdfLoading === 'league-pdf'}<Loader class="size-3.5 animate-spin" />{:else}<Download class="size-3.5" />{/if}
							Download PDF
						</button>
					{/if}
				</div>

				<!-- League logo variants as filing targets -->
				<div class="p-4 border-b border-slate-700/60 bg-slate-900/20">
					<p class="text-xs text-slate-500 uppercase tracking-wide mb-3">Available Logo Assets</p>
					<div class="flex flex-wrap gap-2">
						{#each [
							{ label: "Men's Logo",   files: lg.logoMens },
							{ label: "Women's Logo",  files: lg.logoWomens },
							{ label: 'Monochrome',    files: lg.logoMonochrome },
							{ label: 'Wordmark',      files: lg.logoWordmark },
							{ label: 'Horizontal',    files: lg.logoHorizontal },
							{ label: 'Vertical',      files: lg.logoVertical }
						] as variant}
							{#if variant.files?.length}
								<div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
									<img
										src="{`https://pocketbase-production-6ab5.up.railway.app/api/files/${lg.collectionId}/${lg.id}/${variant.files[0]}?thumb=48x48`}"
										alt={variant.label}
										class="size-6 object-contain"
									/>
									<span class="text-xs text-slate-300">{variant.label}</span>
									<span class="text-[10px] text-slate-500">{variant.files.length} file{variant.files.length !== 1 ? 's' : ''}</span>
								</div>
							{/if}
						{/each}
					</div>
				</div>

				<!-- League filings table -->
				{#if lgFilings.length === 0}
					<p class="text-sm text-slate-500 px-4 py-6 text-center">No filings yet. Use "Add filing" to create the first league trademark filing.</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-700/60 bg-slate-900/30">
									<th class="px-4 py-2.5">Mark Type</th>
									<th class="px-4 py-2.5">Logo Variant</th>
									<th class="px-4 py-2.5">Class</th>
									<th class="px-4 py-2.5">Status</th>
									<th class="px-4 py-2.5">USPTO #</th>
									<th class="px-4 py-2.5">Filed</th>
									<th class="px-4 py-2.5">Approved</th>
									<th class="px-4 py-2.5">Attorney Notes</th>
									{#if data.isAdmin}<th class="px-4 py-2.5 w-16"></th>{/if}
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-700/40">
								{#each lgFilings as filing}
									<tr class="hover:bg-slate-700/20 group">
										<td class="px-4 py-2.5 text-slate-200 font-medium whitespace-nowrap">{MARK_TYPE_LABELS[filing.markType] ?? filing.markType}</td>
										<td class="px-4 py-2.5 text-slate-400 whitespace-nowrap text-xs">{LOGO_VARIANT_LABELS[filing.logoVariant] ?? filing.logoVariant}</td>
										<td class="px-4 py-2.5 text-slate-400 whitespace-nowrap text-xs">{TRADEMARK_CLASS_LABELS[filing.trademarkClass] ?? filing.trademarkClass}</td>
										<td class="px-4 py-2.5 whitespace-nowrap">
											<span class="text-xs px-2 py-0.5 rounded-full border {TRADEMARK_STATUS_COLORS[filing.status]}">{TRADEMARK_STATUS_LABELS[filing.status]}</span>
										</td>
										<td class="px-4 py-2.5 font-mono text-xs text-slate-300 whitespace-nowrap">{filing.usptoAppNumber || '—'}</td>
										<td class="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">{fmtDate(filing.filedDate)}</td>
										<td class="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap">{fmtDate(filing.approvedDate)}</td>
										<td class="px-4 py-2.5 text-slate-500 text-xs max-w-48 truncate" title={filing.attorneyNotes}>{filing.attorneyNotes || '—'}</td>
										{#if data.isAdmin}
											<td class="px-4 py-2.5">
												<div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
													<button onclick={() => openEdit(filing)} class="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-slate-200" title="Edit">
														<Pencil class="size-3.5" />
													</button>
													<button onclick={() => confirmDelete = filing} class="p-1 rounded hover:bg-red-900/50 text-slate-400 hover:text-red-400" title="Delete">
														<Trash2 class="size-3.5" />
													</button>
												</div>
											</td>
										{/if}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</Card>
		{/if}
	{/if}<!-- end league tab -->

	<!-- ── New Filing Modal ─────────────────────────────────────────────── -->
	{#if showNew}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
				<div class="flex items-center justify-between px-6 py-4 border-b border-slate-700">
					<div class="flex items-center gap-2">
						<Shield class="size-5 text-violet-400" />
						<h2 class="text-lg font-semibold text-slate-100">New Trademark Filing</h2>
					</div>
					<button onclick={() => { showNew = false; err = ''; }} class="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700">
						<X class="size-5" />
					</button>
				</div>

				<form onsubmit={submitNew} class="px-6 py-5 space-y-4">
					{#if err}
						<div class="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
							<AlertCircle class="size-4 shrink-0" />{err}
						</div>
					{/if}

					<div>
						<label class={LABEL}>Franchise <span class="text-red-400">*</span></label>
						<select bind:value={newForm.franchiseId} class={SELECT} required>
							<option value="">Select…</option>
							{#if data.league}
								<option value={data.league.id}>⭐ {data.league.name ?? 'FLI Golf League'} (League)</option>
							{/if}
							{#each data.franchises as f}
								<option value={f.id}>{f.name}</option>
							{/each}
						</select>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class={LABEL}>Mark Type <span class="text-red-400">*</span></label>
							<select bind:value={newForm.markType} class={SELECT}>
								{#each Object.entries(MARK_TYPE_LABELS) as [val, label]}
									<option value={val}>{label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class={LABEL}>Logo Variant</label>
							<select bind:value={newForm.logoVariant} class={SELECT}>
								{#each Object.entries(LOGO_VARIANT_LABELS) as [val, label]}
									<option value={val}>{label}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class={LABEL}>Trademark Class</label>
							<select bind:value={newForm.trademarkClass} class={SELECT}>
								{#each Object.entries(TRADEMARK_CLASS_LABELS) as [val, label]}
									<option value={val}>{label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class={LABEL}>Status</label>
							<select bind:value={newForm.status} class={SELECT}>
								{#each Object.entries(TRADEMARK_STATUS_LABELS) as [val, label]}
									<option value={val}>{label}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class={LABEL}>USPTO App Number</label>
							<input bind:value={newForm.usptoAppNumber} class={INPUT} placeholder="98/123456" />
						</div>
						<div>
							<label class={LABEL}>Filed Date</label>
							<input type="date" bind:value={newForm.filedDate} class={INPUT} />
						</div>
					</div>

					<div>
						<label class={LABEL}>Attorney Notes</label>
						<textarea bind:value={newForm.attorneyNotes} rows="3" class="{INPUT} resize-none" placeholder="Clearance search results, conflicts, strategy…"></textarea>
					</div>

					<div>
						<label class={LABEL}>Internal Notes</label>
						<textarea bind:value={newForm.internalNotes} rows="2" class="{INPUT} resize-none" placeholder="Internal tracking notes…"></textarea>
					</div>

					<div class="flex justify-end gap-3 pt-2">
						<Button type="button" variant="outline" onclick={() => { showNew = false; err = ''; }} class="border-slate-600 text-slate-300 hover:bg-slate-700">
							Cancel
						</Button>
						<Button type="submit" disabled={saving} class="bg-violet-600 hover:bg-violet-700 text-white gap-2">
							{#if saving}<Clock class="size-4 animate-spin" />{/if}
							{saving ? 'Saving…' : 'Create Filing'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- ── Edit Filing Modal ──────────────────────────────────────────────── -->
	{#if editFiling}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
				<div class="flex items-center justify-between px-6 py-4 border-b border-slate-700">
					<div class="flex items-center gap-2">
						<FileText class="size-5 text-violet-400" />
						<h2 class="text-lg font-semibold text-slate-100">Update Filing</h2>
					</div>
					<button onclick={() => editFiling = null} class="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-700">
						<X class="size-5" />
					</button>
				</div>

				<form onsubmit={submitEdit} class="px-6 py-5 space-y-4">
					{#if editErr}
						<div class="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
							<AlertCircle class="size-4 shrink-0" />{editErr}
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class={LABEL}>Mark Type</label>
							<select bind:value={editFiling.markType} class={SELECT}>
								{#each Object.entries(MARK_TYPE_LABELS) as [val, label]}
									<option value={val}>{label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class={LABEL}>Logo Variant</label>
							<select bind:value={editFiling.logoVariant} class={SELECT}>
								{#each Object.entries(LOGO_VARIANT_LABELS) as [val, label]}
									<option value={val}>{label}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class={LABEL}>Trademark Class</label>
							<select bind:value={editFiling.trademarkClass} class={SELECT}>
								{#each Object.entries(TRADEMARK_CLASS_LABELS) as [val, label]}
									<option value={val}>{label}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class={LABEL}>Status</label>
							<select bind:value={editFiling.status} class={SELECT}>
								{#each Object.entries(TRADEMARK_STATUS_LABELS) as [val, label]}
									<option value={val}>{label}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class={LABEL}>USPTO App Number</label>
							<input bind:value={editFiling.usptoAppNumber} class={INPUT} placeholder="98/123456" />
						</div>
						<div>
							<label class={LABEL}>USPTO Serial Number</label>
							<input bind:value={editFiling.usptoSerialNumber} class={INPUT} placeholder="97/654321" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class={LABEL}>Filed Date</label>
							<input type="date" bind:value={editFiling.filedDate} class={INPUT} />
						</div>
						<div>
							<label class={LABEL}>Published Date</label>
							<input type="date" bind:value={editFiling.publishedDate} class={INPUT} />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label class={LABEL}>Approved Date</label>
							<input type="date" bind:value={editFiling.approvedDate} class={INPUT} />
						</div>
						<div>
							<label class={LABEL}>Renewal Date</label>
							<input type="date" bind:value={editFiling.renewalDate} class={INPUT} />
						</div>
					</div>

					{#if editFiling.status === 'opposition'}
						<div>
							<label class={LABEL}>Opposition Detail</label>
							<textarea bind:value={editFiling.oppositionDetail} rows="3" class="{INPUT} resize-none" placeholder="Describe the opposing party and grounds…"></textarea>
						</div>
					{/if}

					{#if editFiling.status === 'rejected'}
						<div>
							<label class={LABEL}>Rejected Date</label>
							<input type="date" bind:value={editFiling.rejectedDate} class={INPUT} />
						</div>
					{/if}

					<div>
						<label class={LABEL}>Attorney Notes</label>
						<textarea bind:value={editFiling.attorneyNotes} rows="4" class="{INPUT} resize-none" placeholder="Clearance results, office actions, strategy…"></textarea>
					</div>

					<div>
						<label class={LABEL}>Internal Notes</label>
						<textarea bind:value={editFiling.internalNotes} rows="2" class="{INPUT} resize-none" placeholder="Internal tracking notes…"></textarea>
					</div>

					<div class="flex justify-end gap-3 pt-2">
						<Button type="button" variant="outline" onclick={() => editFiling = null} class="border-slate-600 text-slate-300 hover:bg-slate-700">
							Cancel
						</Button>
						<Button type="submit" disabled={editSaving} class="bg-violet-600 hover:bg-violet-700 text-white gap-2">
							{#if editSaving}<Clock class="size-4 animate-spin" />{/if}
							{editSaving ? 'Saving…' : 'Save Changes'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- ── Delete Confirm Modal ──────────────────────────────────────────── -->
	{#if confirmDelete}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
				<div class="flex items-center gap-3">
					<div class="size-10 rounded-full bg-red-900/40 flex items-center justify-center shrink-0">
						<Trash2 class="size-5 text-red-400" />
					</div>
					<div>
						<p class="font-semibold text-slate-100">Delete filing?</p>
						<p class="text-xs text-slate-400 mt-0.5">{MARK_TYPE_LABELS[confirmDelete.markType] ?? confirmDelete.markType} · {LOGO_VARIANT_LABELS[confirmDelete.logoVariant] ?? confirmDelete.logoVariant}</p>
					</div>
				</div>
				<p class="text-sm text-slate-400">This cannot be undone.</p>
				<div class="flex justify-end gap-3">
					<Button variant="outline" onclick={() => confirmDelete = null} class="border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</Button>
					<Button onclick={deleteFiling} disabled={deleting} class="bg-red-700 hover:bg-red-600 text-white gap-2">
						{#if deleting}<Loader class="size-4 animate-spin" />{/if}
						{deleting ? 'Deleting…' : 'Delete'}
					</Button>
				</div>
			</div>
		</div>
	{/if}

</div>
