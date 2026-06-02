<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Calendar, DollarSign, Users, AlertCircle, Plus, ChevronRight, Star, FlaskConical, Trash2, RotateCcw, Music } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	const fmt$ = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);
	const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

	const EVENT_TYPE_LABELS: Record<string, string> = {
		appearance: 'Appearance', clinic: 'Clinic', media: 'Media',
		promotional: 'Promotional', content_creation: 'Content Creation',
		tournament_broadcast: 'Tournament Broadcast',
		celebrity_appearance: 'Celebrity Appearance',
		music_act: 'Music Act',
		other: 'Other'
	};
	const EVENT_TYPE_COLORS: Record<string, string> = {
		appearance: 'bg-blue-900 text-blue-300',
		clinic: 'bg-green-900 text-green-300',
		media: 'bg-purple-900 text-purple-300',
		promotional: 'bg-orange-900 text-orange-300',
		content_creation: 'bg-pink-900 text-pink-300',
		tournament_broadcast: 'bg-yellow-900 text-yellow-300',
		celebrity_appearance: 'bg-amber-900 text-amber-300',
		music_act: 'bg-violet-900 text-violet-300',
		other: 'bg-gray-700 text-gray-300'
	};
	const STATUS_COLORS: Record<string, string> = {
		draft: 'bg-gray-700 text-gray-300',
		scheduled: 'bg-blue-900 text-blue-300',
		in_progress: 'bg-yellow-900 text-yellow-300',
		completed: 'bg-green-900 text-green-300',
		cancelled: 'bg-red-900 text-red-300'
	};

	let filterType = $state('');
	let filterStatus = $state('');
	let search = $state('');

	// Seed controls
	let seedBusy = $state(false);
	let seedMsg = $state('');
	async function runSeed() {
		if (!confirm('Seed test events? This will add sample data.')) return;
		seedBusy = true; seedMsg = '';
		try {
			const res = await fetch('/api/events/seed', { method: 'POST' });
			const d = await res.json();
			seedMsg = d.message;
			if (res.ok) { await invalidateAll(); }
		} catch { seedMsg = 'Seed failed'; }
		finally { seedBusy = false; }
	}
	async function clearSeed() {
		if (!confirm('Clear all seed test events? This cannot be undone.')) return;
		seedBusy = true; seedMsg = '';
		try {
			const res = await fetch('/api/events/seed', { method: 'DELETE' });
			const d = await res.json();
			seedMsg = d.message;
			if (res.ok) { await invalidateAll(); }
		} catch { seedMsg = 'Clear failed'; }
		finally { seedBusy = false; }
	}
	async function resetSeed() {
		if (!confirm('Clear all seed data and re-seed? This cannot be undone.')) return;
		seedBusy = true; seedMsg = '';
		try {
			await fetch('/api/events/seed', { method: 'DELETE' });
			const res = await fetch('/api/events/seed', { method: 'POST' });
			const d = await res.json();
			seedMsg = d.message;
			if (res.ok) { await invalidateAll(); }
		} catch { seedMsg = 'Reset failed'; }
		finally { seedBusy = false; }
	}

	const isAdmin = true; // internal dashboard — all authenticated users can manage test data

	const events = $derived(
		(data.events ?? []).filter((e: any) => {
			if (filterType && e.eventType !== filterType) return false;
			if (filterStatus && e.status !== filterStatus) return false;
			if (search) {
				const q = search.toLowerCase();
				return e.name?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q);
			}
			return true;
		})
	);

	// Count talent per event
	const talentByEvent = $derived(
		(data.eventTalent ?? []).reduce((acc: Record<string, number>, et: any) => {
			acc[et.event] = (acc[et.event] || 0) + 1;
			return acc;
		}, {})
	);

	const s = data.stats;
</script>

