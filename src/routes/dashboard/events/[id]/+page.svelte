<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ChevronDown, ChevronUp, Plus, Check, X, Star, AlertCircle } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	const event = $derived(data.event);
	const s = $derived(data.summary);

	let open = $state<Record<string, boolean>>({ talent: true, payments: true, tasks: true });
	const toggle = (k: string) => { open[k] = !open[k]; };

	const fmt$ = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n ?? 0);
	const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

	const STATUS_COLORS: Record<string, string> = {
		draft: 'bg-gray-700 text-gray-300', scheduled: 'bg-blue-900 text-blue-300',
		in_progress: 'bg-yellow-900 text-yellow-300', completed: 'bg-green-900 text-green-300',
		cancelled: 'bg-red-900 text-red-300'
	};
	const PAY_STATUS_COLORS: Record<string, string> = {
		pending: 'bg-gray-700 text-gray-300', approval_required: 'bg-orange-900 text-orange-300',
		approved: 'bg-blue-900 text-blue-300', paid: 'bg-green-900 text-green-300',
		rejected: 'bg-red-900 text-red-300', cancelled: 'bg-gray-700 text-gray-400'
	};
	const TASK_STATUS_COLORS: Record<string, string> = {
		todo: 'bg-gray-700 text-gray-300', in_progress: 'bg-blue-900 text-blue-300',
		blocked: 'bg-red-900 text-red-300', completed: 'bg-green-900 text-green-300',
		cancelled: 'bg-gray-700 text-gray-400'
	};
	const TALENT_STATUS_COLORS: Record<string, string> = {
		invited: 'bg-gray-700 text-gray-300',
		confirmed: 'bg-green-900 text-green-300',
		declined: 'bg-red-900 text-red-300',
		completed: 'bg-blue-900 text-blue-300',
		no_show: 'bg-orange-900 text-orange-300'
	};

	// Assign talent panel
	let showAssign = $state(false);
	let assignTalentId = $state('');
	let assignRole = $state('player');
	let assignRateOverride = $state('');
	let assignStatus = $state('confirmed');
	let assignSaving = $state(false);
	let assignError = $state('');

	async function assignTalent() {
		if (!assignTalentId) return;
		assignSaving = true; assignError = '';
		try {
			const res = await fetch(`/api/events/${event.id}/talent`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					entityType: 'individual',
					talentId: assignTalentId,
					role: assignRole,
					rateOverride: assignRateOverride ? Number(assignRateOverride) : null,
					status: assignStatus
				})
			});
			if (!res.ok) {
				const d = await res.json().catch(() => ({}));
				if (res.status === 409 && d?.existing) {
					await invalidateAll();
				}
				const detail = d?.existing
					? ` Existing booking status: ${d.existing.status ?? 'unknown'}${d.existing.role ? `, role: ${d.existing.role}` : ''}.`
					: '';
				throw new Error((d.message ?? `Error ${res.status}`) + detail);
			}
			showAssign = false; assignTalentId = ''; assignRateOverride = '';
			await invalidateAll();
		} catch (err: any) { assignError = err.message; }
		finally { assignSaving = false; }
	}

	// Add task panel
	let showAddTask = $state(false);
	let taskForm = $state({ title: '', description: '', priority: 'medium', dueDate: '', hasCost: false, estimatedCost: '', requiresApproval: false });
	let taskSaving = $state(false);
	let taskError = $state('');

	async function addTask() {
		taskSaving = true; taskError = '';
		try {
			const res = await fetch(`/api/events/${event.id}/tasks`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...taskForm, estimatedCost: taskForm.estimatedCost ? Number(taskForm.estimatedCost) : null })
			});
			if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message ?? `Error ${res.status}`); }
			showAddTask = false; taskForm = { title: '', description: '', priority: 'medium', dueDate: '', hasCost: false, estimatedCost: '', requiresApproval: false };
			await invalidateAll();
		} catch (err: any) { taskError = err.message; }
		finally { taskSaving = false; }
	}

	// Generate payments for all confirmed talent
	let genSaving = $state(false);
	let genMsg = $state('');
	async function generatePayments(mode: 'with_quorum' | 'without_quorum') {
		if (mode === 'without_quorum' && event?.requiresApproval) {
			genMsg = 'This event is set to require approval for all payments. Disable that setting in Event Edit to generate without quorum.';
			return;
		}
		genSaving = true; genMsg = '';
		try {
			const res = await fetch(`/api/events/${event.id}/payments/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ mode })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(d.message ?? `Error ${res.status}`);
			const modeLabel = mode === 'with_quorum' ? 'with quorum' : 'without quorum';
			const backfilled = Number(d?.backfilledWorkOrders ?? 0);
			const backfillMsg = backfilled > 0
				? ` · Backfilled ${backfilled} work order${backfilled === 1 ? '' : 's'}`
				: '';
			genMsg = `${d.message ?? 'Payments generated'} (${modeLabel})${backfillMsg}`;
			await invalidateAll();
		} catch (err: any) { genMsg = `Error: ${err.message}`; }
		finally { genSaving = false; }
	}

	// Mark payment paid
	async function markPaid(paymentId: string) {
		const res = await fetch(`/api/events/${event.id}/payments/${paymentId}/mark-paid`, { method: 'POST' });
		if (res.ok) await invalidateAll();
	}

	// Approve payment (approval_required → approved)
	async function approvPayment(paymentId: string) {
		const res = await fetch(`/api/events/${event.id}/payments/${paymentId}/approve`, { method: 'POST' });
		if (res.ok) await invalidateAll();
	}

	function openApprovalsDashboard() {
		window.location.href = '/dashboard/approvals';
	}

	async function removeBooking(eventTalentId: string, name: string) {
		assignError = '';
		if (!confirm(`Remove booking for ${name}?`)) return;
		const res = await fetch(`/api/events/${event.id}/talent/${eventTalentId}`, { method: 'DELETE' });
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			assignError = body?.message ?? `Failed to remove booking (${res.status})`;
			return;
		}
		await invalidateAll();
	}

	async function confirmBooking(eventTalentId: string, name: string) {
		assignError = '';
		const res = await fetch(`/api/events/${event.id}/talent/${eventTalentId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'confirmed' })
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			assignError = body?.message ?? `Failed to confirm ${name} (${res.status})`;
			return;
		}
		await invalidateAll();
	}

	// Update task status
	async function updateTaskStatus(taskId: string, status: string) {
		await fetch(`/api/events/${event.id}/tasks/${taskId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status })
		});
		await invalidateAll();
	}

	const INPUT = 'w-full rounded-lg border border-gray-600 bg-gray-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
	const LABEL = 'block text-xs font-medium text-gray-400 mb-1';

	// Unassigned talent (not already on this event)
	const assignedIds = $derived(new Set((data.eventTalent ?? []).map((et: any) => et.talent)));
	const availableTalent = $derived((data.allTalent ?? []).filter((t: any) => !assignedIds.has(t.id)));

	function bookingName(record: any) {
		return record?.expand?.talentGroup?.name ?? record?.expand?.talent?.name ?? record?.talentGroup ?? record?.talent ?? '—';
	}

	function bookingInitial(record: any) {
		return bookingName(record).charAt(0) || '?';
	}

	function canRemoveBooking(record: any) {
		const pay = (data.eventPayments ?? []).find((p: any) => p.eventTalent === record.id && p.status !== 'cancelled');
		return !pay;
	}

	function paymentApprovalPathLabel(payment: any) {
		if (payment?.approvalRoute === 'direct') return 'Direct Override Eligible';
		if (payment?.approvalRoute === 'approval_pipeline') return 'Quorum Required';
		if (payment?.status === 'pending') return 'Direct Override Eligible';
		return 'Quorum Required';
	}

	function paymentApprovalPathClass(payment: any) {
		return paymentApprovalPathLabel(payment) === 'Direct Override Eligible'
			? 'text-emerald-300 border-emerald-800 bg-emerald-900/30'
			: 'text-orange-300 border-orange-800 bg-orange-900/30';
	}
</script>

<svelte:head><title>{event?.name ?? 'Event'} — FliHub</title></svelte:head>

<div class="max-w-4xl mx-auto space-y-4">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<div class="flex items-center gap-3 mb-1">
				<Button href="/dashboard/events" variant="outline" class="text-xs py-1 px-3">← Events</Button>
				<Badge class={STATUS_COLORS[event?.status] ?? 'bg-gray-700 text-gray-300'}>{event?.status}</Badge>
				{#if event?.eventType === 'tournament_broadcast'}<Badge class="bg-yellow-900 text-yellow-300">Tournament Broadcast</Badge>{/if}
			</div>
			<h1 class="text-2xl font-bold text-white">{event?.name}</h1>
			<div class="flex flex-wrap gap-4 text-sm text-gray-400 mt-1">
				{#if event?.eventDate}<span>📅 {fmtDate(event.eventDate)}</span>{/if}
				{#if event?.location}<span>📍 {event.location}</span>{/if}
				{#if event?.expand?.tournament}<span>🏆 {event.expand.tournament.name}</span>{/if}
				{#if event?.expand?.season}<span>📆 {event.expand.season.name}</span>{/if}
			</div>
		</div>
		<Button href="/dashboard/events/{event?.id}/edit" variant="outline">Edit</Button>
	</div>

	<!-- Summary cards -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
		<div class="p-4 bg-gray-800 rounded-lg border border-gray-700 text-center">
			<div class="text-xl font-bold text-white">{data.eventTalent?.length ?? 0}</div>
			<div class="text-xs text-gray-400 mt-1">Talent Assigned</div>
		</div>
		<div class="p-4 bg-green-900/40 rounded-lg border border-green-800 text-center">
			<div class="text-xl font-bold text-green-400">{fmt$(s?.totalPaid ?? 0)}</div>
			<div class="text-xs text-gray-400 mt-1">Paid</div>
		</div>
		<div class="p-4 bg-yellow-900/40 rounded-lg border border-yellow-800 text-center">
			<div class="text-xl font-bold text-yellow-400">{fmt$(s?.totalPending ?? 0)}</div>
			<div class="text-xs text-gray-400 mt-1">Pending</div>
		</div>
		<div class="p-4 bg-blue-900/40 rounded-lg border border-blue-800 text-center">
			<div class="text-xl font-bold text-blue-400">{s?.tasksDone ?? 0}/{s?.tasksTotal ?? 0}</div>
			<div class="text-xs text-gray-400 mt-1">Tasks Done</div>
		</div>
	</div>

	{#if event?.description}
	<div class="p-4 bg-gray-800 rounded-lg border border-gray-700 text-sm text-gray-300 prose prose-invert max-w-none">{@html event.description}</div>
	{/if}

	<!-- TALENT ACCORDION -->
	<div class="rounded-lg border border-gray-700 overflow-hidden">
		<button type="button" onclick={() => toggle('talent')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
			<span class="font-semibold text-white">Talent ({data.eventTalent?.length ?? 0})</span>
			{#if open.talent}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
		</button>
		{#if open.talent}
		<div class="border-t border-gray-700 bg-gray-800/50">
			{#if (data.eventTalent ?? []).length === 0}
			<div class="p-6 text-center text-gray-500">No talent assigned yet</div>
			{:else}
			<div class="divide-y divide-gray-700">
				{#each data.eventTalent as et (et.id)}
				<div class="flex items-center justify-between px-5 py-3">
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
							{bookingInitial(et)}
						</div>
						<div>
							<div class="font-medium text-white text-sm">{bookingName(et)}</div>
							<div class="text-xs text-gray-400">{et.role} · {fmt$(et.confirmedRate ?? event?.defaultRate ?? 0)}</div>
						</div>
					</div>
					<div class="flex items-center gap-2">
						{#if et.bonusEligible}<Star class="w-4 h-4 text-yellow-400" aria-label="Bonus eligible" />{/if}
						<Badge class={TALENT_STATUS_COLORS[et.status] ?? 'bg-gray-700 text-gray-300'}>{et.status}</Badge>
						{#if et.status === 'invited'}
							<button
								type="button"
								onclick={() => confirmBooking(et.id, bookingName(et))}
								class="text-xs bg-green-900/60 hover:bg-green-800 text-green-200 px-2 py-1 rounded border border-green-800"
							>
								Confirm
							</button>
						{/if}
						{#if canRemoveBooking(et)}
							<button
								type="button"
								onclick={() => removeBooking(et.id, bookingName(et))}
								class="text-xs bg-red-900/60 hover:bg-red-800 text-red-200 px-2 py-1 rounded border border-red-800"
							>
								<X class="w-3 h-3 inline mr-1" />Remove
							</button>
						{/if}
					</div>
				</div>
				{/each}
			</div>
			{/if}
			<div class="p-4 border-t border-gray-700">
				{#if showAssign}
				<div class="space-y-3 p-4 bg-gray-900 rounded-lg border border-gray-600">
					{#if assignError}<div class="text-red-400 text-xs">{assignError}</div>{/if}
					<div class="grid grid-cols-2 gap-3">
						<div class="col-span-2">
							<label class={LABEL}>Talent *</label>
							<select bind:value={assignTalentId} class={INPUT}>
								<option value="">— Select talent —</option>
								{#each availableTalent as t}
									<option value={t.id}>{t.name}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class={LABEL}>Role</label>
							<select bind:value={assignRole} class={INPUT}>
								<option value="player">Celebrity Appearance</option>
								<option value="other">Music Act</option>
								<option value="broadcaster">Broadcaster</option>
								<option value="commentator">Commentator</option>
								<option value="analyst">Analyst</option>
								<option value="manager">Manager</option>
								<option value="other">Other</option>
							</select>
						</div>
						<div>
							<label class={LABEL}>Rate Override ($) <span class="text-gray-500">default: {fmt$(event?.defaultRate ?? 0)}</span></label>
							<input type="number" bind:value={assignRateOverride} min="0" step="0.01" class={INPUT} placeholder="Leave blank to use default" />
						</div>
						<div>
							<label class={LABEL}>Status</label>
							<select bind:value={assignStatus} class={INPUT}>
								<option value="invited">Invited</option>
								<option value="confirmed">Confirmed</option>
							</select>
						</div>
					</div>
					<div class="flex gap-2">
						<Button onclick={assignTalent} disabled={assignSaving || !assignTalentId}>{assignSaving ? 'Saving...' : 'Assign'}</Button>
						<Button variant="outline" onclick={() => { showAssign = false; assignError = ''; }}>Cancel</Button>
					</div>
				</div>
				{:else}
				<Button variant="outline" onclick={() => showAssign = true} class="text-sm">
					<Plus class="w-4 h-4 mr-1" />Assign Talent
				</Button>
				{/if}
			</div>
		</div>
		{/if}
	</div>

	<!-- PAYMENTS ACCORDION -->
	<div class="rounded-lg border border-gray-700 overflow-hidden">
		<button type="button" onclick={() => toggle('payments')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
			<span class="font-semibold text-white">Payments ({data.eventPayments?.length ?? 0})</span>
			{#if open.payments}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
		</button>
		{#if open.payments}
		<div class="border-t border-gray-700 bg-gray-800/50">
			{#if (data.eventPayments ?? []).length === 0}
			<div class="p-6 text-center text-gray-500">No payments yet</div>
			{:else}
			<div class="divide-y divide-gray-700">
				{#each data.eventPayments as p (p.id)}
				<div class="flex items-center justify-between px-5 py-3">
					<div>
						<div class="font-medium text-white text-sm">{bookingName(p)}</div>
						<div class="text-xs text-gray-400">{p.paymentType}{#if p.isBonus} · ⭐ Bonus{/if}{#if p.description} · {p.description}{/if}</div>
						<div class={`inline-flex items-center text-[10px] mt-1 px-2 py-0.5 rounded border ${paymentApprovalPathClass(p)}`}>
							{paymentApprovalPathLabel(p)}
						</div>
						{#if p.status === 'approval_required'}
						<div class="flex items-center gap-1 text-xs text-orange-400 mt-0.5"><AlertCircle class="w-3 h-3" />Awaiting approval</div>
						{/if}
					</div>
					<div class="flex items-center gap-3">
						<div class="text-right">
							<div class="font-bold text-white">{fmt$(p.amount)}</div>
							{#if p.managerAmount}<div class="text-xs text-gray-400">+{fmt$(p.managerAmount)} mgr</div>{/if}
						</div>
						<Badge class={PAY_STATUS_COLORS[p.status] ?? 'bg-gray-700 text-gray-300'}>{p.status}</Badge>
						{#if p.status === 'approval_required'}
						<button onclick={openApprovalsDashboard} class="text-xs bg-orange-700 hover:bg-orange-600 text-white px-2 py-1 rounded">Approval Quorum</button>
						{:else if p.status === 'pending'}
						<button onclick={() => approvPayment(p.id)} class="text-xs bg-orange-700 hover:bg-orange-600 text-white px-2 py-1 rounded">Approve</button>
						{:else if p.status === 'approved'}
						<button onclick={() => markPaid(p.id)} class="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded">Mark Paid</button>
						{/if}
					</div>
				</div>
				{/each}
			</div>
			{/if}
			<div class="p-4 border-t border-gray-700 space-y-2">
				<div class="flex flex-wrap items-center gap-3">
					<Button onclick={() => generatePayments('without_quorum')} disabled={genSaving || Boolean(event?.requiresApproval)} variant="outline" class="text-sm disabled:opacity-50">
						{genSaving ? 'Generating...' : 'Generate Payments Without Quorum'}
					</Button>
					{#if event?.requiresApproval}
						<span
							class="inline-flex items-center justify-center w-5 h-5 rounded-full border border-orange-700/70 bg-orange-950/40 text-orange-300 cursor-help"
							title="Disabled because this event has 'All payments require approval' enabled. Uncheck that setting in Event Edit to allow direct generation."
							aria-label="Why direct generation is disabled"
						>
							<AlertCircle class="w-3.5 h-3.5" />
						</span>
					{/if}
					<Button onclick={() => generatePayments('with_quorum')} disabled={genSaving} variant="outline" class="text-sm">
						{genSaving ? 'Generating...' : 'Generate Payments With Quorum'}
					</Button>
				</div>
				<div class="text-xs text-gray-400">
					Without quorum creates direct-approval payments. With quorum creates approval-pipeline payments.
					{#if event?.requiresApproval}
						<span class="text-orange-400"> Direct mode is disabled because this event has "All payments require approval" enabled. To allow direct mode, uncheck it in Event Edit.</span>
					{/if}
				</div>
				{#if genMsg}<span class="text-sm text-gray-400">{genMsg}</span>{/if}
			</div>
		</div>
		{/if}
	</div>

	<!-- TASKS ACCORDION -->
	<div class="rounded-lg border border-gray-700 overflow-hidden">
		<button type="button" onclick={() => toggle('tasks')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
			<span class="font-semibold text-white">Tasks ({s?.tasksDone ?? 0}/{s?.tasksTotal ?? 0} done{s?.taskBudget ? ' · ' + fmt$(s.taskBudget) + ' budget' : ''})</span>
			{#if open.tasks}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
		</button>
		{#if open.tasks}
		<div class="border-t border-gray-700 bg-gray-800/50">
			{#if (data.eventTasks ?? []).length === 0}
			<div class="p-6 text-center text-gray-500">No tasks yet</div>
			{:else}
			<div class="divide-y divide-gray-700">
				{#each data.eventTasks as task (task.id)}
				<div class="flex items-center justify-between px-5 py-3">
					<div class="flex items-center gap-3">
						<button onclick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'todo' : 'completed')}
							class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 {task.status === 'completed' ? 'bg-green-600 border-green-600' : 'border-gray-500 hover:border-gray-300'}">
							{#if task.status === 'completed'}<Check class="w-3 h-3 text-white" />{/if}
						</button>
						<div>
							<div class="text-sm font-medium text-white {task.status === 'completed' ? 'line-through text-gray-500' : ''}">{task.title}</div>
							<div class="text-xs text-gray-400">
								{#if task.dueDate}Due {fmtDate(task.dueDate)} · {/if}
								{#if task.hasCost}{fmt$(task.estimatedCost ?? 0)} est{#if task.actualCost} / {fmt$(task.actualCost)} actual{/if} · {/if}
								{#if task.requiresApproval}<span class="text-orange-400">Needs approval</span>{/if}
							</div>
						</div>
					</div>
					<Badge class={TASK_STATUS_COLORS[task.status] ?? 'bg-gray-700 text-gray-300'}>{task.status}</Badge>
				</div>
				{/each}
			</div>
			{/if}
			<div class="p-4 border-t border-gray-700">
				{#if showAddTask}
				<div class="space-y-3 p-4 bg-gray-900 rounded-lg border border-gray-600">
					{#if taskError}<div class="text-red-400 text-xs">{taskError}</div>{/if}
					<div class="grid grid-cols-2 gap-3">
						<div class="col-span-2">
							<label class={LABEL}>Task Title *</label>
							<input type="text" bind:value={taskForm.title} class={INPUT} placeholder="e.g. Send travel itinerary" />
						</div>
						<div>
							<label class={LABEL}>Priority</label>
							<select bind:value={taskForm.priority} class={INPUT}>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
								<option value="urgent">Urgent</option>
							</select>
						</div>
						<div>
							<label class={LABEL}>Due Date</label>
							<input type="date" bind:value={taskForm.dueDate} class={INPUT} />
						</div>
						<div class="col-span-2 flex items-center gap-4">
							<label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
								<input type="checkbox" bind:checked={taskForm.hasCost} class="rounded border-gray-600 bg-gray-700" />
								Has a cost
							</label>
							{#if taskForm.hasCost}
							<div class="flex-1">
								<input type="number" bind:value={taskForm.estimatedCost} min="0" step="0.01" class={INPUT} placeholder="Estimated cost ($)" />
							</div>
							<label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
								<input type="checkbox" bind:checked={taskForm.requiresApproval} class="rounded border-gray-600 bg-gray-700" />
								Requires approval
							</label>
							{/if}
						</div>
					</div>
					<div class="flex gap-2">
						<Button onclick={addTask} disabled={taskSaving || !taskForm.title}>{taskSaving ? 'Saving...' : 'Add Task'}</Button>
						<Button variant="outline" onclick={() => { showAddTask = false; taskError = ''; }}>Cancel</Button>
					</div>
				</div>
				{:else}
				<Button variant="outline" onclick={() => showAddTask = true} class="text-sm">
					<Plus class="w-4 h-4 mr-1" />Add Task
				</Button>
				{/if}
			</div>
		</div>
		{/if}
	</div>
</div>
