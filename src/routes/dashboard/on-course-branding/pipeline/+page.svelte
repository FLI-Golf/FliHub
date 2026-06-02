<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import Card from '$lib/components/ui/card.svelte';
	import type { PageData } from './$types';
	import {
		Flag, DollarSign, TrendingUp, CheckCircle2,
		Plus, X, BarChart3, Users, ArrowLeft
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const fmt  = (n: number) => '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
	const fmtN = (n: number) => (n ?? 0).toLocaleString();

	// ── Add placement modal ───────────────────────────────────────────────────
	let showAdd = $state(false);
	let saving  = $state(false);
	let saveErr = $state('');

	let form = $state({
		sponsorName:      '',
		eventName:        '',
		eventDate:        '',
		placementType:    'fairway_sign',
		quantity:         '',
		ratePerPlacement: '',
		status:           'proposed',
		invoiceNumber:    '',
		notes:            '',
	});

	const gross = $derived((Number(form.quantity) || 0) * (Number(form.ratePerPlacement) || 0));

	async function save() {
		if (!form.sponsorName.trim() || !form.eventName.trim()) {
			saveErr = 'Sponsor name and event name are required.'; return;
		}
		saving = true; saveErr = '';
		try {
			const res = await fetch('/api/branding-placements', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					quantity:         Number(form.quantity) || 0,
					ratePerPlacement: Number(form.ratePerPlacement) || 0,
					grossRevenue:     gross,
				}),
			});
			if (!res.ok) { const e = await res.json(); saveErr = e.message ?? 'Failed'; return; }
			showAdd = false;
			form = { sponsorName: '', eventName: '', eventDate: '', placementType: 'fairway_sign', quantity: '', ratePerPlacement: '', status: 'proposed', invoiceNumber: '', notes: '' };
			await invalidateAll();
		} catch { saveErr = 'Network error'; }
		finally { saving = false; }
	}

	// ── Helpers ───────────────────────────────────────────────────────────────
	const STATUS_COLOR: Record<string, string> = {
		proposed:   'bg-slate-700 text-slate-300',
		contracted: 'bg-blue-900/50 text-blue-300',
		invoiced:   'bg-amber-900/50 text-amber-300',
		paid:       'bg-emerald-900/50 text-emerald-300',
		activated:  'bg-teal-900/50 text-teal-300',
		completed:  'bg-purple-900/50 text-purple-300',
		cancelled:  'bg-red-900/50 text-red-300',
	};

	const TYPE_LABEL: Record<string, string> = {
		fairway_sign:    'Fairway Sign',
		banner:          'Banner',
		tent_wrap:       'Tent Wrap',
		table_wrap:      'Table Wrap',
		flag:            'Flag',
		merch_display:   'Merch Display',
		directional:     'Directional',
		tee_box:         'Tee Box',
		green_surround:  'Green Surround',
		digital_board:   'Digital Board',
		other:           'Other',
	};

	const PIPELINE_STAGES = [
		{ key: 'proposed',   label: 'Proposed',   color: 'border-slate-500' },
		{ key: 'contracted', label: 'Contracted',  color: 'border-blue-500' },
		{ key: 'invoiced',   label: 'Invoiced',    color: 'border-amber-500' },
		{ key: 'paid',       label: 'Paid',        color: 'border-emerald-500' },
		{ key: 'activated',  label: 'Activated',   color: 'border-teal-500' },
		{ key: 'completed',  label: 'Completed',   color: 'border-purple-500' },
	];

	const INPUT  = 'w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500';
	const SELECT = INPUT;
</script>

