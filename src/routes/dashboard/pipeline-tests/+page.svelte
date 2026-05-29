<script lang="ts">
	/**
	 * Pipeline test runner — browser UI.
	 *
	 * TEMPORARY: This page exists only while the pipeline features are being
	 * validated. Delete /dashboard/pipeline-tests and /api/pipeline-tests once
	 * the team is comfortable with the behaviour.
	 */
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button';
	import { CheckCircle2, XCircle, Clock, Play, RotateCcw, ChevronDown, ChevronUp, Trash2, AlertTriangle } from 'lucide-svelte';

	// ── State ─────────────────────────────────────────────────────────────────

	type TestResult = {
		suite: string;
		name: string;
		passed: boolean;
		error?: string;
		durationMs: number;
	};

	type RunSummary = {
		passed: number;
		failed: number;
		total: number;
		kept: boolean;
		results: TestResult[];
		ranAt?: string;
		totalMs?: number;
	};

	const SUITES = [
		{ key: 'all',        label: 'All Suites',                  color: 'text-slate-300' },
		{ key: 'engine',     label: 'Shared Pipeline Engine',       color: 'text-blue-400' },
		{ key: 'onboarding', label: 'Talent Onboarding Pipeline',   color: 'text-emerald-400' },
		{ key: 'sponsor',    label: 'Sponsor Deals Pipeline',       color: 'text-yellow-400' },
		{ key: 'tournament', label: 'Tournament Ops Pipeline',      color: 'text-purple-400' },
		{ key: 'content',    label: 'Content Production Pipeline',  color: 'text-pink-400' }
	];

	let selectedSuite = $state('all');
	let keepData      = $state(false);
	let running       = $state(false);
	let summary       = $state<RunSummary | null>(null);
	let runError      = $state('');
	let expandedSuites = $state<Set<string>>(new Set());

	// ── Run tests ─────────────────────────────────────────────────────────────

	async function runTests() {
		running = true;
		runError = '';
		summary = null;
		const start = Date.now();

		try {
			const res = await fetch('/api/pipeline-tests', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ suite: selectedSuite, keep: keepData })
			});

			if (!res.ok) {
				const d = await res.json().catch(() => ({}));
				throw new Error(d.error ?? d.message ?? `HTTP ${res.status}`);
			}

			const data = await res.json();
			summary = {
				...data,
				ranAt: new Date().toLocaleTimeString(),
				totalMs: Date.now() - start
			};

			// Auto-expand failed suites
			const failedSuites = new Set(
				data.results.filter((r: TestResult) => !r.passed).map((r: TestResult) => r.suite)
			);
			expandedSuites = failedSuites;
		} catch (err: any) {
			runError = err.message ?? 'Test run failed';
		} finally {
			running = false;
		}
	}

	// ── Derived ───────────────────────────────────────────────────────────────

	const suiteGroups = $derived(() => {
		if (!summary) return [];
		const groups = new Map<string, TestResult[]>();
		for (const r of summary.results) {
			if (!groups.has(r.suite)) groups.set(r.suite, []);
			groups.get(r.suite)!.push(r);
		}
		return Array.from(groups.entries()).map(([suite, tests]) => ({
			suite,
			tests,
			passed: tests.filter(t => t.passed).length,
			failed: tests.filter(t => !t.passed).length
		}));
	});

	function toggleSuite(suite: string) {
		const next = new Set(expandedSuites);
		if (next.has(suite)) next.delete(suite);
		else next.add(suite);
		expandedSuites = next;
	}

	const allPassed = $derived(summary && summary.failed === 0);
</script>

<svelte:head><title>Pipeline Tests — FliHub [TEMP]</title></svelte:head>

