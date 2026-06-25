<script lang="ts">
	import type { PageData } from './$types';
	import { FolderKanban, Zap, Briefcase, ChevronDown, ChevronRight, Edit2, Printer } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const config   = $derived((data as any).portalConfig);
	const projects = $derived((data as any).projects ?? []);
	const departments = $derived((data as any).departments ?? []);
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-blue-400');
	const accentBorder = $derived(config?.accentTw?.split(' ')[1] ?? 'border-blue-500');
	
	const pageTitle = $derived(
		departments.length === 1 
			? 'My Department' 
			: departments.length > 1 
				? 'My Departments' 
				: 'My Projects'
	);
	const emptyMessage = $derived(
		departments.length > 0
			? `No projects in ${departments.map(d => d.name).join(', ')}.`
			: 'No projects led by you.'
	);

	let expandedProjects = $state<Record<string, boolean>>({});
	function toggleExpanded(id: string) {
		expandedProjects[id] = expandedProjects[id] ? false : true;
	}

	function fmt(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n ?? 0);
	}

	function fmtDate(d: string | null | undefined) {
		if (!d) return '—';
		const dateOnly = d.includes('T') ? d.split('T')[0] : d.split(' ')[0];
		const [y, m, day] = dateOnly.split('-').map(Number);
		if (!y) return '—';
		return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function stripHtml(html: string | null | undefined): string {
		if (!html) return '';
		return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
	}

	function parseSubtasks(checklist: any): Array<{text: string, completed: boolean}> {
		if (!checklist) return [];
		
		// Handle markdown checklist format: "- [ ] item" or "- [x] item"
		if (typeof checklist === 'string') {
			const lines = checklist.split('\n').filter(line => line.trim().startsWith('-'));
			return lines.map(line => {
				const match = line.match(/^-\s+\[(.)\]\s+(.*)$/);
				if (match) {
					return {
						text: match[2].trim(),
						completed: match[1].toLowerCase() !== ' '
					};
				}
				return null;
			}).filter((item): item is {text: string, completed: boolean} => item !== null);
		}
		
		// Handle JSON format: [{text, completed}]
		if (typeof checklist === 'object' && Array.isArray(checklist)) {
			return checklist;
		}
		
		return [];
	}

	const taskStatusOptions = ['todo', 'in_progress', 'blocked', 'completed', 'cancelled'];
	
	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			'todo': 'bg-slate-700 text-slate-300',
			'in_progress': 'bg-blue-900/40 text-blue-300',
			'completed': 'bg-emerald-900/40 text-emerald-300',
			'blocked': 'bg-red-900/40 text-red-300',
			'cancelled': 'bg-slate-800 text-slate-400'
		};
		return colors[status] || 'bg-slate-700 text-slate-300';
	}

	// Task workflow pipeline
	function getTaskStageIndex(status: string): number {
		if (status === 'todo') return 0;
		if (status === 'in_progress') return 1;
		if (status === 'needs_review') return 2;
		if (status === 'approved') return 3;
		if (status === 'completed') return 4;
		return -1;
	}

	function getStageProgress(task: { status?: string }): { stage: number; isFailed: boolean } {
		const failureStages = ['blocked', 'cancelled'];
		if (failureStages.includes(task.status || '')) {
			return { stage: -1, isFailed: true };
		}
		const stage = getTaskStageIndex(task.status || 'todo');
		return { stage, isFailed: false };
	}
</script>

<style>
	@media print {
		:global(body) {
			background: white;
			color: black;
		}

		:global(.space-y-6) {
			margin: 0;
		}

		:global(.bg-slate-900) {
			background: white !important;
			border: 1px solid #ddd !important;
		}

		:global(.bg-slate-800) {
			background: #f5f5f5 !important;
		}

		:global(.bg-slate-800\/20) {
			background: #f9f9f9 !important;
		}

		:global(.text-white) {
			color: black !important;
		}

		:global(.text-slate-400) {
			color: #666 !important;
		}

		:global(.text-slate-500) {
			color: #777 !important;
		}

		:global(.text-blue-400) {
			color: #0066cc !important;
		}

		:global(.text-amber-300) {
			color: #cc8800 !important;
		}

		:global(.text-sky-300) {
			color: #0099dd !important;
		}

		:global(.text-violet-300) {
			color: #9933cc !important;
		}

		:global(.text-teal-300) {
			color: #00aa88 !important;
		}

		:global(.text-rose-300) {
			color: #dd3366 !important;
		}

		:global(.text-orange-400) {
			color: #ff8800 !important;
		}

		:global(.border-slate-800) {
			border-color: #ddd !important;
		}

		:global(.border-slate-700) {
			border-color: #bbb !important;
		}

		:global(button[type="button"]) {
			display: none;
		}

		:global(.flex.gap-2.pt-2) {
			display: none;
		}

		:global(.hover\:bg-slate-800\/30) {
			background: none !important;
		}

		:global(h1) {
			page-break-after: avoid;
		}

		:global(.space-y-3 > div) {
			page-break-inside: avoid;
			margin-bottom: 2rem;
		}
	}
