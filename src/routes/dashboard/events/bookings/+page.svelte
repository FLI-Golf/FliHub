<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button';
	import { PipelineBoard } from '$lib/pipeline';
	import { pipelineMove } from '$lib/pipeline';
	import type { ActionData, PipelineBoardConfig, PipelineCardItem, PipelineMoveEvent } from './$types';
	import { AlertCircle, Calendar, DollarSign, Mic2, Music, Plus, Star, Trophy, Users, X } from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

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
		player: 'Celebrity',
		other: 'Music Act',
		celebrity_appearance: 'Celebrity',
		music_act: 'Music Act'
	};
	const ROLE_COLORS: Record<string, string> = {
		player: 'bg-amber-900/50 text-amber-300 border-amber-700',
		other: 'bg-violet-900/50 text-violet-300 border-violet-700',
		celebrity_appearance: 'bg-amber-900/50 text-amber-300 border-amber-700',
		music_act: 'bg-violet-900/50 text-violet-300 border-violet-700'
	};

	const fmt$ = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);
	const fmtDate = (d: string) =>
		d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date';
	const fmtRole = (role: string) => role.replaceAll('_', ' ');

	let moveError = $state('');
	let confirmFinanceModal = $state<{ id: string; name: string; eventName: string; rate: number; from: string; to: string } | null>(null);
	let financeBusy = $state(false);
	let financeForm = $state({
		downPaymentAmount: '',
		travelAmount: '',
		lodgingAmount: '',
		notes: ''
	});
	let showNew = $state(false);
	let bookingError = $state('');
	let bookingBusy = $state(false);
	let bookingForm = $state({
		eventId: '',
		entityType: 'individual',
		talentId: '',
		talentGroupId: '',
		groupMode: 'existing',
		groupName: '',
		groupType: 'music_group',
		primaryContactName: '',
		primaryContactEmail: '',
		memberCount: '',
		role: 'player',
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
			const talentGroup = booking.expand?.talentGroup;
			const isGroupBooking = booking.bookingEntityType === 'group' || !!booking.talentGroup;
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
			if (isGroupBooking) {
				tags.push({ label: 'Group', colorClass: 'bg-cyan-900/50 text-cyan-300 border-cyan-700' });
			}

			return {
				id: booking.id,
				status: booking.status,
				title: isGroupBooking ? talentGroup?.name ?? 'Unnamed group' : booking.expand?.talent?.name ?? 'Unassigned talent',
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

		if (e.to === 'confirmed' && booking.status !== 'confirmed') {
			const rate = Number(booking.confirmedRate ?? 0);
			financeForm = {
				downPaymentAmount: String(Math.round((rate * 0.3) * 100) / 100),
				travelAmount: '',
				lodgingAmount: '',
				notes: ''
			};
			confirmFinanceModal = {
				id: booking.id,
				name: booking.expand?.talentGroup?.name ?? booking.expand?.talent?.name ?? 'Talent Booking',
				eventName: booking.expand?.event?.name ?? 'Event',
				rate,
				from: booking.status,
				to: e.to as string
			};
			return;
		}

		const result = await pipelineMove(`/api/events/${booking.event}/talent/${booking.id}`, e.to);
		if (!result.ok) moveError = result.error?.message ?? 'Move failed';
		else await invalidateAll();
	}

	async function confirmBookedWithFinance() {
		if (!confirmFinanceModal || financeBusy) return;
		financeBusy = true;
		moveError = '';
		try {
			const booking = (data.eventTalent ?? []).find((b: any) => b.id === confirmFinanceModal!.id);
			if (!booking) throw new Error('Booking not found');

			const res = await fetch(`/api/events/${booking.event}/talent/${booking.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: 'confirmed',
					finance: {
						downPaymentAmount: financeForm.downPaymentAmount ? Number(financeForm.downPaymentAmount) : undefined,
						travelAmount: financeForm.travelAmount ? Number(financeForm.travelAmount) : 0,
						lodgingAmount: financeForm.lodgingAmount ? Number(financeForm.lodgingAmount) : 0,
						notes: financeForm.notes || undefined
					}
				})
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.message ?? 'Move failed');
			}
			confirmFinanceModal = null;
			await invalidateAll();
		} catch (err: any) {
			moveError = err?.message ?? 'Move failed';
		} finally {
			financeBusy = false;
		}
	}

	async function createBooking(e: SubmitEvent) {
		e.preventDefault();
		bookingError = '';
		if (!bookingForm.eventId) {
			bookingError = 'Event is required';
			return;
		}
		if (bookingForm.entityType === 'individual' && !bookingForm.talentId) {
			bookingError = 'Talent is required';
			return;
		}
		if (bookingForm.entityType === 'group' && bookingForm.groupMode === 'existing' && !bookingForm.talentGroupId) {
			bookingError = 'Talent group is required';
			return;
		}
		if (bookingForm.entityType === 'group' && bookingForm.groupMode === 'new' && !bookingForm.groupName.trim()) {
			bookingError = 'Group name is required';
			return;
		}
		bookingBusy = true;
		try {
			let talentGroupId = bookingForm.talentGroupId;
			if (bookingForm.entityType === 'group' && bookingForm.groupMode === 'new') {
				const groupRes = await fetch('/api/talent-groups', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: bookingForm.groupName,
						groupType: bookingForm.groupType,
						primaryContactName: bookingForm.primaryContactName,
						primaryContactEmail: bookingForm.primaryContactEmail,
						memberCount: bookingForm.memberCount ? Number(bookingForm.memberCount) : null,
						defaultFee: bookingForm.fee ? Number(bookingForm.fee) : null
					})
				});
				if (!groupRes.ok) {
					const body = await groupRes.json().catch(() => ({}));
					throw new Error(body.message ?? `Error ${groupRes.status}`);
				}
				const group = await groupRes.json();
				talentGroupId = group.id;
			}

			const res = await fetch(`/api/events/${bookingForm.eventId}/talent`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					entityType: bookingForm.entityType,
					talentId: bookingForm.entityType === 'individual' ? bookingForm.talentId : null,
					talentGroupId: bookingForm.entityType === 'group' ? talentGroupId : null,
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
			bookingForm = {
				eventId: '',
				entityType: 'individual',
				talentId: '',
				talentGroupId: '',
				groupMode: 'existing',
				groupName: '',
				groupType: 'music_group',
				primaryContactName: '',
				primaryContactEmail: '',
				memberCount: '',
				role: 'player',
				fee: '',
				status: 'invited'
			};
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
	const duplicateReport = $derived(data.duplicateReport);
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
		<div class="flex items-center gap-2 shrink-0">
			<Button href="/dashboard/events/bookings/export" variant="outline" class="gap-2">
				Export CSV
			</Button>
			<Button onclick={() => showNew = true} class="gap-2 bg-violet-600 hover:bg-violet-700 text-white shrink-0">
				<Plus class="size-4" /> New Booking
			</Button>
		</div>
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

	<Card class="p-4 bg-slate-800/40 border-slate-700">
		<div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
			<div>
				<p class="font-semibold text-slate-100">Interest Duplicate Cleanup</p>
				<p class="text-xs text-slate-400 mt-1">Detect and merge duplicate event or tournament interest rows that may have been created outside the normal toggle flow.</p>
			</div>
			<form method="POST" action="?/mergeDuplicateInterests" use:enhance class="flex items-center gap-2">
				<input type="hidden" name="scope" value="all" />
				<Button type="submit" variant="outline" class="gap-2">Merge Duplicates</Button>
			</form>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
			<div class="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Event Interests</p>
				<p class="mt-1 text-lg font-bold text-slate-100">{duplicateReport.event.groupCount} duplicate groups</p>
				<p class="text-sm text-slate-400">{duplicateReport.event.duplicateRowCount} extra rows can be removed.</p>
			</div>
			<div class="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
				<p class="text-xs uppercase tracking-wide text-slate-500">Tournament Interests</p>
				<p class="mt-1 text-lg font-bold text-slate-100">{duplicateReport.tournament.groupCount} duplicate groups</p>
				<p class="text-sm text-slate-400">{duplicateReport.tournament.duplicateRowCount} extra rows can be removed.</p>
			</div>
		</div>
		{#if form?.cleanupResult}
			<div class="mt-4 rounded-lg border border-emerald-700/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
				Merged {form.cleanupResult.totalGroupsMerged} duplicate group(s) and removed {form.cleanupResult.totalRowsDeleted} extra row(s).
			</div>
		{:else if form?.cleanupError}
			<div class="mt-4 rounded-lg border border-red-700/40 bg-red-950/20 px-3 py-2 text-sm text-red-300">
				{form.cleanupError}
			</div>
		{/if}
		{#if (data.cleanupHistory ?? []).length > 0}
			<div class="mt-4 border-t border-slate-700 pt-4">
				<p class="text-xs uppercase tracking-wide text-slate-500 mb-3">Recent Cleanup History</p>
				<div class="space-y-2">
					{#each data.cleanupHistory.slice(0, 5) as item}
						<div class="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-sm">
							<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
								<div class="text-slate-200">
									<span class="font-medium capitalize">{item.scope}</span> cleanup by {item.performedBy}
								</div>
								<div class="text-xs text-slate-500">{fmtDate(item.created)}</div>
							</div>
							<div class="mt-1 text-xs text-slate-400">
								Removed {item.totalRowsDeleted} rows across {item.totalGroupsMerged} duplicate group(s)
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</Card>

	<div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<div class="flex items-start justify-between gap-3 mb-4">
				<div>
					<div class="flex items-center gap-2 text-slate-100 font-semibold">
						<Calendar class="size-4 text-cyan-300" /> Event Interest Ranking
					</div>
					<p class="text-xs text-slate-400 mt-1">Pros and vendors signaling interest in event work opportunities.</p>
				</div>
				<div class="text-right text-xs text-slate-400">{data.eventInterestSummary?.length ?? 0} ranked</div>
			</div>
			{#if (data.eventInterestSummary ?? []).length === 0}
				<p class="text-sm text-slate-500">No event interest signals yet.</p>
			{:else}
				<div class="space-y-3">
					{#each data.eventInterestSummary as item}
						<div class="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="font-medium text-slate-100">{item.name}</p>
									<p class="text-xs text-slate-400 mt-1">{fmtDate(item.date)}{item.location ? ` · ${item.location}` : ''}</p>
								</div>
								<div class="text-right">
									<p class="text-lg font-bold text-slate-100">{item.totalInterest}</p>
									<p class="text-[11px] uppercase tracking-wide text-slate-500">Signals</p>
								</div>
							</div>
							<div class="flex flex-wrap gap-2 mt-3 text-[11px]">
								<span class="inline-flex items-center gap-1 rounded-full border border-cyan-700/50 bg-cyan-950/30 px-2 py-0.5 text-cyan-300"><Users class="size-3" /> Pros {item.proInterest}</span>
								<span class="inline-flex items-center gap-1 rounded-full border border-violet-700/50 bg-violet-950/30 px-2 py-0.5 text-violet-300"><Mic2 class="size-3" /> Broadcasters {item.broadcasterInterest}</span>
								<span class="inline-flex items-center gap-1 rounded-full border border-emerald-700/50 bg-emerald-950/30 px-2 py-0.5 text-emerald-300"><Star class="size-3" /> Vendors {item.vendorInterest}</span>
							</div>
							<div class="mt-3 flex flex-wrap gap-2">
								{#each item.interestedUsers as user}
									<span class="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
										{user.name} · {fmtRole(user.role)}
									</span>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>

		<Card class="p-4 bg-slate-800/40 border-slate-700">
			<div class="flex items-start justify-between gap-3 mb-4">
				<div>
					<div class="flex items-center gap-2 text-slate-100 font-semibold">
						<Trophy class="size-4 text-emerald-300" /> Tournament Interest Ranking
					</div>
					<p class="text-xs text-slate-400 mt-1">Vendor demand signals for tournament-related bookings and support work.</p>
				</div>
				<div class="text-right text-xs text-slate-400">{data.tournamentInterestSummary?.length ?? 0} ranked</div>
			</div>
			{#if (data.tournamentInterestSummary ?? []).length === 0}
				<p class="text-sm text-slate-500">No tournament interest signals yet.</p>
			{:else}
				<div class="space-y-3">
					{#each data.tournamentInterestSummary as item}
						<div class="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="font-medium text-slate-100">{item.name}</p>
									<p class="text-xs text-slate-400 mt-1">{fmtDate(item.date)}{item.location ? ` · ${item.location}` : ''}</p>
								</div>
								<div class="text-right">
									<p class="text-lg font-bold text-slate-100">{item.totalInterest}</p>
									<p class="text-[11px] uppercase tracking-wide text-slate-500">Signals</p>
								</div>
							</div>
							<div class="flex flex-wrap gap-2 mt-3 text-[11px]">
								<span class="inline-flex items-center gap-1 rounded-full border border-violet-700/50 bg-violet-950/30 px-2 py-0.5 text-violet-300"><Mic2 class="size-3" /> Broadcasters {item.broadcasterInterest}</span>
								<span class="inline-flex items-center gap-1 rounded-full border border-emerald-700/50 bg-emerald-950/30 px-2 py-0.5 text-emerald-300"><Star class="size-3" /> Vendors {item.vendorInterest}</span>
							</div>
							<div class="mt-3 flex flex-wrap gap-2">
								{#each item.interestedUsers as user}
									<span class="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
										{user.name} · {fmtRole(user.role)}
									</span>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	</div>

	{#if moveError}
		<div class="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
			<AlertCircle class="size-4 shrink-0" />{moveError}
		</div>
	{/if}

	<div class="rounded-xl border border-slate-700 bg-slate-900/30 px-4 py-3 space-y-3">
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Pipeline Stage</span>
			<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-300 bg-slate-800/70"><span class="size-2 rounded-full bg-slate-400"></span>Outreach</span>
			<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-emerald-700/50 text-emerald-300 bg-emerald-900/30"><span class="size-2 rounded-full bg-emerald-400"></span>Booked</span>
			<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-blue-700/50 text-blue-300 bg-blue-900/30"><span class="size-2 rounded-full bg-blue-400"></span>Completed</span>
			<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-red-700/50 text-red-300 bg-red-900/30"><span class="size-2 rounded-full bg-red-400"></span>Declined</span>
			<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-orange-700/50 text-orange-300 bg-orange-900/30"><span class="size-2 rounded-full bg-orange-400"></span>No Show</span>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Card Tags</span>
			<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-amber-700/50 text-amber-300 bg-amber-900/30"><span class="size-2 rounded-full bg-amber-400"></span>Celebrity</span>
			<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-violet-700/50 text-violet-300 bg-violet-900/30"><span class="size-2 rounded-full bg-violet-400"></span>Music Act</span>
			<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-yellow-700/50 text-yellow-300 bg-yellow-900/30"><span class="size-2 rounded-full bg-yellow-400"></span>Payment Pending</span>
			<span class="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border border-emerald-700/50 text-emerald-300 bg-emerald-900/30"><span class="size-2 rounded-full bg-emerald-400"></span>Payment Paid</span>
		</div>
	</div>

	<PipelineBoard config={BOARD_CONFIG} {items} onmove={handleMove} />
</div>

{#if confirmFinanceModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
		<div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">
			<div class="flex items-center justify-between p-5 border-b border-slate-700">
				<div>
					<h2 class="text-base font-semibold text-slate-100">Move to Booked: Finance Setup</h2>
					<p class="text-xs text-slate-400 mt-1">{confirmFinanceModal.name} · {confirmFinanceModal.eventName}</p>
				</div>
				<button onclick={() => confirmFinanceModal = null} class="text-slate-400 hover:text-slate-100">
					<X class="size-5" />
				</button>
			</div>
			<div class="p-5 space-y-4">
				<div class="rounded-lg border border-emerald-700/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-300">
					This creates submitted expenses that enter Approvals automatically and then flow into Work Orders after approval.
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div>
						<label class={LABEL}>Down Payment ($)</label>
						<input bind:value={financeForm.downPaymentAmount} type="number" min="0" step="0.01" class={INPUT} placeholder="Required for booking" />
					</div>
					<div>
						<label class={LABEL}>Travel Reimb. ($)</label>
						<input bind:value={financeForm.travelAmount} type="number" min="0" step="0.01" class={INPUT} placeholder="Optional" />
					</div>
					<div>
						<label class={LABEL}>Lodging Reimb. ($)</label>
						<input bind:value={financeForm.lodgingAmount} type="number" min="0" step="0.01" class={INPUT} placeholder="Optional" />
					</div>
				</div>
				<div>
					<label class={LABEL}>Finance Notes (optional)</label>
					<input bind:value={financeForm.notes} class={INPUT} placeholder="Booking terms, reimbursement constraints, or approvals context" />
				</div>
			</div>
			<div class="flex justify-end gap-2 px-5 pb-5">
				<Button type="button" variant="outline" onclick={() => confirmFinanceModal = null}>Cancel</Button>
				<Button
					type="button"
					onclick={confirmBookedWithFinance}
					disabled={financeBusy || !financeForm.downPaymentAmount || Number(financeForm.downPaymentAmount) <= 0}
					class="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
				>
					{financeBusy ? 'Saving...' : 'Confirm Booked + Create Expenses'}
				</Button>
			</div>
		</div>
	</div>
{/if}

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
					<label for="booking-entity-type" class={LABEL}>Booking Entity *</label>
					<select id="booking-entity-type" bind:value={bookingForm.entityType} class={INPUT}>
						<option value="individual">Individual Talent</option>
						<option value="group">Talent Group / Band / Act</option>
					</select>
				</div>

				{#if bookingForm.entityType === 'individual'}
					<div>
						<label for="booking-talent" class={LABEL}>Talent / Act *</label>
						<select id="booking-talent" bind:value={bookingForm.talentId} class={INPUT} required>
							<option value="">Select talent</option>
							{#each data.talent as talent}
								<option value={talent.id}>{talent.name}</option>
							{/each}
						</select>
					</div>
				{:else}
					<div class="rounded-lg border border-slate-700 bg-slate-950/40 p-3 space-y-3">
						<div class="grid grid-cols-2 gap-3">
							<label class="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 cursor-pointer">
								<input type="radio" bind:group={bookingForm.groupMode} value="existing" class="accent-violet-500" />
								Existing Group
							</label>
							<label class="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 cursor-pointer">
								<input type="radio" bind:group={bookingForm.groupMode} value="new" class="accent-violet-500" />
								New Group
							</label>
						</div>

						{#if bookingForm.groupMode === 'existing'}
							<div>
								<label for="booking-group" class={LABEL}>Talent Group *</label>
								<select id="booking-group" bind:value={bookingForm.talentGroupId} class={INPUT} required>
									<option value="">Select group</option>
									{#each data.talentGroups as group}
										<option value={group.id}>{group.name}</option>
									{/each}
								</select>
								{#if (data.talentGroups ?? []).length === 0}
									<p class="text-xs text-amber-400 mt-1">No groups found. Use New Group, then run the talent group schema script if this collection is not available yet.</p>
								{/if}
							</div>
						{:else}
							<div class="grid grid-cols-2 gap-3">
								<div class="col-span-2">
									<label for="booking-group-name" class={LABEL}>Group / Act Name *</label>
									<input id="booking-group-name" bind:value={bookingForm.groupName} class={INPUT} placeholder="e.g. The Neon Drivers" />
								</div>
								<div>
									<label for="booking-group-type" class={LABEL}>Group Type</label>
									<select id="booking-group-type" bind:value={bookingForm.groupType} class={INPUT}>
										<option value="music_group">Music Group</option>
										<option value="band">Band</option>
										<option value="celebrity_group">Celebrity Group</option>
										<option value="performance_act">Performance Act</option>
										<option value="agency_roster">Agency Roster</option>
										<option value="other">Other</option>
									</select>
								</div>
								<div>
									<label for="booking-member-count" class={LABEL}>Member Count</label>
									<input id="booking-member-count" bind:value={bookingForm.memberCount} type="number" min="0" step="1" class={INPUT} placeholder="Optional" />
								</div>
								<div>
									<label for="booking-contact-name" class={LABEL}>Primary Contact</label>
									<input id="booking-contact-name" bind:value={bookingForm.primaryContactName} class={INPUT} placeholder="Name" />
								</div>
								<div>
									<label for="booking-contact-email" class={LABEL}>Contact Email</label>
									<input id="booking-contact-email" bind:value={bookingForm.primaryContactEmail} type="email" class={INPUT} placeholder="email@example.com" />
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="booking-role" class={LABEL}>Booking Type</label>
						<select id="booking-role" bind:value={bookingForm.role} class={INPUT}>
							<option value="player">Celebrity Appearance</option>
							<option value="other">Music Act</option>
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
