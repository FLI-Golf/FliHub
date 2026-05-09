<script lang="ts">
	import TerritoryGrid from '$lib/components/franchise/TerritoryGrid.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus, X } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const sold      = $derived(data.territories.filter((t: any) => t.status === 'sold').length);
	const reserved  = $derived(data.territories.filter((t: any) => t.status === 'reserved').length);
	const available = $derived(data.territories.filter((t: any) => t.status === 'available').length);

	// Add territory modal
	let showAdd  = $state(false);
	let saving   = $state(false);
	let addErr   = $state('');
	let form = $state({
		name: '', code: '', state: '', city: '', region: '',
		population: '', marketSize: '', status: 'available',
		price: '', description: '', notes: ''
	});

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';

	async function submitAdd(e: SubmitEvent) {
		e.preventDefault();
		saving = true; addErr = '';
		try {
			const res = await fetch('/api/territories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					population: form.population ? Number(form.population) : null,
					price:      form.price      ? Number(form.price)      : null
				})
			});
			if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? `Error ${res.status}`); }
			showAdd = false;
			window.location.reload();
		} catch (err: any) { addErr = err.message ?? 'Failed'; }
		finally { saving = false; }
	}

	function resetForm() {
		form = { name: '', code: '', state: '', city: '', region: '', population: '', marketSize: '', status: 'available', price: '', description: '', notes: '' };
		addErr = '';
	}
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-100">Territories</h1>
			<p class="text-slate-400 text-sm mt-1">Franchise territory availability across all regions</p>
		</div>
		<div class="flex gap-2">
			<Button onclick={() => showAdd = true} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
				<Plus class="size-4" /> Add Territory
			</Button>
			<Button href="/dashboard/sales" variant="outline" class="border-slate-600 text-slate-300 hover:bg-slate-700">
				← Franchise Sales
			</Button>
		</div>
	</div>

	<!-- Summary -->
	<div class="grid grid-cols-3 gap-4">
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
			<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Sold</div>
			<div class="text-3xl font-bold text-emerald-300">{sold}</div>
		</div>
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
			<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Reserved</div>
			<div class="text-3xl font-bold text-yellow-300">{reserved}</div>
		</div>
		<div class="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
			<div class="text-xs text-slate-400 uppercase tracking-wide mb-1">Available</div>
			<div class="text-3xl font-bold text-blue-300">{available}</div>
		</div>
	</div>

	<!-- Tribal Casino Expansion Strategy -->
	<div class="rounded-xl border border-amber-700/40 bg-amber-950/20 p-5 space-y-4">
		<div class="flex items-start justify-between gap-4">
			<div>
				<p class="text-xs font-bold uppercase tracking-wide text-amber-400 mb-1">Tribal Casino Franchise Strategy</p>
				<p class="text-sm text-slate-300 leading-relaxed">FLI Golf is uniquely positioned to partner with Native American tribal casino operators as franchise owners, tournament hosts, and sportsbook partners. Tribal casinos offer sovereign control over gaming, existing high-volume entertainment traffic, and proven infrastructure for large-scale live events.</p>
			</div>
		</div>

		<!-- 6 Regions -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
			{#each [
				{ phase: 1, emoji: '🌵', region: 'Southwest (AZ / NM)', label: 'Phase 1 — Launch', color: 'border-emerald-700/50 bg-emerald-950/30 text-emerald-300', targets: ['Talking Stick Resort', 'Wild Horse Pass Casino', 'Gila River Resorts & Casinos', 'Desert Diamond Casino'], angle: 'Ideal for FIRST flagship tribal franchise. Legal sportsbook infrastructure. 5,000–20,000 person event capacity.' },
				{ phase: 2, emoji: '🌴', region: 'West Coast (CA)', label: 'Phase 3 — Scale & Media', color: 'border-blue-700/50 bg-blue-950/30 text-blue-300', targets: ['Pechanga Resort Casino', 'Yaamava\' Resort & Casino', 'Morongo Casino Resort & Spa'], angle: 'Premium valuation franchise. Massive upside when sports betting fully opens in California.' },
				{ phase: 3, emoji: '🏟️', region: 'Midwest (MN / WI / MI)', label: 'Phase 2 — Expansion', color: 'border-violet-700/50 bg-violet-950/30 text-violet-300', targets: ['Mystic Lake Casino', 'Soaring Eagle Casino', 'Potawatomi Casino Hotel'], angle: 'Disc golf hotbed. Lower acquisition cost, high engagement ROI. Fan-driven franchise model.' },
				{ phase: 4, emoji: '🎰', region: 'South Central (OK / TX)', label: 'Phase 1 — Launch', color: 'border-emerald-700/50 bg-emerald-950/30 text-emerald-300', targets: ['WinStar World Casino', 'Choctaw Casino & Resort'], angle: 'Some of the largest casinos in the world. Heavy Texas traffic funnel. 10,000–25,000 capacity events.' },
				{ phase: 5, emoji: '🌴', region: 'Southeast (FL)', label: 'Phase 2 — Expansion', color: 'border-orange-700/50 bg-orange-950/30 text-orange-300', targets: ['Seminole Hard Rock Hollywood', 'Seminole Hard Rock Tampa'], angle: 'Seminole Tribe controls one of the most powerful gaming operations in the U.S. International tourism hub.' },
				{ phase: 6, emoji: '🏙️', region: 'Northeast (CT / NY)', label: 'Phase 3 — Scale & Media', color: 'border-blue-700/50 bg-blue-950/30 text-blue-300', targets: ['Foxwoods Resort Casino', 'Mohegan Sun'], angle: 'Best region for media rights + broadcast growth. Close to NYC & Boston markets. High ticket pricing potential.' },
			] as r}
			<div class="rounded-lg border {r.color.split(' ')[0]} {r.color.split(' ')[1]} p-3 space-y-2">
				<div class="flex items-center justify-between">
					<p class="text-xs font-bold {r.color.split(' ')[2]}">{r.emoji} {r.region}</p>
					<span class="text-[10px] px-1.5 py-0.5 rounded-full border {r.color.split(' ')[0]} {r.color.split(' ')[2]} opacity-80">{r.label}</span>
				</div>
				<div class="space-y-0.5">
					{#each r.targets as t}
						<p class="text-[11px] text-slate-400 flex items-center gap-1.5"><span class="size-1 rounded-full bg-current opacity-60 shrink-0"></span>{t}</p>
					{/each}
				</div>
				<p class="text-[11px] text-slate-500 leading-relaxed border-t border-slate-700/50 pt-2">{r.angle}</p>
			</div>
			{/each}
		</div>

		<!-- Rollout phases -->
		<div class="flex flex-wrap gap-3 pt-1 border-t border-amber-800/30">
			<p class="text-xs text-amber-400/70 font-semibold uppercase tracking-wide self-center">Rollout:</p>
			{#each [
				{ phase: 'Phase 1 — Launch', regions: 'Southwest (AZ) · South Central (OK)', color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' },
				{ phase: 'Phase 2 — Expansion', regions: 'Florida · Midwest', color: 'bg-orange-900/40 text-orange-300 border-orange-700/40' },
				{ phase: 'Phase 3 — Scale & Media', regions: 'Northeast · California', color: 'bg-blue-900/40 text-blue-300 border-blue-700/40' },
			] as p}
				<div class="rounded-lg border {p.color} px-3 py-1.5 text-xs">
					<span class="font-semibold">{p.phase}</span>
					<span class="opacity-70 ml-1.5">{p.regions}</span>
				</div>
			{/each}
		</div>
	</div>

	<TerritoryGrid territories={data.territories} />
</div>

{#if showAdd}
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
	<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
		<div class="flex items-center justify-between p-6 border-b border-slate-700">
			<h2 class="text-lg font-semibold text-slate-100">Add Territory</h2>
			<button onclick={() => { showAdd = false; resetForm(); }} class="text-slate-400 hover:text-slate-100 transition-colors" aria-label="Close">
				<X class="size-5" />
			</button>
		</div>
		<form onsubmit={submitAdd} class="p-6 space-y-4">
			{#if addErr}<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{addErr}</p>{/if}

			<div class="grid grid-cols-2 gap-3">
				<div class="col-span-2">
					<label class={LABEL}>Territory Name *</label>
					<input bind:value={form.name} required class={INPUT} placeholder="Las Vegas Metro" />
				</div>
				<div>
					<label class={LABEL}>Code</label>
					<input bind:value={form.code} class={INPUT} placeholder="LV-01" />
				</div>
				<div>
					<label class={LABEL}>Region</label>
					<input bind:value={form.region} class={INPUT} placeholder="Southwest" />
				</div>
				<div>
					<label class={LABEL}>City</label>
					<input bind:value={form.city} class={INPUT} placeholder="Las Vegas" />
				</div>
				<div>
					<label class={LABEL}>State</label>
					<input bind:value={form.state} class={INPUT} placeholder="NV" />
				</div>
				<div>
					<label class={LABEL}>Population</label>
					<input bind:value={form.population} type="number" min="0" class={INPUT} placeholder="2200000" />
				</div>
				<div>
					<label class={LABEL}>Market Size</label>
					<select bind:value={form.marketSize} class={INPUT}>
						<option value="">— Select —</option>
						<option value="small">Small</option>
						<option value="medium">Medium</option>
						<option value="large">Large</option>
						<option value="major">Major</option>
					</select>
				</div>
				<div>
					<label class={LABEL}>Status</label>
					<select bind:value={form.status} class={INPUT}>
						<option value="available">Available</option>
						<option value="reserved">Reserved</option>
						<option value="sold">Sold</option>
					</select>
				</div>
				<div>
					<label class={LABEL}>Price ($)</label>
					<input bind:value={form.price} type="number" min="0" class={INPUT} placeholder="250000" />
				</div>
				<div class="col-span-2">
					<label class={LABEL}>Description</label>
					<textarea bind:value={form.description} rows="2" class="{INPUT} resize-none" placeholder="Market overview…"></textarea>
				</div>
				<div class="col-span-2">
					<label class={LABEL}>Notes</label>
					<textarea bind:value={form.notes} rows="2" class="{INPUT} resize-none" placeholder="Internal notes…"></textarea>
				</div>
			</div>

			<div class="flex justify-end gap-3 pt-2">
				<Button type="button" variant="outline" onclick={() => { showAdd = false; resetForm(); }} class="border-slate-600 text-slate-300">Cancel</Button>
				<Button type="submit" disabled={saving} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
					<Plus class="size-4" />{saving ? 'Saving…' : 'Add Territory'}
				</Button>
			</div>
		</form>
	</div>
</div>
{/if}
