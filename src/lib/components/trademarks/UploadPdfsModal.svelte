<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { X, ChevronRight, ChevronLeft, Upload, FileText, CheckCircle2, Loader, AlertCircle } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	// ── Props ────────────────────────────────────────────────────────────────
	let {
		open      = $bindable(false),
		franchises = [],
		filings    = []
	}: {
		open:       boolean;
		franchises: any[];
		filings:    any[];
	} = $props();

	// ── The 3 fixed PDF slots ─────────────────────────────────────────────────
	const PDF_SLOTS = [
		{ key: 'origins',  label: 'Origins'         },
		{ key: 'team',     label: 'Team'             },
		{ key: 'quest',    label: 'Quest for Gold'   }
	] as const;

	type SlotKey = typeof PDF_SLOTS[number]['key'];

	// ── State ─────────────────────────────────────────────────────────────────
	let step            = $state<1 | 2 | 3>(1);
	let selectedFranchise = $state<any | null>(null);

	// Per-slot: which filing record to attach to, the file, and upload state
	type SlotState = {
		filingId: string;
		file:     File | null;
		status:   'idle' | 'uploading' | 'done' | 'error';
		error:    string;
	};

	let slots = $state<Record<SlotKey, SlotState>>({
		origins: { filingId: '', file: null, status: 'idle', error: '' },
		team:    { filingId: '', file: null, status: 'idle', error: '' },
		quest:   { filingId: '', file: null, status: 'idle', error: '' }
	});

	// Filings for the selected franchise
	let franchiseFilings = $derived(
		selectedFranchise
			? filings.filter((f: any) => f.franchiseId === selectedFranchise.id)
			: []
	);

	// Overall readiness
	let allFilesChosen = $derived(
		PDF_SLOTS.every(s => slots[s.key].file !== null && slots[s.key].filingId !== '')
	);

	let isUploading = $derived(
		PDF_SLOTS.some(s => slots[s.key].status === 'uploading')
	);

	let allDone = $derived(
		PDF_SLOTS.every(s => slots[s.key].status === 'done')
	);

	// ── Helpers ───────────────────────────────────────────────────────────────
	function logoUrl(franchise: any): string | null {
		const pbUrl = 'https://pocketbase-production-6ab5.up.railway.app';
		const file  = franchise.logoMini?.[0] ?? franchise.logoFull?.[0];
		if (!file) return null;
		return `${pbUrl}/api/files/${franchise.collectionId}/${franchise.id}/${file}?thumb=80x80`;
	}

	function filingLabel(filing: any): string {
		const classMap: Record<string, string> = {
			ic_009: 'IC 009', ic_025: 'IC 025', ic_028: 'IC 028',
			ic_035: 'IC 035', ic_038: 'IC 038', ic_041: 'IC 041', other: 'Other'
		};
		const variantMap: Record<string, string> = {
			none: 'N/A', logoFull: 'Full', logoMini: 'Mini',
			logoHorizontal: 'Horizontal', logoVertical: 'Vertical',
			logoMonochrome: 'Monochrome', logoWordmark: 'Wordmark'
		};
		const cls = classMap[filing.trademarkClass] ?? filing.trademarkClass ?? '—';
		const vrn = variantMap[filing.logoVariant]  ?? filing.logoVariant    ?? '—';
		const hasPdf = filing.pdf ? ' ✓' : '';
		return `${cls} · ${vrn}${hasPdf}`;
	}

	function pickFile(key: SlotKey, e: Event) {
		const input = e.target as HTMLInputElement;
		const file  = input.files?.[0] ?? null;
		slots = { ...slots, [key]: { ...slots[key], file, status: 'idle', error: '' } };
	}

	function selectFranchise(f: any) {
		selectedFranchise = f;
		// Reset slots
		slots = {
			origins: { filingId: '', file: null, status: 'idle', error: '' },
			team:    { filingId: '', file: null, status: 'idle', error: '' },
			quest:   { filingId: '', file: null, status: 'idle', error: '' }
		};
		step = 2;
	}

	function back() {
		if (step === 2) { step = 1; selectedFranchise = null; }
		if (step === 3) { step = 2; }
	}

	function close() {
		open = false;
		// Reset everything
		step = 1;
		selectedFranchise = null;
		slots = {
			origins: { filingId: '', file: null, status: 'idle', error: '' },
			team:    { filingId: '', file: null, status: 'idle', error: '' },
			quest:   { filingId: '', file: null, status: 'idle', error: '' }
		};
	}

	async function uploadAll() {
		step = 3;

		for (const { key, label } of PDF_SLOTS) {
			const slot = slots[key];
			if (!slot.file || !slot.filingId) continue;

			slots = { ...slots, [key]: { ...slot, status: 'uploading', error: '' } };

			try {
				const fd = new FormData();
				fd.append('pdf',      slot.file, slot.file.name);
				fd.append('pdfLabel', `${selectedFranchise!.name} - ${label}`);

				const res = await fetch(`/api/trademarks/${slot.filingId}/upload`, {
					method: 'POST',
					body:   fd
				});

				if (!res.ok) {
					const d = await res.json().catch(() => ({}));
					throw new Error(d.message ?? `HTTP ${res.status}`);
				}

				slots = { ...slots, [key]: { ...slots[key], status: 'done', error: '' } };
			} catch (err: any) {
				slots = { ...slots, [key]: { ...slots[key], status: 'error', error: err.message ?? 'Upload failed' } };
			}
		}

		if (allDone) {
			await invalidateAll();
		}
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
	>
		<div class="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

			<!-- Header -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
				<div>
					<h2 class="text-lg font-semibold text-white flex items-center gap-2">
						<Upload class="size-5 text-violet-400" />
						Upload Trademark PDFs
					</h2>
					<!-- Step indicator -->
					<div class="flex items-center gap-1.5 mt-1.5">
						{#each [1, 2, 3] as s}
							<div class="flex items-center gap-1.5">
								<div class="size-5 rounded-full flex items-center justify-center text-[10px] font-bold
									{step === s ? 'bg-violet-600 text-white' : step > s ? 'bg-violet-900 text-violet-300' : 'bg-slate-700 text-slate-500'}">
									{s}
								</div>
								<span class="text-xs {step === s ? 'text-violet-300' : 'text-slate-500'}">
									{s === 1 ? 'Franchise' : s === 2 ? 'Attach PDFs' : 'Upload'}
								</span>
								{#if s < 3}
									<ChevronRight class="size-3 text-slate-600" />
								{/if}
							</div>
						{/each}
					</div>
				</div>
				<button onclick={close} class="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
					<X class="size-5" />
				</button>
			</div>

			<!-- Body -->
			<div class="overflow-y-auto flex-1 px-6 py-5">

				<!-- ── Step 1: Pick franchise ── -->
				{#if step === 1}
					<p class="text-sm text-slate-400 mb-4">Select the franchise you want to upload PDFs for.</p>
					<div class="grid grid-cols-2 gap-3">
						{#each franchises as franchise}
							<button
								onclick={() => selectFranchise(franchise)}
								class="flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-violet-500 hover:bg-violet-900/20 transition-all text-left group"
							>
								{#if logoUrl(franchise)}
									<img src={logoUrl(franchise)} alt={franchise.name} class="size-10 rounded-lg object-contain bg-slate-800" />
								{:else}
									<div class="size-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
										<FileText class="size-5" />
									</div>
								{/if}
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-white truncate">{franchise.name}</p>
									<p class="text-xs text-slate-500">{franchise.slug}</p>
								</div>
								<ChevronRight class="size-4 text-slate-600 group-hover:text-violet-400 transition-colors shrink-0" />
							</button>
						{/each}
					</div>
				{/if}

				<!-- ── Step 2: Attach 3 PDFs ── -->
				{#if step === 2}
					<p class="text-sm text-slate-400 mb-5">
						For each PDF, choose which filing record it belongs to and select the file.
					</p>

					<div class="space-y-5">
						{#each PDF_SLOTS as { key, label }}
							{@const slot = slots[key]}
							<div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
								<!-- Slot header -->
								<div class="flex items-center gap-2">
									<div class="size-7 rounded-full bg-violet-900/60 border border-violet-700/50 flex items-center justify-center">
										<FileText class="size-3.5 text-violet-300" />
									</div>
									<div>
										<p class="text-sm font-semibold text-white">
											{selectedFranchise?.name} — {label}
										</p>
										<p class="text-xs text-slate-500">PDF #{PDF_SLOTS.findIndex(s => s.key === key) + 1} of 3</p>
									</div>
								</div>

								<!-- Filing selector -->
								<div class="space-y-1">
									<label class="text-xs text-slate-400 font-medium">Attach to filing record</label>
									<select
										value={slot.filingId}
										onchange={(e) => {
											slots = { ...slots, [key]: { ...slot, filingId: (e.target as HTMLSelectElement).value } };
										}}
										class="w-full rounded-lg border border-slate-600 bg-slate-900 text-sm text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
									>
										<option value="">— Select a filing —</option>
										{#each franchiseFilings as filing}
											<option value={filing.id}>{filingLabel(filing)}</option>
										{/each}
									</select>
								</div>

								<!-- File picker -->
								<div class="space-y-1">
									<label class="text-xs text-slate-400 font-medium">PDF file</label>
									<div class="flex items-center gap-3">
										<label class="flex-1 cursor-pointer">
											<div class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-600 hover:border-violet-500 hover:bg-violet-900/10 transition-all">
												<Upload class="size-4 text-slate-500 shrink-0" />
												<span class="text-sm truncate {slot.file ? 'text-violet-300' : 'text-slate-500'}">
													{slot.file ? slot.file.name : 'Click to choose PDF…'}
												</span>
											</div>
											<input
												type="file"
												accept=".pdf,application/pdf"
												class="sr-only"
												onchange={(e) => pickFile(key, e)}
											/>
										</label>
										{#if slot.file}
											<button
												onclick={() => { slots = { ...slots, [key]: { ...slot, file: null } }; }}
												class="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
											>
												<X class="size-4" />
											</button>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- ── Step 3: Upload progress ── -->
				{#if step === 3}
					<p class="text-sm text-slate-400 mb-5">Uploading PDFs to PocketBase…</p>

					<div class="space-y-4">
						{#each PDF_SLOTS as { key, label }}
							{@const slot = slots[key]}
							<div class="flex items-center gap-4 p-4 rounded-xl border
								{slot.status === 'done'      ? 'border-green-700/50 bg-green-900/20' :
								 slot.status === 'error'     ? 'border-red-700/50 bg-red-900/20'   :
								 slot.status === 'uploading' ? 'border-violet-700/50 bg-violet-900/20' :
								                               'border-slate-700 bg-slate-800/50'}">

								<!-- Icon -->
								<div class="shrink-0">
									{#if slot.status === 'done'}
										<CheckCircle2 class="size-6 text-green-400" />
									{:else if slot.status === 'error'}
										<AlertCircle class="size-6 text-red-400" />
									{:else if slot.status === 'uploading'}
										<Loader class="size-6 text-violet-400 animate-spin" />
									{:else}
										<FileText class="size-6 text-slate-500" />
									{/if}
								</div>

								<!-- Info -->
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-white">{selectedFranchise?.name} — {label}</p>
									<p class="text-xs text-slate-400 truncate">{slot.file?.name ?? '—'}</p>
									{#if slot.status === 'error'}
										<p class="text-xs text-red-400 mt-0.5">{slot.error}</p>
									{/if}
								</div>

								<!-- Status label -->
								<span class="text-xs font-medium shrink-0
									{slot.status === 'done'      ? 'text-green-400' :
									 slot.status === 'error'     ? 'text-red-400'   :
									 slot.status === 'uploading' ? 'text-violet-300' :
									                               'text-slate-500'}">
									{slot.status === 'done'      ? 'Done'      :
									 slot.status === 'error'     ? 'Failed'    :
									 slot.status === 'uploading' ? 'Uploading' : 'Queued'}
								</span>
							</div>
						{/each}
					</div>

					{#if allDone}
						<div class="mt-6 p-4 rounded-xl bg-green-900/30 border border-green-700/50 text-center">
							<CheckCircle2 class="size-8 text-green-400 mx-auto mb-2" />
							<p class="text-sm font-semibold text-green-300">All 3 PDFs uploaded successfully!</p>
							<p class="text-xs text-green-600 mt-1">The trademark table has been refreshed.</p>
						</div>
					{/if}
				{/if}

			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between px-6 py-4 border-t border-slate-700 shrink-0">
				<div>
					{#if step > 1 && !allDone}
						<Button
							variant="outline"
							onclick={back}
							disabled={isUploading}
							class="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2"
						>
							<ChevronLeft class="size-4" /> Back
						</Button>
					{/if}
				</div>

				<div class="flex gap-3">
					{#if allDone}
						<Button onclick={close} class="bg-green-700 hover:bg-green-600 text-white gap-2">
							<CheckCircle2 class="size-4" /> Done
						</Button>
					{:else if step === 2}
						<Button
							onclick={uploadAll}
							disabled={!allFilesChosen}
							class="bg-violet-600 hover:bg-violet-500 text-white gap-2 disabled:opacity-40"
						>
							<Upload class="size-4" /> Upload 3 PDFs
						</Button>
					{:else if step === 3 && !allDone}
						<Button disabled class="bg-violet-600 text-white gap-2 opacity-60">
							<Loader class="size-4 animate-spin" /> Uploading…
						</Button>
					{/if}
				</div>
			</div>

		</div>
	</div>
{/if}
