<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Link, FileText, ChevronRight, CheckCircle2, Loader, X, AlertCircle, ExternalLink, Pencil } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let {
		franchise,
		isAdmin = false
	}: {
		franchise: any;
		isAdmin:   boolean;
	} = $props();

	const primary   = franchise.primaryColor   ?? '#7c3aed';
	const secondary = franchise.secondaryColor ?? '#1e1b4b';

	const SLOTS = [
		{ key: 'origins', label: 'Origins'       },
		{ key: 'team',    label: 'Team'           },
		{ key: 'quest',   label: 'Quest for Gold' },
	] as const;
	type SlotKey = typeof SLOTS[number]['key'];

	function getLinks(): Record<SlotKey, string> {
		const raw: { label: string; url: string }[] = franchise.storyLinks ?? [];
		const map: Record<string, string> = {};
		for (const l of raw) map[l.label.toLowerCase().replace(/\s+/g, '_')] = l.url;
		return {
			origins: map['origins'] ?? '',
			team:    map['team']    ?? '',
			quest:   map['quest_for_gold'] ?? map['quest'] ?? '',
		};
	}

	let showEdit  = $state(false);
	let saving    = $state(false);
	let saveError = $state('');
	let saved     = $state(false);
	let inputs    = $state<Record<SlotKey, string>>({ origins: '', team: '', quest: '' });

	function openEdit() {
		const current = getLinks();
		inputs    = { origins: current.origins, team: current.team, quest: current.quest };
		saveError = '';
		saved     = false;
		showEdit  = true;
	}

	async function saveLinks() {
		saving    = true;
		saveError = '';
		saved     = false;
		try {
			const links = SLOTS
				.map(s => ({ label: s.label, url: inputs[s.key].trim() }))
				.filter(l => l.url);
			const res = await fetch(`/api/franchises/${franchise.slug}/story-links`, {
				method:  'POST',
				headers: { 'Content-Type': 'application/json' },
				body:    JSON.stringify({ links }),
			});
			if (!res.ok) {
				const d = await res.json().catch(() => ({}));
				throw new Error(d.message ?? `HTTP ${res.status}`);
			}
			const updated = await res.json();
			franchise.storyLinks = updated.storyLinks;
			saved = true;
			await invalidateAll();
		} catch (err: any) {
			saveError = err.message ?? 'Save failed';
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex items-center justify-between">
	<div class="flex items-center gap-2">
		<FileText class="size-5 text-violet-500" />
		<h3 class="text-lg font-semibold">Discopolis Story</h3>
	</div>
	{#if isAdmin}
		<Button onclick={openEdit} class="gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm">
			<Pencil class="size-4" />
			{(franchise.storyLinks?.length ?? 0) > 0 ? 'Edit Links' : 'Add Links'}
		</Button>
	{/if}
</div>

{@const links = getLinks()}
{@const hasAny = !!(links.origins || links.team || links.quest)}

{#if hasAny}
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		{#each SLOTS as slot, i}
			{@const href = links[slot.key]}
			{#if href}
				<a {href} target="_blank" rel="noopener noreferrer"
					class="group flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-lg transition-all">
					<div class="h-1.5 w-full" style="background: linear-gradient(90deg, {primary}, {secondary})"></div>
					<div class="p-5 flex flex-col gap-3 flex-1">
						<span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Part {i + 1} of {SLOTS.length}</span>
						<div class="size-11 rounded-lg flex items-center justify-center" style="background-color: {primary}22; color: {primary}">
							<ExternalLink class="size-5" />
						</div>
						<p class="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
							{franchise.name} — {slot.label}
						</p>
						<p class="text-[11px] text-slate-400 truncate">{href}</p>
						<div class="mt-auto flex items-center gap-1 text-xs text-violet-500 font-medium">
							Open <ChevronRight class="size-3.5" />
						</div>
					</div>
				</a>
			{:else if isAdmin}
				<button onclick={openEdit}
					class="flex flex-col rounded-xl border border-dashed border-slate-700 bg-slate-900/40 overflow-hidden hover:border-violet-600 transition-all p-5 gap-3 text-left">
					<span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Part {i + 1} of {SLOTS.length}</span>
					<div class="size-11 rounded-lg flex items-center justify-center bg-slate-800 text-slate-600">
						<Link class="size-5" />
					</div>
					<p class="text-sm text-slate-500">{franchise.name} — {slot.label}</p>
					<p class="text-xs text-violet-500/60">Click to add link…</p>
				</button>
			{/if}
		{/each}
	</div>
{:else if isAdmin}
	<div class="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
		<Link class="size-10 text-slate-400 mx-auto mb-3" />
		<p class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">No story links added yet</p>
		<p class="text-xs text-slate-400 dark:text-slate-500 mb-4">Add tiiny.host links for Origins, Team, and Quest for Gold.</p>
		<Button onclick={openEdit} class="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
			<Link class="size-4" /> Add Story Links
		</Button>
	</div>
{/if}

{#if showEdit && isAdmin}
	<div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
		<div class="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
			<div class="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
				<div>
					<h2 class="text-base font-semibold text-white flex items-center gap-2">
						<Link class="size-4 text-violet-400" /> Story Links — {franchise.name}
					</h2>
					<p class="text-xs text-slate-400 mt-0.5">Paste tiiny.host (or any) URLs for each story part</p>
				</div>
				<button onclick={() => showEdit = false} class="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
					<X class="size-5" />
				</button>
			</div>

			<div class="overflow-y-auto flex-1 px-6 py-5 space-y-4">
				{#each SLOTS as slot, i}
					<div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-2">
						<div class="flex items-center gap-2">
							<div class="size-6 rounded-full bg-violet-900/60 border border-violet-700/50 flex items-center justify-center text-[11px] font-bold text-violet-300">{i + 1}</div>
							<p class="text-sm font-semibold text-white">{franchise.name} — {slot.label}</p>
						</div>
						<div class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 bg-slate-900 focus-within:border-violet-500 transition-colors">
							<Link class="size-4 text-slate-500 shrink-0" />
							<input
								type="url"
								placeholder="https://scarlet-teri-11.tiiny.site/…"
								bind:value={inputs[slot.key]}
								class="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none min-w-0"
							/>
							{#if inputs[slot.key]}
								<a href={inputs[slot.key]} target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:text-violet-300 shrink-0" title="Preview">
									<ExternalLink class="size-3.5" />
								</a>
							{/if}
						</div>
						{#if inputs[slot.key] && !inputs[slot.key].startsWith('http')}
							<p class="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle class="size-3" /> URL should start with https://</p>
						{/if}
					</div>
				{/each}

				{#if saveError}
					<div class="flex items-start gap-3 p-3 rounded-xl bg-red-900/20 border border-red-700/50">
						<AlertCircle class="size-4 text-red-400 shrink-0 mt-0.5" />
						<p class="text-sm text-red-300">{saveError}</p>
					</div>
				{/if}
				{#if saved}
					<div class="flex items-center gap-2 p-3 rounded-xl bg-emerald-900/20 border border-emerald-700/50">
						<CheckCircle2 class="size-4 text-emerald-400 shrink-0" />
						<p class="text-sm text-emerald-300">Links saved successfully!</p>
					</div>
				{/if}
			</div>

			<div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 shrink-0">
				{#if saved}
					<Button onclick={() => showEdit = false} class="bg-emerald-700 hover:bg-emerald-600 text-white gap-2">
						<CheckCircle2 class="size-4" /> Done
					</Button>
				{:else}
					<Button variant="outline" onclick={() => showEdit = false} class="border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</Button>
					<Button onclick={saveLinks} disabled={saving} class="bg-violet-600 hover:bg-violet-500 text-white gap-2 disabled:opacity-40">
						{#if saving}<Loader class="size-4 animate-spin" /> Saving…{:else}<Link class="size-4" /> Save Links{/if}
					</Button>
				{/if}
			</div>
		</div>
	</div>
{/if}
