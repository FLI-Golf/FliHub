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
				return 'bg-green-100 text-green-800';
			case 'scheduled':
				return 'bg-blue-100 text-blue-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
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
			<h1 class="text-3xl font-bold">Special Events</h1>
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
		<div class="bg-white p-6 rounded-lg border">
			<div class="text-sm text-muted-foreground">Upcoming Events</div>
			<div class="text-3xl font-bold">
				{data.events.filter((e) => e.status === 'scheduled').length}
			</div>
		</div>
		<div class="bg-white p-6 rounded-lg border">
			<div class="text-sm text-muted-foreground">Completed Events</div>
			<div class="text-3xl font-bold">
				{data.events.filter((e) => e.status === 'completed').length}
			</div>
		</div>
		<div class="bg-white p-6 rounded-lg border">
			<div class="text-sm text-muted-foreground">Total Events</div>
			<div class="text-3xl font-bold">{data.events.length}</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-lg border p-4">
		<div class="flex gap-4">
			<div>
				<label class="text-sm font-medium">Status</label>
				<select
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
				<label class="text-sm font-medium">Event Type</label>
				<select
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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

	<!-- Events List -->
	<div class="bg-white rounded-lg border">
		<div class="divide-y">
			{#each data.events as event}
				<div class="p-4 hover:bg-gray-50">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<span class="text-2xl">{getEventTypeIcon(event.eventType)}</span>
								<div>
									<h3 class="text-lg font-semibold">{event.name}</h3>
									<div class="flex items-center gap-2 mt-1">
										<Badge class={getStatusColor(event.status)}>{event.status}</Badge>
										<span class="text-sm text-muted-foreground">
											{getEventTypeLabel(event.eventType)}
										</span>
									</div>
								</div>
							</div>
							<div class="mt-2 space-y-1 text-sm text-muted-foreground">
								<div>📅 {formatDate(event.eventDate)}</div>
								{#if event.location}
									<div>📍 {event.location}</div>
								{/if}
								{#if event.description}
									<div class="mt-2">{@html event.description}</div>
								{/if}
							</div>
						</div>
						<div class="flex gap-2">
							<Button onclick={() => openEditModal(event)} variant="outline" size="sm"
								>Edit</Button
							>
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={event.id} />
								<Button
									type="submit"
									variant="outline"
									size="sm"
									onclick={(e) => {
										if (!confirm('Are you sure you want to delete this event?')) {
											e.preventDefault();
										}
									}}>Delete</Button
								>
							</form>
						</div>
					</div>
				</div>
			{:else}
				<div class="p-8 text-center text-muted-foreground">
					No special events found. Create your first event to get started.
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Create/Edit Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<h2 class="text-2xl font-bold mb-4">
				{editingEvent ? 'Edit Special Event' : 'Create Special Event'}
			</h2>
			<form method="POST" action="?/{editingEvent ? 'update' : 'create'}" use:enhance>
				{#if editingEvent}
					<input type="hidden" name="id" value={editingEvent.id} />
				{/if}
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium mb-1">Event Name *</label>
						<input
							type="text"
							name="name"
							value={editingEvent?.name || ''}
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium mb-1">Event Type *</label>
							<select
								name="eventType"
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2"
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
							<label class="block text-sm font-medium mb-1">Event Date *</label>
							<input
								type="date"
								name="eventDate"
								value={editingEvent?.eventDate || ''}
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium mb-1">Location</label>
							<input
								type="text"
								name="location"
								value={editingEvent?.location || ''}
								class="w-full rounded-md border border-gray-300 px-3 py-2"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium mb-1">Status *</label>
							<select
								name="status"
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2"
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
						<label class="block text-sm font-medium mb-1">Description</label>
						<textarea
							name="description"
							value={editingEvent?.description || ''}
							rows="3"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-medium mb-1">Notes</label>
						<textarea
							name="notes"
							value={editingEvent?.notes || ''}
							rows="3"
							class="w-full rounded-md border border-gray-300 px-3 py-2"
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
