<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	const e = data.event;

	const INPUT = 'w-full rounded-lg border border-gray-600 bg-gray-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500';
	const LABEL = 'block text-xs font-medium text-gray-400 mb-1';

	let saving = $state(false);
	let error = $state('');
	let deleting = $state(false);

	let form = $state({
		name: e?.name ?? '',
		eventType: e?.eventType ?? 'appearance',
		eventDate: e?.eventDate ? e.eventDate.split(' ')[0] : '',
		location: e?.location ?? '',
		description: e?.description ?? '',
		status: e?.status ?? 'draft',
		notes: e?.notes ?? '',
		tournament: e?.tournament ?? '',
		season: e?.season ?? '',
		defaultRate: e?.defaultRate?.toString() ?? '',
		budget: e?.budget?.toString() ?? '',
		approvalThreshold: e?.approvalThreshold?.toString() ?? '500',
		requiresApproval: e?.requiresApproval ?? true,
		bonusAmount: e?.bonusAmount?.toString() ?? '',
		bonusThreshold: e?.bonusThreshold?.toString() ?? ''
	});

	const isBroadcast = $derived(form.eventType === 'tournament_broadcast');

	$effect(() => {
		console.log('[events/edit] reference options', {
			eventId: e?.id,
			tournaments: data.tournaments?.length ?? 0,
			seasons: data.seasons?.length ?? 0,
			tournamentIds: (data.tournaments ?? []).map((t: any) => t.id)
		});
	});

	async function submit(ev: SubmitEvent) {
		ev.preventDefault();
		saving = true; error = '';
		try {
			const res = await fetch(`/api/events/${e.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					defaultRate: form.defaultRate ? Number(form.defaultRate) : null,
					budget: form.budget ? Number(form.budget) : null,
					approvalThreshold: form.approvalThreshold ? Number(form.approvalThreshold) : 500,
					bonusAmount: form.bonusAmount ? Number(form.bonusAmount) : null,
					bonusThreshold: form.bonusThreshold ? Number(form.bonusThreshold) : null,
					tournament: form.tournament || null,
					season: form.season || null
				})
			});
			if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? `Error ${res.status}`); }
			goto(`/dashboard/events/${e.id}`);
		} catch (err: any) { error = err.message ?? 'Failed to save'; }
		finally { saving = false; }
	}

	async function deleteEvent() {
		if (!confirm('Delete this event? This cannot be undone.')) return;
		deleting = true;
		try {
			const res = await fetch(`/api/events/${e.id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Delete failed');
			goto('/dashboard/events');
		} catch (err: any) { error = err.message; deleting = false; }
	}
</script>

<svelte:head><title>Edit {e?.name ?? 'Event'} — FliHub</title></svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<div class="flex items-center gap-4">
		<Button href="/dashboard/events/{e?.id}" variant="outline">← Back</Button>
		<h1 class="text-2xl font-bold text-white">Edit Event</h1>
	</div>

	{#if error}
	<div class="p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">{error}</div>
	{/if}

	<form onsubmit={submit} class="space-y-5 bg-gray-800 rounded-xl border border-gray-700 p-6">
		<h2 class="text-base font-semibold text-white border-b border-gray-700 pb-3">Event Details</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div class="sm:col-span-2">
				<label class={LABEL}>Event Name *</label>
				<input type="text" bind:value={form.name} required class={INPUT} />
			</div>
			<div>
				<label class={LABEL}>Event Type *</label>
				<select bind:value={form.eventType} required class={INPUT}>
					<option value="appearance">Appearance</option>
					<option value="clinic">Clinic</option>
					<option value="media">Media</option>
					<option value="promotional">Promotional</option>
					<option value="content_creation">Content Creation</option>
					<option value="tournament_broadcast">Tournament Broadcast</option>
					<option value="other">Other</option>
				</select>
			</div>
			<div>
				<label class={LABEL}>Status</label>
				<select bind:value={form.status} class={INPUT}>
					<option value="draft">Draft</option>
					<option value="scheduled">Scheduled</option>
					<option value="in_progress">In Progress</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>
			<div>
				<label class={LABEL}>Event Date *</label>
				<input type="date" bind:value={form.eventDate} required class={INPUT} />
			</div>
			<div>
				<label class={LABEL}>Location</label>
				<input type="text" bind:value={form.location} class={INPUT} />
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-700">
			<h3 class="sm:col-span-2 text-sm font-semibold text-blue-300">Tournament Reference</h3>
			<p class="sm:col-span-2 text-xs text-gray-400">Use these links to reference and target tournaments/seasons in queries and reporting; event budget remains independent.</p>
			<div>
				<label class={LABEL}>Reference Tournament</label>
				<select bind:value={form.tournament} class={INPUT}>
					<option value="">— None —</option>
					{#each data.tournaments as t}
						<option value={t.id}>{t.name}</option>
					{/each}
				</select>
			</div>
			<div>
				<label class={LABEL}>Reference Season</label>
				<select bind:value={form.season} class={INPUT}>
					<option value="">— None —</option>
					{#each data.seasons as s}
						<option value={s.id}>{s.name} ({s.year})</option>
					{/each}
				</select>
			</div>
			{#if isBroadcast}
				<h3 class="sm:col-span-2 text-sm font-semibold text-yellow-400">Broadcast Details</h3>
				<div>
					<label class={LABEL}>Bonus Amount ($)</label>
					<input type="number" bind:value={form.bonusAmount} min="0" step="0.01" class={INPUT} />
				</div>
				<div>
					<label class={LABEL}>Bonus Threshold (# events)</label>
					<input type="number" bind:value={form.bonusThreshold} min="1" step="1" class={INPUT} />
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-700">
			<h3 class="sm:col-span-3 text-sm font-semibold text-white">Payment Settings</h3>
			<div>
				<label class={LABEL}>Default Rate ($ per talent)</label>
				<input type="number" bind:value={form.defaultRate} min="0" step="0.01" class={INPUT} />
			</div>
			<div>
				<label class={LABEL}>Total Budget ($)</label>
				<input type="number" bind:value={form.budget} min="0" step="0.01" class={INPUT} />
			</div>
			<div>
				<label class={LABEL}>Approval Threshold ($)</label>
				<input type="number" bind:value={form.approvalThreshold} min="0" step="1" class={INPUT} />
				<p class="text-xs text-gray-500 mt-1">Payments above this go through approval pipeline</p>
			</div>
			<div class="sm:col-span-3 flex items-center gap-3">
				<input type="checkbox" id="requiresApproval" bind:checked={form.requiresApproval} class="rounded border-gray-600 bg-gray-700 text-blue-500" />
				<label for="requiresApproval" class="text-sm text-gray-300">All payments require approval (overrides threshold)</label>
			</div>
		</div>

		<div class="pt-2 border-t border-gray-700">
			<label class={LABEL}>Description</label>
			<textarea bind:value={form.description} rows="3" class={INPUT}></textarea>
		</div>

		<div class="flex justify-between pt-2">
			<Button type="button" onclick={deleteEvent} disabled={deleting} class="bg-red-900 hover:bg-red-800 text-red-200 border-red-700">
				{deleting ? 'Deleting...' : 'Delete Event'}
			</Button>
			<div class="flex gap-3">
				<Button href="/dashboard/events/{e?.id}" variant="outline">Cancel</Button>
				<Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
			</div>
		</div>
	</form>
</div>