<svelte:head><title>Events — FliHub</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-white">Events</h1>
			<p class="text-gray-400 text-sm mt-1">Appearances, broadcasts, clinics and talent assignments</p>
		</div>
		<Button href="/dashboard/events/new">
			<Plus class="w-4 h-4 mr-2" />New Event
		</Button>
	</div>
	<div>
		<Button href="/dashboard/events/bookings" variant="outline" class="gap-2">
			<Music class="w-4 h-4" /> Event Booking Pipeline
		</Button>
	</div>

	<!-- Stats -->
	{#if s}
	<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
		<div class="col-span-2 p-4 bg-gray-800 rounded-lg border border-gray-700">
			<div class="text-2xl font-bold text-white">{s.totalEvents}</div>
			<div class="text-xs text-gray-400 mt-1">Total Events</div>
		</div>
		<div class="col-span-2 p-4 bg-blue-900/40 rounded-lg border border-blue-800">
			<div class="text-2xl font-bold text-blue-400">{s.scheduled}</div>
			<div class="text-xs text-gray-400 mt-1">Scheduled</div>
		</div>
		<div class="col-span-2 p-4 bg-green-900/40 rounded-lg border border-green-800">
			<div class="text-2xl font-bold text-green-400">{fmt$(s.totalPaid)}</div>
			<div class="text-xs text-gray-400 mt-1">Total Paid</div>
		</div>
		<div class="col-span-2 p-4 bg-yellow-900/40 rounded-lg border border-yellow-800">
			<div class="text-2xl font-bold text-yellow-400">{fmt$(s.totalPending)}</div>
			<div class="text-xs text-gray-400 mt-1">Pending Payments</div>
		</div>
	</div>

	<!-- Alert banners -->
	{#if s.pendingApprovals > 0}
	<div class="flex items-center gap-3 p-4 bg-orange-900/40 border border-orange-700 rounded-lg text-orange-300">
		<AlertCircle class="w-5 h-5 shrink-0" />
		<span class="text-sm font-medium">{s.pendingApprovals} event payment{s.pendingApprovals > 1 ? 's' : ''} awaiting approval</span>
		<Button href="/dashboard/approvals" variant="outline" class="ml-auto text-xs py-1 px-3">Review</Button>
	</div>
	{/if}
	{#if s.bonusEligible > 0}
	<div class="flex items-center gap-3 p-4 bg-yellow-900/40 border border-yellow-700 rounded-lg text-yellow-300">
		<Star class="w-5 h-5 shrink-0" />
		<span class="text-sm font-medium">{s.bonusEligible} talent member{s.bonusEligible > 1 ? 's' : ''} eligible for attendance bonus</span>
		<Button href="/dashboard/events/bonuses" variant="outline" class="ml-auto text-xs py-1 px-3">Review Bonuses</Button>
	</div>
	{/if}
	{/if}

	<!-- Filters -->
	<div class="flex flex-wrap gap-3">
		<input type="text" bind:value={search} placeholder="Search events..." class="rounded-lg border border-gray-600 bg-gray-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
		<select bind:value={filterType} class="rounded-lg border border-gray-600 bg-gray-800 text-white px-3 py-2 text-sm focus:outline-none">
			<option value="">All Types</option>
			{#each Object.entries(EVENT_TYPE_LABELS) as [val, label]}
				<option value={val}>{label}</option>
			{/each}
		</select>
		<select bind:value={filterStatus} class="rounded-lg border border-gray-600 bg-gray-800 text-white px-3 py-2 text-sm focus:outline-none">
			<option value="">All Statuses</option>
			<option value="draft">Draft</option>
			<option value="scheduled">Scheduled</option>
			<option value="in_progress">In Progress</option>
			<option value="completed">Completed</option>
			<option value="cancelled">Cancelled</option>
		</select>
	</div>

	<!-- Seed controls (admin only) -->
	{#if isAdmin}
	<div class="flex flex-wrap items-center gap-3 p-4 bg-gray-900 border border-dashed border-gray-600 rounded-lg">
		<div class="flex items-center gap-2 text-xs text-gray-500 font-medium">
			<FlaskConical class="w-4 h-4" />TEST DATA
		</div>
		<button onclick={runSeed} disabled={seedBusy} class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-300 border border-blue-700 disabled:opacity-50">
			<Plus class="w-3 h-3" />{seedBusy ? 'Working...' : 'Seed Test Events'}
		</button>
		<button onclick={clearSeed} disabled={seedBusy} class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-red-900/60 hover:bg-red-800 text-red-300 border border-red-700 disabled:opacity-50">
			<Trash2 class="w-3 h-3" />{seedBusy ? 'Working...' : 'Clear Seed Data'}
		</button>
		<button onclick={resetSeed} disabled={seedBusy} class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-yellow-900/60 hover:bg-yellow-800 text-yellow-300 border border-yellow-700 disabled:opacity-50">
			<RotateCcw class="w-3 h-3" />{seedBusy ? 'Working...' : 'Reset (Clear + Re-seed)'}
		</button>
		{#if seedMsg}<span class="text-xs text-gray-400 ml-1">{seedMsg}</span>{/if}
	</div>
	{/if}

	<!-- Events list -->
	{#if events.length === 0}
	<div class="text-center py-16 text-gray-500">
		<Calendar class="w-12 h-12 mx-auto mb-3 opacity-40" />
		<p class="text-lg">No events found</p>
		<Button href="/dashboard/events/new" class="mt-4">Create your first event</Button>
	</div>
	{:else}
	<div class="space-y-2">
		{#each events as event (event.id)}
		<a href="/dashboard/events/{event.id}" class="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-500 hover:bg-gray-750 transition-colors group">
			<div class="flex items-center gap-4 min-w-0">
				<div class="shrink-0">
					<Badge class={EVENT_TYPE_COLORS[event.eventType] ?? 'bg-gray-700 text-gray-300'}>
						{EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
					</Badge>
				</div>
				<div class="min-w-0">
					<div class="font-semibold text-white truncate">{event.name}</div>
					<div class="flex flex-wrap gap-3 text-xs text-gray-400 mt-0.5">
						{#if event.eventDate}<span>📅 {fmtDate(event.eventDate)}</span>{/if}
						{#if event.location}<span>📍 {event.location}</span>{/if}
						{#if event.expand?.tournament}<span>🏆 {event.expand.tournament.name}</span>{/if}
					</div>
				</div>
			</div>
			<div class="flex items-center gap-4 shrink-0 ml-4">
				<div class="text-right hidden sm:block">
					<div class="text-sm font-semibold text-white">{fmt$(event.budget || 0)}</div>
					<div class="text-xs text-gray-400">budget</div>
				</div>
				<div class="flex items-center gap-1 text-sm text-gray-400">
					<Users class="w-4 h-4" />
					{talentByEvent[event.id] ?? 0}
				</div>
				<Badge class={STATUS_COLORS[event.status] ?? 'bg-gray-700 text-gray-300'}>{event.status}</Badge>
				<ChevronRight class="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
			</div>
		</a>
		{/each}
	</div>
	{/if}
</div>