<div class="min-h-screen bg-slate-950 text-white p-6 space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/dashboard/on-course-branding" class="text-slate-400 hover:text-white transition-colors">
				<ArrowLeft class="size-5" />
			</a>
			<div class="p-2 bg-emerald-600/20 rounded-lg">
				<Flag class="size-6 text-emerald-400" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-white">On-Course Branding Revenue</h1>
				<p class="text-slate-400 text-sm">Sponsor placement deals — fairway signs, banners, tent wraps, and more</p>
			</div>
		</div>
		<Button onclick={() => showAdd = true} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
			<Plus class="size-4" /> Add Placement Deal
		</Button>
	</div>

	<!-- KPI Strip -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		{#each [
			{ label: 'Contracted Revenue', value: fmt(data.metrics.totalContracted),  sub: `${data.metrics.sponsorCount} sponsors`,              icon: DollarSign,   color: 'text-emerald-400' },
			{ label: 'Paid / Activated',   value: fmt(data.metrics.totalPaid),        sub: 'cash received',                                       icon: CheckCircle2, color: 'text-teal-400'    },
			{ label: 'In Proposal',        value: fmt(data.metrics.totalProposed),    sub: 'pending contract',                                     icon: TrendingUp,   color: 'text-amber-400'   },
			{ label: 'Total Placements',   value: fmtN(data.metrics.totalPlacements), sub: `${data.metrics.recordCount} deals tracked`,            icon: BarChart3,    color: 'text-blue-400'    },
		] as kpi}
			<Card class="bg-slate-900 border-slate-700 p-4">
				<div class="flex items-start justify-between">
					<div>
						<p class="text-slate-400 text-xs uppercase tracking-wide">{kpi.label}</p>
						<p class="text-2xl font-bold text-white mt-1">{kpi.value}</p>
						<p class="text-slate-500 text-xs mt-1">{kpi.sub}</p>
					</div>
					<kpi.icon class="size-5 {kpi.color} mt-1" />
				</div>
			</Card>
		{/each}
	</div>

	<!-- Pipeline stages -->
	<div class="grid grid-cols-3 md:grid-cols-6 gap-3">
		{#each PIPELINE_STAGES as stage}
			{@const rows = (data.byStage as any)[stage.key] ?? []}
			{@const stageRevenue = rows.reduce((s: number, r: any) => s + (r.grossRevenue ?? 0), 0)}
			<Card class="bg-slate-900 border-slate-700 border-t-2 {stage.color} p-3 text-center">
				<p class="text-xs text-slate-400 uppercase tracking-wide">{stage.label}</p>
				<p class="text-lg font-bold text-white mt-1">{rows.length}</p>
				<p class="text-xs text-slate-500 mt-0.5">{fmt(stageRevenue)}</p>
			</Card>
		{/each}
	</div>

	<!-- By sponsor -->
	{#if data.bySponsor.length > 0}
		<Card class="bg-slate-900 border-slate-700">
			<div class="p-4 border-b border-slate-700 flex items-center gap-2">
				<Users class="size-4 text-slate-400" />
				<h2 class="font-semibold text-white">Revenue by Sponsor</h2>
			</div>
			<div class="divide-y divide-slate-800">
				{#each data.bySponsor as sponsor}
					<div class="p-4">
						<div class="flex items-center justify-between mb-3">
							<div>
								<p class="font-medium text-white">{sponsor.name}</p>
								<p class="text-slate-400 text-sm">{fmtN(sponsor.placements)} placements across {sponsor.rows.length} deal{sponsor.rows.length !== 1 ? 's' : ''}</p>
							</div>
							<p class="font-bold text-emerald-400 text-lg">{fmt(sponsor.revenue)}</p>
						</div>
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="text-slate-500 text-xs">
										<th class="text-left pb-1">Event</th>
										<th class="text-left pb-1">Type</th>
										<th class="text-right pb-1">Qty</th>
										<th class="text-right pb-1">Rate</th>
										<th class="text-right pb-1">Revenue</th>
										<th class="text-left pb-1 pl-3">Status</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-800/50">
									{#each sponsor.rows as row}
										<tr class="text-slate-300">
											<td class="py-1.5 text-slate-300">{row.eventName}</td>
											<td class="py-1.5 text-slate-400">{TYPE_LABEL[row.placementType] ?? row.placementType}</td>
											<td class="py-1.5 text-right">{fmtN(row.quantity ?? 0)}</td>
											<td class="py-1.5 text-right">{row.ratePerPlacement ? fmt(row.ratePerPlacement) : '—'}</td>
											<td class="py-1.5 text-right text-emerald-400 font-medium">{fmt(row.grossRevenue ?? 0)}</td>
											<td class="py-1.5 pl-3">
												<span class="px-2 py-0.5 rounded text-xs font-medium {STATUS_COLOR[row.status] ?? 'bg-slate-700 text-slate-300'}">
													{row.status}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/each}
			</div>
		</Card>
	{:else}
		<Card class="bg-slate-900 border-slate-700 p-12 text-center">
			<Flag class="size-10 text-slate-600 mx-auto mb-3" />
			<p class="text-slate-400">No placement deals logged yet.</p>
			<p class="text-slate-600 text-sm mt-1">Click "Add Placement Deal" to start tracking branding revenue.</p>
		</Card>
	{/if}

	<!-- By type + by event -->
	{#if data.placements.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- By placement type -->
			<Card class="bg-slate-900 border-slate-700">
				<div class="p-4 border-b border-slate-700">
					<h2 class="font-semibold text-white text-sm">Revenue by Placement Type</h2>
				</div>
				<div class="p-4 space-y-3">
					{#each Object.entries(data.byType).sort((a, b) => b[1].revenue - a[1].revenue) as [type, stats]}
						{@const pct = data.metrics.totalContracted > 0 ? Math.round(stats.revenue / data.metrics.totalContracted * 100) : 0}
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span class="text-slate-300">{TYPE_LABEL[type] ?? type}</span>
								<span class="text-white font-medium">{fmt(stats.revenue)} <span class="text-slate-500 font-normal">({fmtN(stats.qty)} units)</span></span>
							</div>
							<div class="h-1.5 bg-slate-800 rounded-full">
								<div class="h-1.5 bg-emerald-500 rounded-full" style="width:{pct}%"></div>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- By event -->
			<Card class="bg-slate-900 border-slate-700">
				<div class="p-4 border-b border-slate-700">
					<h2 class="font-semibold text-white text-sm">Revenue by Event</h2>
				</div>
				<div class="p-4 space-y-3">
					{#each data.byEvent as event}
						{@const pct = data.metrics.totalContracted > 0 ? Math.round(event.revenue / data.metrics.totalContracted * 100) : 0}
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span class="text-slate-300 truncate max-w-[60%]">{event.eventName}</span>
								<span class="text-white font-medium">{fmt(event.revenue)}</span>
							</div>
							<div class="h-1.5 bg-slate-800 rounded-full">
								<div class="h-1.5 bg-blue-500 rounded-full" style="width:{pct}%"></div>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>
	{/if}
</div>

<!-- Add Placement Modal -->
{#if showAdd}
	<div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
		<div class="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-5 border-b border-slate-700">
				<h2 class="font-semibold text-white">Add Placement Deal</h2>
				<button onclick={() => showAdd = false} class="text-slate-400 hover:text-white"><X class="size-5" /></button>
			</div>
			<form onsubmit={(e) => { e.preventDefault(); save(); }} class="p-5 space-y-4">
				<div class="grid grid-cols-2 gap-3">
					<div class="col-span-2">
						<label class="block text-xs text-slate-400 mb-1">Sponsor Name *</label>
						<input bind:value={form.sponsorName} class={INPUT} placeholder="e.g. Pechanga Resort Casino" required />
					</div>
					<div>
						<label class="block text-xs text-slate-400 mb-1">Event Name *</label>
						<input bind:value={form.eventName} class={INPUT} placeholder="e.g. FLI Golf Open — Phoenix" required />
					</div>
					<div>
						<label class="block text-xs text-slate-400 mb-1">Event Date</label>
						<input type="date" bind:value={form.eventDate} class={INPUT} />
					</div>
					<div>
						<label class="block text-xs text-slate-400 mb-1">Placement Type *</label>
						<select bind:value={form.placementType} class={SELECT}>
							<option value="fairway_sign">Fairway Sign</option>
							<option value="banner">Banner</option>
							<option value="tent_wrap">Tent Wrap</option>
							<option value="table_wrap">Table Wrap</option>
							<option value="flag">Flag</option>
							<option value="merch_display">Merch Display</option>
							<option value="directional">Directional</option>
							<option value="tee_box">Tee Box</option>
							<option value="green_surround">Green Surround</option>
							<option value="digital_board">Digital Board</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div>
						<label class="block text-xs text-slate-400 mb-1">Status</label>
						<select bind:value={form.status} class={SELECT}>
							<option value="proposed">Proposed</option>
							<option value="contracted">Contracted</option>
							<option value="invoiced">Invoiced</option>
							<option value="paid">Paid</option>
							<option value="activated">Activated</option>
							<option value="completed">Completed</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>
					<div>
						<label class="block text-xs text-slate-400 mb-1">Quantity</label>
						<input type="number" bind:value={form.quantity} class={INPUT} placeholder="0" min="0" />
					</div>
					<div>
						<label class="block text-xs text-slate-400 mb-1">Rate per Placement</label>
						<input type="number" bind:value={form.ratePerPlacement} class={INPUT} placeholder="0.00" min="0" step="0.01" />
					</div>
					<div>
						<label class="block text-xs text-slate-400 mb-1">Invoice Number</label>
						<input bind:value={form.invoiceNumber} class={INPUT} placeholder="INV-0001" />
					</div>
				</div>

				<!-- Live calc -->
				{#if gross > 0}
					<div class="bg-slate-800 rounded-lg p-3 text-sm text-center">
						<p class="text-slate-400 text-xs">Gross Revenue</p>
						<p class="text-emerald-400 font-bold text-xl">{fmt(gross)}</p>
						<p class="text-slate-500 text-xs">{fmtN(Number(form.quantity) || 0)} placements × {fmt(Number(form.ratePerPlacement) || 0)}</p>
					</div>
				{/if}

				<div>
					<label class="block text-xs text-slate-400 mb-1">Notes</label>
					<textarea bind:value={form.notes} class="{INPUT} h-16 resize-none" placeholder="Optional notes…"></textarea>
				</div>

				{#if saveErr}
					<p class="text-red-400 text-sm">{saveErr}</p>
				{/if}

				<div class="flex gap-3 pt-1">
					<Button type="button" variant="outline" onclick={() => showAdd = false} class="flex-1 border-slate-600 text-slate-300">Cancel</Button>
					<Button type="submit" disabled={saving} class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
						{saving ? 'Saving…' : 'Save Deal'}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
