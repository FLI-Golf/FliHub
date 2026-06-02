<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button';
	import { PipelineBoard } from '$lib/pipeline';
	import { pipelineMove } from '$lib/pipeline';
	import type { PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from '$lib/pipeline';
	import { AlertCircle, Calendar, DollarSign, Mic2, Music, Plus, Star, X } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const BOARD_CONFIG: PipelineBoardConfig = {
		columnWidth: 'w-56',
		stages: [
			{ key: 'invited', label: 'Outreach', colorClass: 'bg-slate-700 text-slate-300 border-slate-600' },
			{ key: 'confirmed', label: 'Booked', colorClass: 'bg-emerald-900/50 text-emerald-300 border-emerald-700', isSuccess: true },
			{ key: 'completed', label: 'Completed', colorClass: 'bg-blue-900/50 text-blue-300 border-blue-700', isSuccess: true }
		],
		terminalStages: [
			{ key: 'declined', label: 'Declined', colorClass: 'bg-red-900/50 text-red-300 border-red-700', terminal: true },
			{ key: 'no_show', label: 'No Show', colorClass: 'bg-orange-900/50 text-orange-300 border-orange-700', terminal: true }
		]
	};

	const ROLE_LABELS: Record<string, string> = {
		celebrity_appearance: 'Celebrity',
		music_act: 'Music Act'
	};
	const ROLE_COLORS: Record<string, string> = {
		celebrity_appearance: 'bg-amber-900/50 text-amber-300 border-amber-700',
		music_act: 'bg-violet-900/50 text-violet-300 border-violet-700'
	};

	const fmt$ = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);
	const fmtDate = (d: string) =>
		d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date';

	let moveError = $state('');
	let showNew = $state(false);
	let bookingError = $state('');
	let bookingBusy = $state(false);
	let bookingForm = $state({
		eventId: '',
		talentId: '',
		role: 'celebrity_appearance',
		fee: '',
		status: 'invited'
	});

	const paymentsByBooking = $derived(
		(data.eventPayments ?? []).reduce((acc: Record<string, any[]>, payment: any) => {
			if (!payment.eventTalent) return acc;
			acc[payment.eventTalent] ??= [];
			acc[payment.eventTalent].push(payment);
			return acc;
		}, {})
	);

	const items = $derived<PipelineCardItem[]>(
		(data.eventTalent ?? []).map((booking: any) => {
			const event = booking.expand?.event;
			const bookingPayments = paymentsByBooking[booking.id] ?? [];
			const paymentStatus = bookingPayments.find((payment: any) => payment.status === 'approval_required')?.status
				?? bookingPayments[0]?.status;
			const tags = [
				{ label: ROLE_LABELS[booking.role] ?? booking.role, colorClass: ROLE_COLORS[booking.role] ?? 'bg-slate-700 text-slate-300 border-slate-600' }
			];
			if (paymentStatus) {
				tags.push({
					label: paymentStatus.replaceAll('_', ' '),
					colorClass: paymentStatus === 'paid'
						? 'bg-emerald-900/50 text-emerald-300 border-emerald-700'
						: 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
				});
			}

			return {
				id: booking.id,
				status: booking.status,
				title: booking.expand?.talent?.name ?? 'Unassigned talent',
				subtitle: event?.name ?? 'Event not linked',
				badge: { label: fmt$(booking.confirmedRate ?? 0), colorClass: 'bg-slate-800 text-slate-200 border-slate-600' },
				tags,
				meta: `${fmtDate(event?.eventDate)}${event?.location ? ` · ${event.location}` : ''}`,
				href: event?.id ? `/dashboard/events/${event.id}` : undefined,
				raw: booking
			};
		})
	);

	async function handleMove(e: PipelineMoveEvent) {
		const booking = e.item.raw;
		moveError = '';
		const result = await pipelineMove(`/api/events/${booking.event}/talent/${booking.id}`, e.to);
		if (!result.ok) moveError = result.error?.message ?? 'Move failed';
		else await invalidateAll();
	}

	async function createBooking(e: SubmitEvent) {
		e.preventDefault();
		bookingError = '';
		if (!bookingForm.eventId || !bookingForm.talentId) {
			bookingError = 'Event and talent are required';
			return;
		}
		bookingBusy = true;
		try {
			const res = await fetch(`/api/events/${bookingForm.eventId}/talent`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					talentId: bookingForm.talentId,
					role: bookingForm.role,
					rateOverride: bookingForm.fee ? Number(bookingForm.fee) : null,
					status: bookingForm.status
				})
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message ?? `Error ${res.status}`);
			}
			showNew = false;
			bookingForm = { eventId: '', talentId: '', role: 'celebrity_appearance', fee: '', status: 'invited' };
			await invalidateAll();
		} catch (err: any) {
			bookingError = err?.message ?? 'Failed to create booking';
		} finally {
			bookingBusy = false;
		}
	}

	const INPUT = 'w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-500';
	const LABEL = 'block text-xs font-medium text-slate-400 mb-1';
	const s = $derived(data.stats);
</script>

