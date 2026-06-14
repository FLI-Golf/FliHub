<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import VisualTabs from '$lib/components/ui/visual-tabs.svelte';
	import MetricCard from '$lib/components/metrics/metric-card.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { 
		Plus, 
		Search, 
		Zap, 
		CheckCircle2, 
		AlertCircle,
		Clock,
		TrendingUp,
		Trash2,
		Edit2
	} from 'lucide-svelte';
	import { goto, invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let showAddModal = $state(false);
	let searchQuery = $state('');
	let statusFilter = $state<string>('all');
	let editingId = $state<string | null>(null);
	let deleting = $state(false);

	const improvements = $derived(data?.improvements?.items || []);
	const totalItems = $derived(data?.improvements?.totalItems || 0);

	// Calculate stats
	const stats = $derived({
		total: totalItems,
		identified: improvements.filter((i: any) => i.status === 'Identified').length,
		inProgress: improvements.filter((i: any) => i.status === 'In Progress').length,
		approved: improvements.filter((i: any) => i.status === 'Approved').length,
		implemented: improvements.filter((i: any) => i.status === 'Implemented').length,
		highPriority: improvements.filter((i: any) => i.priority === 'High' || i.priority === 'Critical').length
	});

	// Filter improvements
	let filteredImprovements = $derived(improvements.filter((i: any) => {
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			const matchesSearch = 
				i.title?.toLowerCase().includes(query) ||
				i.description?.toLowerCase().includes(query) ||
				i.category?.toLowerCase().includes(query);
			if (!matchesSearch) return false;
		}

		if (statusFilter !== 'all' && i.status !== statusFilter) return false;
		return true;
	}));

	// Build tabs
	const statusTabs = $derived([
		{ value: 'all', label: 'All', count: stats.total },
		{ value: 'Identified', label: 'Identified', count: stats.identified, icon: AlertCircle },
		{ value: 'In Progress', label: 'In Progress', count: stats.inProgress, icon: Clock },
		{ value: 'Approved', label: 'Approved', count: stats.approved, icon: CheckCircle2 },
		{ value: 'Implemented', label: 'Implemented', count: stats.implemented, icon: TrendingUp }
	]);

	function formatDate(dateString: string | null): string {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'Identified': return 'bg-slate-100 text-slate-800';
			case 'In Progress': return 'bg-blue-100 text-blue-800';
			case 'Approved': return 'bg-purple-100 text-purple-800';
			case 'Implemented': return 'bg-emerald-100 text-emerald-800';
			case 'Monitoring': return 'bg-amber-100 text-amber-800';
			case 'Under Review': return 'bg-orange-100 text-orange-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'Critical': return 'text-red-600 bg-red-50';
			case 'High': return 'text-orange-600 bg-orange-50';
			case 'Medium': return 'text-yellow-600 bg-yellow-50';
			case 'Low': return 'text-green-600 bg-green-50';
			default: return 'text-gray-600 bg-gray-50';
		}
	}

	async function deleteImprovement(id: string) {
		if (!confirm('Are you sure you want to delete this improvement?')) return;
		deleting = true;
		try {
			const res = await fetch(`/api/continuous-improvements/${id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Failed to delete');
			await invalidateAll();
		} catch (err) {
			alert('Failed to delete improvement');
		} finally {
			deleting = false;
		}
	}

	async function updateStatus(id: string, newStatus: string) {
		try {
			const res = await fetch(`/api/continuous-improvements/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});
			if (!res.ok) throw new Error('Failed to update');
			await invalidateAll();
		} catch (err) {
			alert('Failed to update improvement');
		}
	}

	function stripHtml(html: string): string {
		if (!html) return '';
		return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Continuous Improvements</h1>
			<p class="text-slate-600 mt-1">Track and manage process improvements across the organization</p>
		</div>
		<Button onclick={() => goto('/dashboard/continuous-improvements/new')} size="lg">
			<Plus class="w-4 h-4 mr-2" /> New Improvement
		</Button>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
		<MetricCard
			title="Total"
			value={stats.total}
			icon={TrendingUp}
			color="slate"
		/>
		<MetricCard
			title="Identified"
			value={stats.identified}
			icon={AlertCircle}
			color="slate"
		/>
		<MetricCard
			title="In Progress"
			value={stats.inProgress}
			icon={Clock}
			color="blue"
		/>
		<MetricCard
			title="Approved"
			value={stats.approved}
			icon={CheckCircle2}
			color="purple"
		/>
		<MetricCard
			title="High Priority"
			value={stats.highPriority}
			icon={Zap}
			color="orange"
		/>
	</div>

	<!-- Filters -->
	<div class="space-y-4">
		<div class="flex gap-3">
			<div class="relative flex-1">
				<Search class="absolute left-3 top-3 w-4 h-4 text-slate-400" />
				<Input
					type="text"
					placeholder="Search improvements..."
					bind:value={searchQuery}
					class="pl-10"
				/>
			</div>
		</div>

		<!-- Status Filter -->
		<VisualTabs 
			tabs={statusTabs}
			activeTab={statusFilter}
			onTabChange={(value) => statusFilter = value}
		/>

	</div>

	<!-- Results -->
	<div class="space-y-3">
		{#if filteredImprovements.length === 0}
			<Card class="p-8 text-center">
				<p class="text-slate-600">No improvements match your filters.</p>
			</Card>
		{:else}
			{#each filteredImprovements as improvement (improvement.id)}
				<Card class="p-4 hover:shadow-md transition-shadow">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 space-y-2">
							<div class="flex items-center gap-2">
								<h3 class="text-lg font-semibold">{improvement.title}</h3>
								<span class={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(improvement.priority)}`}>
									{improvement.priority || 'Medium'}
								</span>
							</div>
							{#if improvement.description}
								<p class="text-sm text-slate-600">{improvement.description}</p>
							{/if}
							<div class="flex flex-wrap gap-3 text-xs text-slate-500 mt-2">
								{#if improvement.category}
									<div class="bg-slate-100 px-2 py-1 rounded">{improvement.category}</div>
								{/if}
								{#if improvement.implementationDate}
									<div class="bg-slate-100 px-2 py-1 rounded">
										Due: {formatDate(improvement.implementationDate)}
									</div>
								{/if}
							</div>
						</div>

						<div class="flex flex-col items-end gap-2">
							<span class={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(improvement.status)}`}>
								{improvement.status || 'Identified'}
							</span>

							<div class="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onclick={() => goto(`/dashboard/continuous-improvements/${improvement.id}`)}
								>
									<Edit2 class="w-4 h-4" />
								</Button>
								<Button
									size="sm"
									variant="outline"
									class="text-red-600 hover:text-red-700"
									disabled={deleting}
									onclick={() => deleteImprovement(improvement.id)}
								>
									<Trash2 class="w-4 h-4" />
								</Button>
							</div>
						</div>
					</div>
				</Card>
			{/each}
		{/if}
	</div>
</div>