<div class="space-y-6 max-w-3xl">

	<!-- Header — clearly marked as temporary -->
	<div class="rounded-xl border border-yellow-700/50 bg-yellow-950/30 px-5 py-4">
		<div class="flex items-start gap-3">
			<AlertTriangle class="size-5 text-yellow-400 shrink-0 mt-0.5" />
			<div>
				<p class="font-semibold text-yellow-300 text-sm">Temporary Testing Tool</p>
				<p class="text-xs text-yellow-500 mt-0.5">
					This page and its API route (<code class="font-mono">/api/pipeline-tests</code>) are
					intentionally temporary. Delete both once the pipeline features are stable and the team
					is comfortable with the behaviour.
				</p>
			</div>
		</div>
	</div>

	<div>
		<h1 class="text-3xl font-bold tracking-tight">Pipeline Tests</h1>
		<p class="text-muted-foreground mt-1">
			Integration tests for all 5 pipeline features. Runs against the live PocketBase instance.
			All test data is cleaned up after each run unless "Keep data" is checked.
		</p>
	</div>

	<!-- Controls -->
	<Card class="p-5 bg-slate-800/40 border-slate-700">
		<div class="flex flex-wrap items-end gap-4">
			<!-- Suite selector -->
			<div class="flex-1 min-w-48">
				<label class="block text-xs font-medium text-slate-400 mb-1.5">Suite</label>
				<select bind:value={selectedSuite}
					class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 px-3 py-2 text-sm
					       focus:outline-none focus:ring-2 focus:ring-emerald-500">
					{#each SUITES as s}
						<option value={s.key}>{s.label}</option>
					{/each}
				</select>
			</div>

			<!-- Keep data toggle -->
			<label class="flex items-center gap-2 cursor-pointer pb-2">
				<input type="checkbox" bind:checked={keepData}
					class="rounded border-slate-600 bg-slate-800 text-yellow-500" />
				<span class="text-sm text-slate-300">Keep test data</span>
			</label>

			<!-- Run button -->
			<Button onclick={runTests} disabled={running}
				class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white pb-2">
				{#if running}
					<RotateCcw class="size-4 animate-spin" /> Running…
				{:else}
					<Play class="size-4" /> Run Tests
				{/if}
			</Button>
		</div>

		<!-- CLI hint -->
		<div class="mt-4 pt-4 border-t border-slate-700">
			<p class="text-xs text-slate-500 mb-1.5">Or run from the terminal:</p>
			<code class="block text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300">
				npx tsx scripts/test-pipelines.ts{selectedSuite !== 'all' ? ` --suite=${selectedSuite}` : ''}{keepData ? ' --keep' : ''}
			</code>
		</div>
	</Card>

	<!-- Error -->
	{#if runError}
		<div class="flex items-center gap-2 p-4 rounded-xl border border-red-700/50 bg-red-950/30 text-red-300 text-sm">
			<XCircle class="size-5 shrink-0" />
			<div>
				<p class="font-semibold">Test run failed</p>
				<p class="text-xs text-red-400 mt-0.5">{runError}</p>
			</div>
		</div>
	{/if}

	<!-- Results -->
	{#if summary}
		<!-- Summary bar -->
		<div class="rounded-xl border p-5
		            {allPassed
		              ? 'bg-emerald-950/30 border-emerald-700/50'
		              : 'bg-red-950/30 border-red-700/50'}">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					{#if allPassed}
						<CheckCircle2 class="size-6 text-emerald-400 shrink-0" />
						<div>
							<p class="font-bold text-emerald-300">All {summary.total} tests passed</p>
							<p class="text-xs text-emerald-600 mt-0.5">
								Ran at {summary.ranAt} · {summary.totalMs}ms total
								{#if summary.kept} · test data kept{/if}
							</p>
						</div>
					{:else}
						<XCircle class="size-6 text-red-400 shrink-0" />
						<div>
							<p class="font-bold text-red-300">{summary.failed} of {summary.total} tests failed</p>
							<p class="text-xs text-red-600 mt-0.5">
								{summary.passed} passed · Ran at {summary.ranAt} · {summary.totalMs}ms total
							</p>
						</div>
					{/if}
				</div>

				<!-- Progress bar -->
				<div class="w-32 shrink-0">
					<div class="h-2 rounded-full bg-slate-700 overflow-hidden">
						<div class="h-full rounded-full transition-all duration-500
						            {allPassed ? 'bg-emerald-500' : 'bg-red-500'}"
						     style="width: {summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0}%">
						</div>
					</div>
					<p class="text-[10px] text-slate-500 mt-1 text-right">
						{summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0}%
					</p>
				</div>
			</div>
		</div>

		<!-- Per-suite breakdown -->
		<div class="space-y-2">
			{#each suiteGroups() as group}
				{@const allSuitePassed = group.failed === 0}
				<Card class="overflow-hidden border-slate-700 bg-slate-800/40">
					<!-- Suite header -->
					<button
						onclick={() => toggleSuite(group.suite)}
						class="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/40 transition-colors text-left"
					>
						<div class="flex items-center gap-3">
							{#if allSuitePassed}
								<CheckCircle2 class="size-4 text-emerald-400 shrink-0" />
							{:else}
								<XCircle class="size-4 text-red-400 shrink-0" />
							{/if}
							<span class="text-sm font-semibold text-slate-100">{group.suite}</span>
							<span class="text-xs text-slate-500">
								{group.passed}/{group.tests.length} passed
							</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-xs text-slate-500">
								{group.tests.reduce((s, t) => s + t.durationMs, 0)}ms
							</span>
							{#if expandedSuites.has(group.suite)}
								<ChevronUp class="size-4 text-slate-500" />
							{:else}
								<ChevronDown class="size-4 text-slate-500" />
							{/if}
						</div>
					</button>

					<!-- Test rows -->
					{#if expandedSuites.has(group.suite)}
						<div class="border-t border-slate-700 divide-y divide-slate-700/50">
							{#each group.tests as test}
								<div class="flex items-start gap-3 px-4 py-2.5
								            {test.passed ? '' : 'bg-red-950/20'}">
									{#if test.passed}
										<CheckCircle2 class="size-4 text-emerald-400 shrink-0 mt-0.5" />
									{:else}
										<XCircle class="size-4 text-red-400 shrink-0 mt-0.5" />
									{/if}
									<div class="flex-1 min-w-0">
										<p class="text-sm {test.passed ? 'text-slate-300' : 'text-red-300'} leading-snug">
											{test.name}
										</p>
										{#if test.error}
											<p class="text-xs text-red-500 mt-0.5 font-mono leading-snug">{test.error}</p>
										{/if}
									</div>
									<span class="text-[10px] text-slate-600 shrink-0 mt-0.5 whitespace-nowrap">
										{test.durationMs}ms
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</Card>
			{/each}
		</div>

		<!-- Re-run button -->
		<div class="flex justify-end">
			<Button onclick={runTests} disabled={running} variant="outline"
				class="gap-2 border-slate-600 text-slate-300">
				<RotateCcw class="size-4 {running ? 'animate-spin' : ''}" />
				{running ? 'Running…' : 'Re-run'}
			</Button>
		</div>
	{/if}

	<!-- What to delete note -->
	<Card class="p-4 bg-slate-800/20 border-slate-700/50">
		<p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">When to delete this</p>
		<ul class="text-xs text-slate-500 space-y-1 list-disc list-inside">
			<li>All tests pass consistently across multiple runs</li>
			<li>The team has manually verified each pipeline in the UI</li>
			<li>No open bugs or edge cases remain in the pipeline features</li>
		</ul>
		<p class="text-xs text-slate-600 mt-3">
			Files to delete:
			<code class="font-mono text-slate-500">src/routes/dashboard/pipeline-tests/</code>,
			<code class="font-mono text-slate-500">src/routes/api/pipeline-tests/</code>,
			<code class="font-mono text-slate-500">scripts/test-pipelines.ts</code>,
			and the sidebar link in <code class="font-mono text-slate-500">flihub-sidebar.svelte</code>.
		</p>
	</Card>

</div>