<svelte:head><title>Event Booking Pipeline — FliHub</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-start justify-between gap-4">
		<div>
			<Button href="/dashboard/events" variant="ghost" class="gap-2 text-slate-400 hover:text-slate-100 -ml-2 mb-2 text-sm">
				← Events
			</Button>
			<h1 class="text-3xl font-bold tracking-tight">Event Booking Pipeline</h1>
			<p class="text-muted-foreground mt-1">Book celebrity appearances and music acts, track fees, and hand booked talent into event payment generation.</p>
		</div>
		<Button onclick={() => showNew = true} class="gap-2 bg-violet-600 hover:bg-violet-700 text-white shrink-0">
			<Plus class="size-4" /> New Booking
		</Button>
	</div>

	{#if s}
		<div class="grid grid-cols-2 lg:grid-cols-6 gap-3">
			<Card class="p-4 bg-slate-800/40 border-slate-700">
				<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Bookings</p>
				<p class="text-2xl font-bold text-slate-100">{s.totalBookings}</p>
			</Card>
			<Card class="p-4 bg-amber-950/40 border-amber-800/50">
				<p class="text-xs text-amber-400 uppercase tracking-wide mb-1">Celebrity</p>
				<p class="text-2xl font-bold text-amber-300">{s.celebrityBookings}</p>
			</Card>
			<Card class="p-4 bg-violet-950/40 border-violet-800/50">
				<p class="text-xs text-violet-400 uppercase tracking-wide mb-1">Music Acts</p>
				<p class="text-2xl font-bold text-violet-300">{s.musicBookings}</p>
			</Card>
			<Card class="p-4 bg-slate-800/40 border-slate-700">
				<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Committed Fees</p>
				<p class="text-xl font-bold text-slate-100">{fmt$(s.totalFees)}</p>
			</Card>
			<Card class="p-4 bg-emerald-950/40 border-emerald-800/50">
				<p class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Paid</p>
				<p class="text-xl font-bold text-emerald-300">{fmt$(s.paidFees)}</p>
			</Card>
			<Card class="p-4 bg-yellow-950/40 border-yellow-800/50">
				<p class="text-xs text-yellow-400 uppercase tracking-wide mb-1">Pending Pay</p>
				<p class="text-xl font-bold text-yellow-300">{fmt$(s.pendingFees)}</p>
			</Card>
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<div class="flex items-center gap-3">
				<div class="size-9 rounded-lg bg-amber-900/40 flex items-center justify-center">
					<Star class="size-4 text-amber-300" />
				</div>
				<div>
					<p class="font-semibold text-slate-100">Celebrity Appearance Fees</p>
					<p class="text-xs text-slate-400">Track appearance asks, booking confirmations, and approval-ready fees.</p>
				</div>
			</div>
		</Card>
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<div class="flex items-center gap-3">
				<div class="size-9 rounded-lg bg-violet-900/40 flex items-center justify-center">
					<Music class="size-4 text-violet-300" />
				</div>
				<div>
					<p class="font-semibold text-slate-100">Music Acts</p>
					<p class="text-xs text-slate-400">Move artists from outreach to booked, then generate event payments.</p>
				</div>
			</div>
		</Card>
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<div class="flex items-center gap-3">
				<div class="size-9 rounded-lg bg-blue-900/40 flex items-center justify-center">
					<DollarSign class="size-4 text-blue-300" />
				</div>
				<div>
					<p class="font-semibold text-slate-100">Payment Handoff</p>
					<p class="text-xs text-slate-400">Booked talent uses the same event payment generation flow as broadcasters.</p>
				</div>
			</div>
		</Card>
	</div>

	{#if moveError}
		<div class="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
			<AlertCircle class="size-4 shrink-0" />{moveError}
		</div>
	{/if}

	<PipelineBoard config={BOARD_CONFIG} {items} onmove={handleMove} />
</div>

{#if showNew}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
		<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-5 border-b border-slate-700">
				<h2 class="text-base font-semibold text-slate-100 flex items-center gap-2">
					<Mic2 class="size-4 text-violet-400" /> New Event Booking
				</h2>
				<button onclick={() => showNew = false} class="text-slate-400 hover:text-slate-100">
					<X class="size-5" />
				</button>
			</div>
			<form onsubmit={createBooking} class="p-5 space-y-4">
				{#if bookingError}
					<p class="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">{bookingError}</p>
				{/if}

				<div>
					<label for="booking-event" class={LABEL}>Event *</label>
					<select id="booking-event" bind:value={bookingForm.eventId} class={INPUT} required>
						<option value="">Select event</option>
						{#each data.events as event}
							<option value={event.id}>{event.name} · {fmtDate(event.eventDate)}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="booking-talent" class={LABEL}>Talent / Act *</label>
					<select id="booking-talent" bind:value={bookingForm.talentId} class={INPUT} required>
						<option value="">Select talent</option>
						{#each data.talent as talent}
							<option value={talent.id}>{talent.name}</option>
						{/each}
					</select>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="booking-role" class={LABEL}>Booking Type</label>
						<select id="booking-role" bind:value={bookingForm.role} class={INPUT}>
							<option value="celebrity_appearance">Celebrity Appearance</option>
							<option value="music_act">Music Act</option>
						</select>
					</div>
					<div>
						<label for="booking-status" class={LABEL}>Pipeline Stage</label>
						<select id="booking-status" bind:value={bookingForm.status} class={INPUT}>
							<option value="invited">Outreach</option>
							<option value="confirmed">Booked</option>
						</select>
					</div>
				</div>

				<div>
					<label for="booking-fee" class={LABEL}>Fee ($)</label>
					<input id="booking-fee" bind:value={bookingForm.fee} type="number" min="0" step="0.01" class={INPUT} placeholder="e.g. 30000" />
					<p class="text-xs text-slate-500 mt-1">Leave blank to use the selected event default rate.</p>
				</div>

				<div class="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-400">
					<Calendar class="size-3.5 shrink-0" />
					Generate payments from the event detail page after the booking is confirmed.
				</div>

				<div class="flex justify-end gap-2 pt-2">
					<Button type="button" variant="outline" onclick={() => showNew = false}>Cancel</Button>
					<Button type="submit" disabled={bookingBusy}>{bookingBusy ? 'Saving...' : 'Create Booking'}</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
