<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import Card from '$lib/components/ui/card.svelte';
	import type { PageData } from './$types';
	import {
		Ticket, TrendingUp, DollarSign, Users, Plus, X,
		CheckCircle2, Clock, AlertCircle, BarChart3, Globe
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const fmt = (n: number) => '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
	const fmtN = (n: number) => (n ?? 0).toLocaleString();

	// ── Add sale modal ────────────────────────────────────────────────────────
	let showAdd = $state(false);
	let showDaily = $state(false);
	let saving  = $state(false);
	let saveErr = $state('');

	let form = $state({
		eventName:      '',
		eventDate:      '',
		venue:          '',
		ticketType:     'general_admission',
		quantity:       '',
		pricePerTicket: '',
		platformFees:   '',
		salesChannel:   'website',
		status:         'projected',
		tournamentId:   '',
		notes:          '',
	});

	const gross = $derived(
		(Number(form.quantity) || 0) * (Number(form.pricePerTicket) || 0)
	);
	const net = $derived(gross - (Number(form.platformFees) || 0));

	let dailyForm = $state({
		eventName: '',
		eventDate: new Date().toISOString().slice(0, 10),
		venue: '',
		amountReceived: '',
		platformFees: '',
		ticketsSold: '',
		status: 'completed',
		notes: ''
	});

	const dailyGross = $derived(Number(dailyForm.amountReceived) || 0);
	const dailyFees = $derived(Number(dailyForm.platformFees) || 0);
	const dailyNet = $derived(dailyGross - dailyFees);

	async function save() {
		if (!form.eventName.trim() || !form.eventDate || !form.quantity || !form.pricePerTicket) {
			saveErr = 'Event name, date, quantity, and price are required.';
			return;
		}
		saving = true; saveErr = '';
		try {
			const res = await fetch('/api/ticket-sales', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					quantity:       Number(form.quantity),
					pricePerTicket: Number(form.pricePerTicket),
					grossRevenue:   gross,
					platformFees:   Number(form.platformFees) || 0,
					netRevenue:     net,
				}),
			});
			if (!res.ok) { const e = await res.json(); saveErr = e.message ?? 'Failed'; return; }
			showAdd = false;
			form = { eventName: '', eventDate: '', venue: '', ticketType: 'general_admission', quantity: '', pricePerTicket: '', platformFees: '', salesChannel: 'website', status: 'projected', tournamentId: '', notes: '' };
			await invalidateAll();
		} catch { saveErr = 'Network error'; }
		finally { saving = false; }
	}

	async function saveDaily() {
		if (!dailyForm.eventDate || !dailyForm.amountReceived) {
			saveErr = 'Date and amount received are required.';
			return;
		}
		const quantity = Math.max(1, Number(dailyForm.ticketsSold) || 1);
		saving = true; saveErr = '';
		try {
			const res = await fetch('/api/ticket-sales', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					eventName: dailyForm.eventName.trim() || `Website ticket sales — ${dailyForm.eventDate}`,
					eventDate: dailyForm.eventDate,
					venue: dailyForm.venue.trim(),
					ticketType: 'general_admission',
					quantity,
					pricePerTicket: dailyGross / quantity,
					grossRevenue: dailyGross,
					platformFees: dailyFees,
					netRevenue: dailyNet,
					status: dailyForm.status,
					salesChannel: 'website',
					receivedDate: dailyForm.eventDate,
					notes: ['Daily admin website intake summary.', dailyForm.notes.trim()].filter(Boolean).join(' ')
				}),
			});
			if (!res.ok) { const e = await res.json(); saveErr = e.message ?? 'Failed'; return; }
			showDaily = false;
			dailyForm = { eventName: '', eventDate: new Date().toISOString().slice(0, 10), venue: '', amountReceived: '', platformFees: '', ticketsSold: '', status: 'completed', notes: '' };
			await invalidateAll();
		} catch { saveErr = 'Network error'; }
		finally { saving = false; }
	}

	// ── Status helpers ────────────────────────────────────────────────────────
	const STATUS_COLOR: Record<string, string> = {
		projected:  'bg-slate-700 text-slate-300',
		on_sale:    'bg-blue-900/50 text-blue-300',
		sold_out:   'bg-purple-900/50 text-purple-300',
		completed:  'bg-emerald-900/50 text-emerald-300',
		cancelled:  'bg-red-900/50 text-red-300',
		reconciled: 'bg-teal-900/50 text-teal-300',
	};
	const TYPE_LABEL: Record<string, string> = {
		general_admission: 'General',
		vip:               'VIP',
		premium:           'Premium',
		early_bird:        'Early Bird',
		group:             'Group',
		comp:              'Comp',
	};
	const CHANNEL_LABEL: Record<string, string> = {
		website:       'Website',
		box_office:    'Box Office',
		third_party:   'Third Party',
		ambassador:    'Ambassador',
		comp:          'Comp',
	};

	const INPUT = 'w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500';
	const SELECT = INPUT;
