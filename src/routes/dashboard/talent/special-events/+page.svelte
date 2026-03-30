<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageData } = $props();

	let showCreateModal = $state(false);
	let editingEvent = $state<any>(null);

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed':
				return 'bg-emerald-900/50 text-emerald-300 border border-emerald-700';
			case 'scheduled':
				return 'bg-blue-900/50 text-blue-300 border border-blue-700';
			case 'cancelled':
				return 'bg-red-900/50 text-red-300 border border-red-700';
			default:
				return 'bg-slate-700 text-slate-300 border border-slate-600';
		}
	};

	const getEventTypeIcon = (type: string) => {
		switch (type) {
			case 'appearance':
				return '👤';
			case 'clinic':
				return '🎓';
			case 'media':
				return '📺';
			case 'promotional':
				return '📢';
			case 'content_creation':
				return '🎬';
			default:
				return '📅';
		}
	};

	const getEventTypeLabel = (type: string) => {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	const openCreateModal = () => {
		editingEvent = null;
		showCreateModal = true;
	};

	const openEditModal = (event: any) => {
		editingEvent = event;
		showCreateModal = true;
	};

	const closeModal = () => {
		showCreateModal = false;
		editingEvent = null;
	};
</script>

<div class="container mx-auto p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-100">Special Events</h1>
			<p class="text-muted-foreground">
				Manage special events like appearances, clinics, and promotional activities
			</p>
		</div>
		<div class="flex gap-2">
			<Button href="/dashboard/talent">← Back to Pros</Button>
			<Button onclick={openCreateModal}>Create Event</Button>
		</div>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="bg-slate-800 border border-slate-700 p-6 rounded-lg">
			<div class="text-sm text-slate-400">Upcoming Events</div>
			<div class="text-3xl font-bold text-slate-100">
				{data.events.filter((e) => e.status === 'scheduled').length}
			</div>
		</div>
		<div class="bg-slate-800 border border-slate-700 p-6 rounded-lg">
			<div class="text-sm text-slate-400">Completed Events</div>
			<div class="text-3xl font-bold text-slate-100">
				{data.events.filter((e) => e.status === 'completed').length}
			</div>
		</div>
		<div class="bg-slate-800 border border-slate-700 p-6 rounded-lg">
			<div class="text-sm text-slate-400">Total Events</div>
			<div class="text-3xl font-bold text-slate-100">{data.events.length}</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-slate-800 border border-slate-700 rounded-lg p-4">
		<div class="flex gap-4">
			<div>
				<label class="text-sm font-medium text-slate-300">Status</label>
				<select
					class="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
					onchange={(e) => {
						const status = e.currentTarget.value;
						window.location.href = status
							? `/dashboard/talent/special-events?status=${status}`
							: '/dashboard/talent/special-events';
					}}
				>
					<option value="">All Statuses</option>
					<option value="scheduled" selected={data.currentStatus === 'scheduled'}>Scheduled</option>
					<option value="completed" selected={data.currentStatus === 'completed'}>Completed</option>
					<option value="cancelled" selected={data.currentStatus === 'cancelled'}>Cancelled</option>
				</select>
			</div>
			<div>
				<label class="text-sm font-medium text-slate-300">Event Type</label>
				<select
					class="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
					onchange={(e) => {
						const type = e.currentTarget.value;
						window.location.href = type
							? `/dashboard/talent/special-events?type=${type}`
							: '/dashboard/talent/special-events';
					}}
				>
					<option value="">All Types</option>
					<option value="appearance" selected={data.currentType === 'appearance'}>Appearance</option>
					<option value="clinic" selected={data.currentType === 'clinic'}>Clinic</option>
					<option value="media" selected={data.currentType === 'media'}>Media</option>
					<option value="promotional" selected={data.currentType === 'promotional'}
						>Promotional</option
					>
					<option value="content_creation" selected={data.currentType === 'content_creation'}
						>Content Creation</option
					>
					<option value="other" selected={data.currentType === 'other'}>Other</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Events Grid -->
	{#if data.events.length === 0}
		<div class="p-8 text-center text-slate-400 bg-slate-800 border border-slate-700 rounded-xl">
			No special events found. Create your first event to get started.
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.events as event, i}
				<div class="flex flex-col rounded-xl border border-slate-700 {i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700/60'} hover:bg-slate-600/50 hover:-translate-y-0.5 transition-all duration-150 shadow-sm">
					<!-- Card header -->
					<div class="flex items-start justify-between p-4 border-b border-slate-700">
						<div class="flex items-center gap-3">
							<div class="flex size-10 items-center justify-center rounded-lg bg-slate-700 text-xl shrink-0">
								{getEventTypeIcon(event.eventType)}
							</div>
							<div>
								<h3 class="font-semibold text-slate-100 leading-tight">{event.name}</h3>
								<span class="text-xs text-slate-400">{getEventTypeLabel(event.eventType)}</span>
							</div>
						</div>
						<Badge class={getStatusColor(event.status)}>{event.status}</Badge>
					</div>
					<!-- Card body -->
					<div class="flex-1 p-4 space-y-1.5 text-sm text-slate-400">
						<div>📅 {formatDate(event.eventDate)}</div>
						{#if event.location}
							<div>📍 {event.location}</div>
						{/if}
						{#if event.description}
							<div class="mt-2 text-slate-300 line-clamp-2">{@html event.description}</div>
						{/if}
					</div>
					<!-- Card footer -->
					<div class="flex gap-2 p-4 pt-0">
						<Button onclick={() => openEditModal(event)} variant="outline" size="sm" class="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">Edit</Button>
						<form method="POST" action="?/delete" use:enhance class="flex-1">
							<input type="hidden" name="id" value={event.id} />
							<Button
								type="submit"
								variant="outline"
								size="sm"
								class="w-full border-red-800 text-red-400 hover:bg-red-900/30"
								onclick={(e) => {
									if (!confirm('Are you sure you want to delete this event?')) e.preventDefault();
								}}>Delete</Button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create/Edit Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<h2 class="text-2xl font-bold mb-4 text-slate-100">
				{editingEvent ? 'Edit Special Event' : 'Create Special Event'}
			</h2>
			<form method="POST" action="?/{editingEvent ? 'update' : 'create'}" use:enhance>
				{#if editingEvent}
					<input type="hidden" name="id" value={editingEvent.id} />
				{/if}
				<div class="space-y-4">
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Event Name *</label>
						<input
							type="text"
							name="name"
							value={editingEvent?.name || ''}
							required
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-xs font-medium mb-1 text-slate-400">Event Type *</label>
							<select
								name="eventType"
								required
								class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
							>
								<option value="appearance" selected={editingEvent?.eventType === 'appearance'}
									>Appearance</option
								>
								<option value="clinic" selected={editingEvent?.eventType === 'clinic'}
									>Clinic</option
								>
								<option value="media" selected={editingEvent?.eventType === 'media'}>Media</option>
								<option value="promotional" selected={editingEvent?.eventType === 'promotional'}
									>Promotional</option
								>
								<option
									value="content_creation"
									selected={editingEvent?.eventType === 'content_creation'}
									>Content Creation</option
								>
								<option value="other" selected={editingEvent?.eventType === 'other'}>Other</option>
							</select>
						</div>
						<div>
							<label class="block text-xs font-medium mb-1 text-slate-400">Event Date *</label>
							<input
								type="date"
								name="eventDate"
								value={editingEvent?.eventDate || ''}
								required
								class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-xs font-medium mb-1 text-slate-400">Location</label>
							<input
								type="text"
								name="location"
								value={editingEvent?.location || ''}
								class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
							/>
						</div>
						<div>
							<label class="block text-xs font-medium mb-1 text-slate-400">Status *</label>
							<select
								name="status"
								required
								class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
							>
								<option value="scheduled" selected={editingEvent?.status === 'scheduled'}
									>Scheduled</option
								>
								<option value="completed" selected={editingEvent?.status === 'completed'}
									>Completed</option
								>
								<option value="cancelled" selected={editingEvent?.status === 'cancelled'}
									>Cancelled</option
								>
							</select>
						</div>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Description</label>
						<textarea
							name="description"
							value={editingEvent?.description || ''}
							rows="3"
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
						></textarea>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1 text-slate-400">Notes</label>
						<textarea
							name="notes"
							value={editingEvent?.notes || ''}
							rows="3"
							class="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
						></textarea>
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-6">
					<Button type="button" variant="outline" onclick={closeModal}>Cancel</Button>
					<Button type="submit">{editingEvent ? 'Update' : 'Create'}</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