</style>

<svelte:head><title>{pageTitle} — {config?.label} Portal · FliHub</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-white flex items-center gap-2">
				<FolderKanban class="size-6 {accentText}" /> {pageTitle}
			</h1>
			{#if departments.length > 0}
				<p class="text-sm text-slate-400 mt-1">
					{departments.map(d => d.name).join(', ')}
				</p>
			{/if}
		</div>
		<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">{projects.length} total</span>
	</div>

	{#if projects.length === 0}
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
			<FolderKanban class="size-10 text-slate-700 mx-auto mb-3" />
			<p class="text-sm text-slate-500">{emptyMessage}</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each projects as p (p.id)}
				{@const isExpanded = expandedProjects[p.id]}
				<div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all hover:border-slate-700">
					<!-- Top Bar: Title, Category, Budget -->
					<div class="px-6 py-4 border-b border-slate-800 bg-slate-800/30">
						<div class="flex items-start justify-between gap-4 mb-3">
							<div class="min-w-0 flex-1">
								<h3 class="text-lg font-bold text-white mb-2 flex items-center gap-2">
									<Zap class="size-5 {accentText} shrink-0" />
									<span class="truncate">{p.name}</span>
								</h3>
								<div class="flex items-center gap-2 flex-wrap">
									{#if p.category}
										<span class="px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider">
											{p.category}
										</span>
									{/if}
									{#if p.expand?.department?.name}
										<span class="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 flex items-center gap-1.5 text-xs">
											<Briefcase class="size-3.5" />
											{p.expand.department.name}
										</span>
									{/if}
									{#if p.status}
										<span class="px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-300 text-xs font-semibold capitalize">
											{p.status.replace('_', ' ')}
										</span>
									{/if}
								</div>
							</div>
						<div class="flex items-center gap-4 shrink-0">
							<button
								type="button"
								onclick={() => window.print()}
								class="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-300"
								title="Print project"
							>
								<Printer class="size-5" />
							</button>
							<div class="text-right">
								<p class="text-xl font-bold {accentText}">{fmt(p.project_budget ?? 0)}</p>
								<p class="text-xs text-slate-500">budget</p>
							</div>
							</div>
						</div>
					</div>

					<!-- Main Content -->
					<div class="px-6 py-4 space-y-4">
						{#if p.description}
							<div>
								<p class="text-sm text-slate-400 leading-relaxed">{stripHtml(p.description)}</p>
							</div>
						{/if}

						<!-- Tasks Section -->
						{#if p.tasks && p.tasks.length > 0}
							<div>
								<p class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Tasks ({p.tasks.length})</p>
								<div class="space-y-2">
									{#each p.tasks as task (task.id)}
										<div class="rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors overflow-hidden">
											<!-- Task Row -->
											<div class="flex items-center justify-between gap-2 p-2.5">
												<p class="text-sm text-slate-300 flex-1 truncate">{task.task || task.title || '(Untitled)'}</p>
												<!-- Status Dropdown -->
												<form method="POST" action="?/updateTaskStatus" class="flex items-center gap-1">
													<input type="hidden" name="taskId" value={task.id} />
													<select
														name="status"
														value={task.status || 'todo'}
														onchange={(e) => e.currentTarget.form?.submit()}
														class="text-xs font-semibold px-2 py-0.5 rounded border-0 cursor-pointer {getStatusColor(task.status || 'todo')} focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900"
													>
														{#each taskStatusOptions as opt}
															<option value={opt}>{opt.replace('_', ' ')}</option>
														{/each}
													</select>
												</form>
											</div>
											
											<!-- Pipeline Progress Bar -->
										{#if ['blocked', 'cancelled'].includes(task.status || '')}
											<div class="px-2.5 py-1.5 bg-red-900/20 border-t border-slate-700">
												<p class="text-xs text-red-400">⚠️ Won't be paid ({task.status})</p>
											</div>
										{:else}
											{@const stage = getTaskStageIndex(task.status || 'todo')}
											<div class="px-2.5 py-1.5 border-t border-slate-700">
												<div class="flex gap-1 items-center mb-1">
													<div class="flex-1 flex gap-0.5 h-1.5">
														{#each [0, 1, 2, 3, 4] as s}
															<div class="flex-1 rounded-full {s <= stage ? (s === 4 ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-slate-700'}"></div>
														{/each}
													</div>
													<span class="text-xs text-slate-500 whitespace-nowrap">{stage + 1}/5</span>
												</div>
												<p class="text-xs text-slate-500">
													{stage === 0 ? 'Ready to start' : stage === 1 ? 'In progress' : stage === 2 ? 'Awaiting review' : stage === 3 ? 'Ready for payment' : 'Paid ✓'}
												</p>
											</div>
										{/if}
										
										<!-- Subtasks (if any) -->
										{#if task.subTasksChecklist && parseSubtasks(task.subTasksChecklist).length > 0}
											<div class="px-2.5 pb-2.5 space-y-1 border-t border-slate-700">
												{#each parseSubtasks(task.subTasksChecklist) as subtask}
													<div class="text-xs text-slate-400 pl-4 py-1 border-l-2 border-slate-600 flex items-start gap-2">
														<span class="text-slate-500 shrink-0">{subtask.completed ? '✓' : '○'}</span>
														<span class="{subtask.completed ? 'line-through text-slate-500' : ''}">{subtask.text}</span>
													</div>
												{/each}
											</div>
										{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Budget Grid -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
							{#if p.project_budget !== undefined}
								<div class="bg-slate-800 rounded-lg px-3 py-2.5">
									<p class="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Total Budget</p>
									<p class="text-sm font-bold {accentText}">{fmt(p.project_budget)}</p>
								</div>
							{/if}
							{#if p.project_actual_expenses !== undefined}
								<div class="bg-slate-800 rounded-lg px-3 py-2.5">
									<p class="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Spent</p>
									<p class="text-sm font-bold text-amber-300">{fmt(p.project_actual_expenses)}</p>
								</div>
							{/if}
							{#if p.project_forecasted_expenses !== undefined}
								<div class="bg-slate-800 rounded-lg px-3 py-2.5">
									<p class="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Forecasted</p>
									<p class="text-sm font-bold text-sky-300">{fmt(p.project_forecasted_expenses)}</p>
								</div>
							{/if}
							{#if p.phase}
								<div class="bg-slate-800 rounded-lg px-3 py-2.5">
									<p class="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Phase</p>
									<p class="text-sm font-bold text-slate-300">{p.phase}</p>
								</div>
							{/if}
						</div>

						<!-- More Button -->
						<button
							type="button"
							onclick={() => toggleExpanded(p.id)}
							class="w-full mt-3 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
						>
							{isExpanded ? 'Less' : 'More'} Details
							{#if isExpanded}
								<ChevronDown class="size-4" />
							{:else}
								<ChevronRight class="size-4" />
							{/if}
						</button>
					</div>

					<!-- Expanded Details -->
					{#if isExpanded}
						<div class="border-t border-slate-800 px-6 py-4 space-y-4 bg-slate-800/10">
							<!-- Budget Mode & Settings -->
							<div>
								<p class="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">Budget Settings</p>
								<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
									{#if p.project_budget_mode}
										<div class="bg-slate-800 rounded-lg px-3 py-2">
											<p class="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Mode</p>
											<p class="text-xs font-semibold text-slate-300 capitalize">{p.project_budget_mode}</p>
										</div>
									{/if}
									{#if p.project_budget_cap !== null && p.project_budget_cap !== undefined}
										<div class="bg-slate-800 rounded-lg px-3 py-2">
											<p class="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Cap</p>
											<p class="text-xs font-semibold text-violet-300">{fmt(p.project_budget_cap)}</p>
										</div>
									{/if}
									{#if p.project_budget_buffer !== null && p.project_budget_buffer !== undefined}
										<div class="bg-slate-800 rounded-lg px-3 py-2">
											<p class="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Buffer</p>
											<p class="text-xs font-semibold text-teal-300">{fmt(p.project_budget_buffer)}</p>
										</div>
									{/if}
								</div>
							</div>

							<!-- Timeline -->
							{#if p.created || p.updated}
								<div>
									<p class="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">Timeline</p>
									<div class="grid grid-cols-2 gap-3">
										{#if p.created}
											<div class="bg-slate-800 rounded-lg px-3 py-2">
												<p class="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Created</p>
												<p class="text-xs text-slate-400">{fmtDate(p.created)}</p>
											</div>
										{/if}
										{#if p.updated}
											<div class="bg-slate-800 rounded-lg px-3 py-2">
												<p class="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">Updated</p>
												<p class="text-xs text-slate-400">{fmtDate(p.updated)}</p>
											</div>
										{/if}
									</div>
								</div>
							{/if}

							<!-- Notes -->
							{#if p.notes}
								<div>
									<p class="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">Notes</p>
									<div class="bg-slate-800 rounded-lg px-3 py-2">
										<p class="text-xs text-slate-400">{stripHtml(p.notes)}</p>
									</div>
								</div>
							{/if}

							<!-- Action Buttons -->
							<div class="flex gap-2 pt-2 border-t border-slate-700">
								<a
									href="/portal/projects/{p.id}/edit"
									class="flex-1 flex items-center justify-center gap-2 bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 px-3 py-2.5 rounded-lg transition-colors text-xs font-semibold"
								>
									<Edit2 class="size-3.5" />
									Edit
								</a>
								<button
									type="button"
									onclick={() => window.print()}
									class="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2.5 rounded-lg transition-colors text-xs font-semibold"
								>
									<Printer class="size-3.5" />
									Print
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