</script>

<div class="min-h-screen bg-slate-950 text-white p-6 space-y-6">

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="p-2 bg-emerald-600/20 rounded-lg">
				<Ticket class="size-6 text-emerald-400" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-white">Ticket Revenue</h1>
				<p class="text-slate-400 text-sm">Track ticket sales across all FLI Golf events</p>
			</div>
		</div>
		<div class="flex flex-wrap justify-end gap-2">
			<Button onclick={() => showDaily = true} variant="outline" class="gap-2 border-emerald-700 text-emerald-300 hover:bg-emerald-950/40">
				<DollarSign class="size-4" /> Daily Website Intake
			</Button>
			<Button onclick={() => showAdd = true} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
				<Plus class="size-4" /> Log Ticket Sale
			</Button>
		</div>
	</div>

	<!-- KPI Strip -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		{#each [
			{ label: 'Gross Revenue',    value: fmt(data.metrics.totalGross),    sub: `${fmtN(data.metrics.totalTickets)} tickets sold`,  icon: DollarSign,  color: 'text-emerald-400' },
			{ label: 'Net Revenue',      value: fmt(data.metrics.totalNet),      sub: `${fmt(data.metrics.totalFees)} in platform fees`,   icon: TrendingUp,  color: 'text-blue-400'    },
			{ label: 'Received / Recon', value: fmt(data.metrics.totalReceived), sub: `${fmt(data.metrics.totalReconciled)} reconciled`,   icon: CheckCircle2,color: 'text-teal-400'    },
			{ label: 'Projected',        value: fmt(data.metrics.totalProjected),sub: `${data.metrics.eventCount} events tracked`,         icon: BarChart3,   color: 'text-amber-400'   },
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

	<!-- Events breakdown -->
	{#if data.events.length > 0}
		<Card class="bg-slate-900 border-slate-700">
			<div class="p-4 border-b border-slate-700">
				<h2 class="font-semibold text-white">Revenue by Event</h2>
			</div>
			<div class="divide-y divide-slate-800">
				{#each data.events as event}
					<div class="p-4">
						<div class="flex items-start justify-between mb-3">
							<div>
								<p class="font-medium text-white">{event.eventName}</p>
								<p class="text-slate-400 text-sm">{event.venue || '—'} · {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
							</div>
							<div class="text-right">
								<p class="font-bold text-emerald-400">{fmt(event.gross)}</p>
								<p class="text-slate-400 text-xs">{fmt(event.net)} net · {fmtN(event.tickets)} tickets</p>
							</div>
						</div>
						<!-- Ticket type rows for this event -->
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="text-slate-500 text-xs">
										<th class="text-left pb-1">Type</th>
										<th class="text-left pb-1">Channel</th>
										<th class="text-right pb-1">Qty</th>
										<th class="text-right pb-1">Price</th>
										<th class="text-right pb-1">Gross</th>
										<th class="text-right pb-1">Fees</th>
										<th class="text-right pb-1">Net</th>
										<th class="text-left pb-1 pl-3">Status</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-800/50">
									{#each event.rows as row}
										<tr class="text-slate-300">
											<td class="py-1.5">{TYPE_LABEL[row.ticketType] ?? row.ticketType}</td>
											<td class="py-1.5 text-slate-400">{CHANNEL_LABEL[row.salesChannel] ?? row.salesChannel ?? '—'}</td>
											<td class="py-1.5 text-right">{fmtN(row.quantity)}</td>
											<td class="py-1.5 text-right">{fmt(row.pricePerTicket)}</td>
											<td class="py-1.5 text-right text-emerald-400">{fmt(row.grossRevenue ?? row.quantity * row.pricePerTicket)}</td>
											<td class="py-1.5 text-right text-red-400">{row.platformFees ? fmt(row.platformFees) : '—'}</td>
											<td class="py-1.5 text-right font-medium">{row.netRevenue ? fmt(row.netRevenue) : '—'}</td>
											<td class="py-1.5 pl-3">
												<span class="px-2 py-0.5 rounded text-xs font-medium {STATUS_COLOR[row.status] ?? 'bg-slate-700 text-slate-300'}">
													{row.status.replace(/_/g, ' ')}
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
			<Ticket class="size-10 text-slate-600 mx-auto mb-3" />
			<p class="text-slate-400">No ticket sales logged yet.</p>
			<p class="text-slate-600 text-sm mt-1">Click "Log Ticket Sale" to add your first event.</p>
		</Card>
	{/if}

	<!-- By type + channel -->
	{#if data.sales.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- By ticket type -->
			<Card class="bg-slate-900 border-slate-700">
				<div class="p-4 border-b border-slate-700">
					<h2 class="font-semibold text-white text-sm">Revenue by Ticket Type</h2>
				</div>
				<div class="p-4 space-y-3">
					{#each Object.entries(data.byType).sort((a, b) => b[1].gross - a[1].gross) as [type, stats]}
						{@const pct = data.metrics.totalGross > 0 ? Math.round(stats.gross / data.metrics.totalGross * 100) : 0}
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span class="text-slate-300">{TYPE_LABEL[type] ?? type}</span>
								<span class="text-white font-medium">{fmt(stats.gross)} <span class="text-slate-500 font-normal">({fmtN(stats.tickets)} tickets)</span></span>
							</div>
							<div class="h-1.5 bg-slate-800 rounded-full">
								<div class="h-1.5 bg-emerald-500 rounded-full" style="width:{pct}%"></div>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- By channel -->
			<Card class="bg-slate-900 border-slate-700">
				<div class="p-4 border-b border-slate-700">
					<h2 class="font-semibold text-white text-sm">Revenue by Sales Channel</h2>
				</div>
				<div class="p-4 space-y-3">
					{#each Object.entries(data.byChannel).sort((a, b) => b[1] - a[1]) as [channel, gross]}
						{@const pct = data.metrics.totalGross > 0 ? Math.round(gross / data.metrics.totalGross * 100) : 0}
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span class="text-slate-300">{CHANNEL_LABEL[channel] ?? channel}</span>
								<span class="text-white font-medium">{fmt(gross)} <span class="text-slate-500 font-normal">({pct}%)</span></span>
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

	<!-- Future API guidance -->
	<Card class="bg-slate-900 border-slate-700 p-5">
		<div class="flex flex-col lg:flex-row gap-5">
			<div class="lg:w-1/3">
				<p class="text-xs uppercase tracking-wide text-emerald-400 font-semibold mb-1">Website booking bridge</p>
				<h2 class="text-lg font-bold text-white">Future API payload target</h2>
				<p class="text-sm text-slate-400 mt-2">
					The daily intake form writes the same revenue shape the public website should send after checkout succeeds.
				</p>
			</div>
			<div class="flex-1 rounded-lg border border-slate-700 bg-slate-950 p-4 overflow-x-auto">
				<pre class="text-xs text-slate-300 leading-relaxed"><code>{`POST /api/ticket-sales
{
  "eventName": "FLI Golf Open — Phoenix",
  "eventDate": "2027-01-31",
  "venue": "Venue or market",
  "ticketType": "general_admission",
  "quantity": 124,
  "pricePerTicket": 65,
  "grossRevenue": 8060,
  "platformFees": 322.40,
  "netRevenue": 7737.60,
  "status": "completed",
  "salesChannel": "website",
  "tournamentId": "optional-tournament-id",
  "invoiceNumber": "processor-session-or-order-id",
  "receivedDate": "2027-01-31",
  "notes": "Stripe checkout settlement batch"
}`}</code></pre>
			</div>
		</div>
	</Card>
	</div>

<!-- Daily Intake Modal -->
{#if showDaily}
	<div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
		<div class="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-5 border-b border-slate-700">
				<h2 class="font-semibold text-white">Daily Website Ticket Intake</h2>
				<button onclick={() => showDaily = false} class="text-slate-400 hover:text-white"><X class="size-5" /></button>
			</div>
			<form onsubmit={(e) => { e.preventDefault(); saveDaily(); }} class="p-5 space-y-4">
				<div class="grid grid-cols-2 gap-3">
					<div class="col-span-2">
						<label for="daily-event-name" class="block text-xs text-slate-400 mb-1">Event / Batch Name</label>
						<input id="daily-event-name" bind:value={dailyForm.eventName} class={INPUT} placeholder="Defaults to Website ticket sales — date" />
					</div>
					<div>
						<label for="daily-event-date" class="block text-xs text-slate-400 mb-1">Received Date *</label>
						<input id="daily-event-date" type="date" bind:value={dailyForm.eventDate} class={INPUT} required />
					</div>
					<div>
						<label for="daily-venue" class="block text-xs text-slate-400 mb-1">Venue / Market</label>
						<input id="daily-venue" bind:value={dailyForm.venue} class={INPUT} placeholder="Optional" />
					</div>
					<div>
						<label for="daily-amount" class="block text-xs text-slate-400 mb-1">Amount Received *</label>
						<input id="daily-amount" type="number" bind:value={dailyForm.amountReceived} class={INPUT} min="0" step="0.01" placeholder="0.00" required />
					</div>
					<div>
						<label for="daily-fees" class="block text-xs text-slate-400 mb-1">Platform Fees</label>
						<input id="daily-fees" type="number" bind:value={dailyForm.platformFees} class={INPUT} min="0" step="0.01" placeholder="0.00" />
					</div>
					<div>
						<label for="daily-tickets" class="block text-xs text-slate-400 mb-1">Tickets Sold</label>
						<input id="daily-tickets" type="number" bind:value={dailyForm.ticketsSold} class={INPUT} min="0" step="1" placeholder="Optional" />
					</div>
					<div>
						<label for="daily-status" class="block text-xs text-slate-400 mb-1">Status</label>
						<select id="daily-status" bind:value={dailyForm.status} class={SELECT}>
							<option value="completed">Completed</option>
							<option value="reconciled">Reconciled</option>
						</select>
					</div>
				</div>

				{#if dailyGross > 0}
					<div class="bg-slate-800 rounded-lg p-3 text-sm grid grid-cols-3 gap-2 text-center">
						<div>
							<p class="text-slate-400 text-xs">Gross</p>
							<p class="text-emerald-400 font-bold">{fmt(dailyGross)}</p>
						</div>
						<div>
							<p class="text-slate-400 text-xs">Fees</p>
							<p class="text-red-400 font-bold">−{fmt(dailyFees)}</p>
						</div>
						<div>
							<p class="text-slate-400 text-xs">Net</p>
							<p class="text-white font-bold">{fmt(dailyNet)}</p>
						</div>
					</div>
				{/if}

				<div>
					<label for="daily-notes" class="block text-xs text-slate-400 mb-1">Notes</label>
					<textarea id="daily-notes" bind:value={dailyForm.notes} class="{INPUT} h-16 resize-none" placeholder="Settlement batch, processor report, order range…"></textarea>
				</div>

				{#if saveErr}
					<p class="text-red-400 text-sm">{saveErr}</p>
				{/if}

				<div class="flex gap-3 pt-1">
					<Button type="button" variant="outline" onclick={() => showDaily = false} class="flex-1 border-slate-600 text-slate-300">Cancel</Button>
					<Button type="submit" disabled={saving} class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
						{saving ? 'Saving…' : 'Save Daily Intake'}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Add Sale Modal -->
{#if showAdd}
	<div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
		<div class="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-5 border-b border-slate-700">
				<h2 class="font-semibold text-white">Log Ticket Sale</h2>
				<button onclick={() => showAdd = false} class="text-slate-400 hover:text-white"><X class="size-5" /></button>
			</div>
			<form onsubmit={(e) => { e.preventDefault(); save(); }} class="p-5 space-y-4">
				<div class="grid grid-cols-2 gap-3">
					<div class="col-span-2">
						<label for="ticket-event-name" class="block text-xs text-slate-400 mb-1">Event Name *</label>
						<input id="ticket-event-name" bind:value={form.eventName} class={INPUT} placeholder="e.g. FLI Golf Open — Phoenix" required />
					</div>
					<div>
						<label for="ticket-event-date" class="block text-xs text-slate-400 mb-1">Event Date *</label>
						<input id="ticket-event-date" type="date" bind:value={form.eventDate} class={INPUT} required />
					</div>
					<div>
						<label for="ticket-venue" class="block text-xs text-slate-400 mb-1">Venue</label>
						<input id="ticket-venue" bind:value={form.venue} class={INPUT} placeholder="e.g. Pechanga Resort" />
					</div>
					<div>
						<label for="ticket-type" class="block text-xs text-slate-400 mb-1">Ticket Type *</label>
						<select id="ticket-type" bind:value={form.ticketType} class={SELECT}>
							<option value="general_admission">General Admission</option>
							<option value="vip">VIP</option>
							<option value="premium">Premium</option>
							<option value="early_bird">Early Bird</option>
							<option value="group">Group</option>
							<option value="comp">Comp</option>
						</select>
					</div>
					<div>
						<label for="ticket-sales-channel" class="block text-xs text-slate-400 mb-1">Sales Channel</label>
						<select id="ticket-sales-channel" bind:value={form.salesChannel} class={SELECT}>
							<option value="website">Website</option>
							<option value="box_office">Box Office</option>
							<option value="third_party">Third Party</option>
							<option value="ambassador">Ambassador</option>
							<option value="comp">Comp</option>
						</select>
					</div>
					<div>
						<label for="ticket-quantity" class="block text-xs text-slate-400 mb-1">Quantity *</label>
						<input id="ticket-quantity" type="number" bind:value={form.quantity} class={INPUT} placeholder="0" min="0" required />
					</div>
					<div>
						<label for="ticket-price" class="block text-xs text-slate-400 mb-1">Price per Ticket *</label>
						<input id="ticket-price" type="number" bind:value={form.pricePerTicket} class={INPUT} placeholder="0.00" min="0" step="0.01" required />
					</div>
					<div>
						<label for="ticket-fees" class="block text-xs text-slate-400 mb-1">Platform Fees</label>
						<input id="ticket-fees" type="number" bind:value={form.platformFees} class={INPUT} placeholder="0.00" min="0" step="0.01" />
					</div>
					<div>
						<label for="ticket-status" class="block text-xs text-slate-400 mb-1">Status</label>
						<select id="ticket-status" bind:value={form.status} class={SELECT}>
							<option value="projected">Projected</option>
							<option value="on_sale">On Sale</option>
							<option value="sold_out">Sold Out</option>
							<option value="completed">Completed</option>
							<option value="reconciled">Reconciled</option>
							<option value="cancelled">Cancelled</option>
						</select>
					</div>
				</div>

				<!-- Live calc -->
				{#if gross > 0}
					<div class="bg-slate-800 rounded-lg p-3 text-sm grid grid-cols-3 gap-2 text-center">
						<div>
							<p class="text-slate-400 text-xs">Gross</p>
							<p class="text-emerald-400 font-bold">{fmt(gross)}</p>
						</div>
						<div>
							<p class="text-slate-400 text-xs">Fees</p>
							<p class="text-red-400 font-bold">−{fmt(Number(form.platformFees) || 0)}</p>
						</div>
						<div>
							<p class="text-slate-400 text-xs">Net</p>
							<p class="text-white font-bold">{fmt(net)}</p>
						</div>
					</div>
				{/if}

				<div>
					<label for="ticket-notes" class="block text-xs text-slate-400 mb-1">Notes</label>
					<textarea id="ticket-notes" bind:value={form.notes} class="{INPUT} h-16 resize-none" placeholder="Optional notes…"></textarea>
				</div>

				{#if saveErr}
					<p class="text-red-400 text-sm">{saveErr}</p>
				{/if}

				<div class="flex gap-3 pt-1">
					<Button type="button" variant="outline" onclick={() => showAdd = false} class="flex-1 border-slate-600 text-slate-300">Cancel</Button>
					<Button type="submit" disabled={saving} class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
						{saving ? 'Saving…' : 'Save Sale'}
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
