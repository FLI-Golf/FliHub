<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Upload, FileText, ChevronRight, CheckCircle2, Loader, X, ChevronLeft, AlertCircle } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let {
		franchise,
		isAdmin = false
	}: {
		franchise: any;
		isAdmin:   boolean;
	} = $props();

	const pbUrl     = 'https://pocketbase-production-6ab5.up.railway.app';
	const primary   = franchise.primaryColor   ?? '#7c3aed';
	const secondary = franchise.secondaryColor ?? '#1e1b4b';

	// ── PDF list from storyPdfs field ────────────────────────────────────────
	const PDF_LABELS = ['Origins', 'Team', 'Quest for Gold'];

	function specSheetUrl(filename: string): string {
		// Link directly to PocketBase — avoids proxying large PDFs through the SvelteKit server
		return `${pbUrl}/api/files/${franchise.collectionId}/${franchise.id}/${filename}`;
	}

	function labelFor(filename: string, idx: number): string {
		// If filename contains a known label keyword use it, otherwise fall back to slot label
		const lower = filename.toLowerCase();
		if (lower.includes('origin'))  return `${franchise.name} — Origins`;
		if (lower.includes('team'))    return `${franchise.name} — Team`;
		if (lower.includes('quest') || lower.includes('gold')) return `${franchise.name} — Quest for Gold`;
		return `${franchise.name} — ${PDF_LABELS[idx] ?? `Document ${idx + 1}`}`;
	}

	// ── Multi-step upload ─────────────────────────────────────────────────────
	const SLOTS = [
		{ key: 'pdf_0', label: 'Origins'       },
		{ key: 'pdf_1', label: 'Team'           },
		{ key: 'pdf_2', label: 'Quest for Gold' }
	] as const;
	type SlotKey = typeof SLOTS[number]['key'];

	type SlotState = {
		file:   File | null;
		status: 'idle' | 'done' | 'error';
		error:  string;
	};

	let showUpload  = $state(false);
	let uploadStep  = $state<1 | 2>(1);
	let uploading   = $state(false);
	let uploadError = $state('');
	let slots = $state<Record<SlotKey, SlotState>>({
		pdf_0: { file: null, status: 'idle', error: '' },
		pdf_1: { file: null, status: 'idle', error: '' },
		pdf_2: { file: null, status: 'idle', error: '' }
	});

	let anyFileChosen = $derived(SLOTS.some(s => slots[s.key].file !== null));
	let allDone       = $derived(uploadStep === 2 && !uploading && uploadError === '');

	function pickFile(key: SlotKey, e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0] ?? null;
		slots = { ...slots, [key]: { file, status: 'idle', error: '' } };
	}

	function openUpload() {
		slots = {
			pdf_0: { file: null, status: 'idle', error: '' },
			pdf_1: { file: null, status: 'idle', error: '' },
			pdf_2: { file: null, status: 'idle', error: '' }
		};
		uploadStep  = 1;
		uploadError = '';
		showUpload  = true;
	}

	async function uploadAll() {
		uploadStep  = 2;
		uploading   = true;
		uploadError = '';
		try {
			const fd = new FormData();
			for (const { key } of SLOTS) {
				if (slots[key].file) fd.append(key, slots[key].file!, slots[key].file!.name);
			}
			const res = await fetch(`/api/franchises/${franchise.slug}/upload`, {
				method: 'POST',
				body:   fd
			});
			if (!res.ok) {
				const d = await res.json().catch(() => ({}));
				throw new Error(d.message ?? `HTTP ${res.status}`);
			}
			const updated = await res.json();
			// Update local franchise so cards appear without reload
			franchise.storyPdfs = updated.storyPdfs;
			await invalidateAll();
		} catch (err: any) {
			uploadError = err.message ?? 'Upload failed';
		} finally {
			uploading = false;
		}
	}
</script>

<!-- Section header -->
<div class="flex items-center justify-between">
	<div class="flex items-center gap-2">
		<FileText class="size-5 text-violet-500" />
		<h3 class="text-lg font-semibold">Discopolis Story</h3>
	</div>
	{#if isAdmin}
		<Button onclick={openUpload} class="gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm">
			<Upload class="size-4" />
			{franchise.storyPdfs?.length > 0 ? 'Replace PDFs' : 'Upload PDFs'}
		</Button>
	{/if}
</div>

<!-- PDF cards -->
{#if franchise.storyPdfs?.length > 0}
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		{#each franchise.storyPdfs as filename, i}
			<a
				href={specSheetUrl(filename)}
				target="_blank"
				class="group flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-lg transition-all"
			>
				<div class="h-1.5 w-full" style="background: linear-gradient(90deg, {primary}, {secondary})"></div>
				<div class="p-5 flex flex-col gap-3 flex-1">
					<span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Part {i + 1} of {franchise.storyPdfs.length}</span>
					<div class="size-11 rounded-lg flex items-center justify-center text-xs font-bold"
						style="background-color: {primary}22; color: {primary}">PDF</div>
					<p class="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
						{labelFor(filename, i)}
					</p>
					<div class="mt-auto flex items-center gap-1 text-xs text-violet-500 font-medium">
						Open <ChevronRight class="size-3.5" />
					</div>
				</div>
			</a>
		{/each}
	</div>

<!-- Empty state (admin only) -->
{:else if isAdmin}
	<div class="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
		<FileText class="size-10 text-slate-400 mx-auto mb-3" />
		<p class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">No story PDFs uploaded yet</p>
		<p class="text-xs text-slate-400 dark:text-slate-500 mb-4">Upload the Origins, Team, and Quest for Gold PDFs.</p>
		<Button onclick={openUpload} class="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
			<Upload class="size-4" /> Upload Story PDFs
		</Button>
	</div>
{/if}

<!-- Multi-step upload modal -->
{#if showUpload && isAdmin}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
		<div class="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

			<!-- Header -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
				<div>
					<h2 class="text-base font-semibold text-white flex items-center gap-2">
						<Upload class="size-4 text-violet-400" />
						Upload Story PDFs — {franchise.name}
					</h2>
					<div class="flex items-center gap-2 mt-1.5">
						{#each ([1, 2] as const) as s}
							<div class="flex items-center gap-1.5">
								<div class="size-5 rounded-full flex items-center justify-center text-[10px] font-bold
									{uploadStep === s ? 'bg-violet-600 text-white' : uploadStep > s ? 'bg-violet-900 text-violet-300' : 'bg-slate-700 text-slate-500'}">
									{s}
								</div>
								<span class="text-xs {uploadStep === s ? 'text-violet-300' : 'text-slate-500'}">
									{s === 1 ? 'Choose files' : 'Upload'}
								</span>
								{#if s < 2}<ChevronRight class="size-3 text-slate-600" />{/if}
							</div>
						{/each}
					</div>
				</div>
				<button onclick={() => showUpload = false} class="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
					<X class="size-5" />
				</button>
			</div>

			<!-- Body -->
			<div class="overflow-y-auto flex-1 px-6 py-5">

				<!-- Step 1: pick files -->
				{#if uploadStep === 1}
					<p class="text-sm text-slate-400 mb-5">
						Select a PDF for each story. You can upload 1, 2, or all 3 at once — they will replace any existing files.
					</p>
					<div class="space-y-4">
						{#each SLOTS as { key, label }, idx}
							{@const slot = slots[key]}
							<div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-2">
								<div class="flex items-center gap-2">
									<div class="size-6 rounded-full bg-violet-900/60 border border-violet-700/50 flex items-center justify-center text-[11px] font-bold text-violet-300">
										{idx + 1}
									</div>
									<p class="text-sm font-semibold text-white">{franchise.name} — {label}</p>
								</div>
								<label class="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-600 hover:border-violet-500 hover:bg-violet-900/10 transition-all cursor-pointer">
									<Upload class="size-4 text-slate-500 shrink-0" />
									<span class="text-sm truncate {slot.file ? 'text-violet-300' : 'text-slate-500'}">
										{slot.file ? slot.file.name : 'Click to choose PDF…'}
									</span>
									<input type="file" accept=".pdf,application/pdf" class="sr-only" onchange={(e) => pickFile(key, e)} />
								</label>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Step 2: result -->
				{#if uploadStep === 2}
					{#if uploading}
						<div class="flex flex-col items-center justify-center py-10 gap-3">
							<Loader class="size-8 text-violet-400 animate-spin" />
							<p class="text-sm text-slate-400">Uploading PDFs…</p>
						</div>
					{:else if uploadError}
						<div class="flex items-start gap-3 p-4 rounded-xl bg-red-900/20 border border-red-700/50">
							<AlertCircle class="size-5 text-red-400 shrink-0 mt-0.5" />
							<div>
								<p class="text-sm font-medium text-red-300">Upload failed</p>
								<p class="text-xs text-red-400 mt-0.5">{uploadError}</p>
							</div>
						</div>
					{:else}
						<div class="flex flex-col items-center justify-center py-8 gap-3">
							<CheckCircle2 class="size-10 text-green-400" />
							<p class="text-sm font-semibold text-green-300">PDFs uploaded successfully!</p>
							<p class="text-xs text-green-600">They now appear in the story section.</p>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between px-6 py-4 border-t border-slate-700 shrink-0">
				<div>
					{#if uploadStep === 2 && uploadError}
						<Button variant="outline" onclick={() => uploadStep = 1} class="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2">
							<ChevronLeft class="size-4" /> Back
						</Button>
					{/if}
				</div>
				<div class="flex gap-3">
					{#if allDone}
						<Button onclick={() => showUpload = false} class="bg-green-700 hover:bg-green-600 text-white gap-2">
							<CheckCircle2 class="size-4" /> Done
						</Button>
					{:else if uploadStep === 1}
						<Button onclick={uploadAll} disabled={!anyFileChosen} class="bg-violet-600 hover:bg-violet-500 text-white gap-2 disabled:opacity-40">
							<Upload class="size-4" /> Upload
						</Button>
					{:else if uploading}
						<Button disabled class="bg-violet-600 text-white gap-2 opacity-60">
							<Loader class="size-4 animate-spin" /> Uploading…
						</Button>
					{/if}
				</div>
			</div>

		</div>
	</div>
{/if}
