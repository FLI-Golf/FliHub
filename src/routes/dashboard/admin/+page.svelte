<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	let dataStatus = $state({
		mode: 'blueprint',
		counts: {
			departments: 0,
			projects: 0,
			tasks: 0,
			expenses: 0,
			vendors: 0
		},
		hasTestData: false,
		hasBlueprint: false
	});

	let loading = $state(false);
	let message = $state('');
	let selectedScenario = $state('quick');
	let confirmText = $state('');
	let showResetConfirm = $state(false);

	// Zero actual spend
	let zeroLoading = $state(false);
	let showZeroConfirm = $state(false);

	// Seed approvals
	let seedCount = $state('10');
	let seedLoading = $state(false);

	onMount(async () => {
		await loadStatus();
	});

	async function loadStatus() {
		try {
			const response = await fetch('/api/admin/data-status');
			if (response.ok) {
				dataStatus = await response.json();
			}
		} catch (error) {
			console.error('Failed to load status:', error);
		}
	}

	async function generateSeedData() {
		loading = true;
		message = '';

		try {
			const response = await fetch('/api/admin/seed-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scenario: selectedScenario })
			});

			const result = await response.json();

			if (response.ok) {
				message = `✅ Created ${result.created.vendors} vendors and ${result.created.expenses} expenses`;
				await loadStatus();
				await invalidateAll();
			} else {
				message = `❌ Error: ${result.error}`;
			}
		} catch (error: any) {
			message = `❌ Error: ${error.message}`;
		} finally {
			loading = false;
		}
	}

	async function zeroActualSpend() {
		zeroLoading = true;
		message = '';
		try {
			const res = await fetch('/api/approvals/test-data', { method: 'DELETE' });
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
			const d = body.deleted ?? {};
			message = `✅ Zeroed actual spend — cleared ${d.projects_cleared ?? 0} projects, ${d.work_orders ?? 0} work orders, ${d.approvals ?? 0} approvals, ${d.expenses ?? 0} expenses`;
			showZeroConfirm = false;
			await loadStatus();
			await invalidateAll();
		} catch (err: any) {
			message = `❌ Error: ${err.message}`;
		} finally {
			zeroLoading = false;
		}
	}

	async function seedApprovals() {
		seedLoading = true;
		message = '';
		try {
			const res = await fetch('/api/approvals/test-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ count: parseInt(seedCount) || 10 }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(body.message ?? `Error ${res.status}`);
			message = `✅ Created ${body.created ?? 0} test approvals`;
			await loadStatus();
			await invalidateAll();
		} catch (err: any) {
			message = `❌ Error: ${err.message}`;
		} finally {
			seedLoading = false;
		}
	}

	async function resetData() {
		if (confirmText !== 'CONFIRM') {
			message = '❌ Please type CONFIRM to proceed';
			return;
		}

		loading = true;
		message = '';

		try {
			const response = await fetch('/api/admin/reset-data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					deleteExpenses: true,
					deleteVendors: true,
					confirmation: 'CONFIRM'
				})
			});

			const result = await response.json();

			if (response.ok) {
				message = `✅ Deleted ${result.deleted.expenses || 0} expenses and ${result.deleted.vendors || 0} vendors`;
				confirmText = '';
				showResetConfirm = false;
				await loadStatus();
				await invalidateAll();
			} else {
				message = `❌ Error: ${result.error}`;
			}
		} catch (error: any) {
			message = `❌ Error: ${error.message}`;
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto p-6 max-w-4xl">
	<h1 class="text-3xl font-bold mb-6">Data Management</h1>

	<!-- Current Status -->
	<div class="bg-card text-card-foreground rounded-lg border shadow-sm p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Current Database State</h2>

		<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
			{#each [
				{ label: 'Departments', value: dataStatus.counts.departments, accent: false },
				{ label: 'Projects',    value: dataStatus.counts.projects,    accent: false },
				{ label: 'Tasks',       value: dataStatus.counts.tasks,       accent: false },
				{ label: 'Expenses',    value: dataStatus.counts.expenses,    accent: true  },
				{ label: 'Vendors',     value: dataStatus.counts.vendors,     accent: true  },
			] as stat}
				<div class="bg-muted rounded-lg p-4">
					<div class="text-sm text-muted-foreground">{stat.label}</div>
					<div class="text-2xl font-bold {stat.accent ? 'text-primary' : ''}">{stat.value}</div>
				</div>
			{/each}
		</div>

		<div class="flex items-center gap-2">
			<span class="text-sm font-medium">Mode:</span>
			<span class="px-3 py-1 rounded-full text-sm font-medium {
				dataStatus.mode === 'blueprint' ? 'bg-muted text-muted-foreground' :
				dataStatus.mode === 'testing'   ? 'bg-blue-500/20 text-blue-400' :
				'bg-emerald-500/20 text-emerald-400'
			}">
				{dataStatus.mode.toUpperCase()}
			</span>
		</div>
	</div>

	<!-- Generate Seed Data -->
	<div class="bg-card text-card-foreground rounded-lg border shadow-sm p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Generate Test Data</h2>

		<div class="mb-4">
			<label class="block text-sm font-medium mb-2">Scenario</label>
			<select
				bind:value={selectedScenario}
				class="w-full px-3 py-2 border border-input bg-zinc-900 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
				disabled={loading}
			>
				<option value="quick">Quick Test (10 expenses, 3 vendors)</option>
				<option value="full">Full Test (50 expenses, 10 vendors)</option>
			</select>
		</div>

		<button
			onclick={generateSeedData}
			disabled={loading}
			class="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{loading ? 'Generating...' : 'Generate Seed Data'}
		</button>

		<p class="text-sm text-muted-foreground mt-2">
			Creates realistic test expenses and vendors for workflow testing.
		</p>
	</div>

	<!-- Zero Actual Spend -->
	<div class="bg-card text-card-foreground rounded-lg border border-amber-700/40 shadow-sm p-6 mb-6">
		<h2 class="text-xl font-semibold mb-1">Zero Actual Spend</h2>
		<p class="text-sm text-muted-foreground mb-4">
			Resets <code class="text-xs bg-muted px-1 py-0.5 rounded">project_actual_expenses</code> to zero on all projects and clears all approvals, expenses, and work orders. Use this after testing to restore a clean baseline without touching budgets or forecasts.
		</p>

		{#if !showZeroConfirm}
			<button
				onclick={() => showZeroConfirm = true}
				disabled={zeroLoading}
				class="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Zero All Actual Spend
			</button>
		{:else}
			<div class="border-2 border-amber-600/40 rounded-lg p-4 bg-amber-950/20">
				<p class="text-amber-400 font-semibold mb-2">⚠ This will delete all approvals, expenses, and work orders and zero all project actual spend.</p>
				<div class="flex gap-2 mt-3">
					<button
						onclick={zeroActualSpend}
						disabled={zeroLoading}
						class="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
					>
						{zeroLoading ? 'Clearing…' : 'Confirm — Zero Spend'}
					</button>
					<button
						onclick={() => showZeroConfirm = false}
						disabled={zeroLoading}
						class="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Seed Test Approvals -->
	<div class="bg-card text-card-foreground rounded-lg border shadow-sm p-6 mb-6">
		<h2 class="text-xl font-semibold mb-1">Seed Test Approvals</h2>
		<p class="text-sm text-muted-foreground mb-4">
			Creates realistic test expenses and approval records linked to real tasks. Use this to test the approval workflow without manually creating records.
		</p>
		<div class="flex gap-3 items-end">
			<div class="flex-1">
				<label class="block text-sm font-medium mb-1">Number of approvals</label>
				<input
					type="number"
					bind:value={seedCount}
					min="1"
					max="100"
					class="w-full px-3 py-2 border border-input bg-zinc-900 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
					disabled={seedLoading}
				/>
			</div>
			<button
				onclick={seedApprovals}
				disabled={seedLoading}
				class="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
			>
				{seedLoading ? 'Seeding…' : 'Seed Approvals'}
			</button>
		</div>
		<p class="text-xs text-muted-foreground mt-2">Run "Zero Actual Spend" afterwards to clean up.</p>
	</div>

	<!-- Reset Data -->
	<div class="bg-card text-card-foreground rounded-lg border shadow-sm p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Reset Test Data</h2>

		{#if !showResetConfirm}
			<button
				onclick={() => showResetConfirm = true}
				disabled={loading || !dataStatus.hasTestData}
				class="w-full bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Reset Test Data
			</button>

			{#if !dataStatus.hasTestData}
				<p class="text-sm text-muted-foreground mt-2">No test data to reset.</p>
			{/if}
		{:else}
			<div class="border-2 border-destructive/40 rounded-lg p-4 mb-4 bg-destructive/5">
				<p class="text-destructive font-semibold mb-2">⚠️ Warning</p>
				<p class="text-sm text-muted-foreground mb-4">
					This will delete all expenses and vendors. Blueprint data (departments, projects, tasks) will be preserved.
				</p>

				<label class="block text-sm font-medium mb-2">
					Type <span class="font-mono font-bold">CONFIRM</span> to proceed:
				</label>
				<input
					type="text"
					bind:value={confirmText}
					placeholder="CONFIRM"
					class="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-ring"
					disabled={loading}
				/>

				<div class="flex gap-2">
					<button
						onclick={resetData}
						disabled={loading || confirmText !== 'CONFIRM'}
						class="flex-1 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{loading ? 'Resetting...' : 'Confirm Reset'}
					</button>
					<button
						onclick={() => { showResetConfirm = false; confirmText = ''; }}
						disabled={loading}
						class="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Message Display -->
	{#if message}
		<div class="bg-muted border border-border rounded-lg p-4 mb-6">
			<p class="text-sm">{message}</p>
		</div>
	{/if}

	<!-- Info -->
	<div class="bg-muted/50 rounded-lg border p-6">
		<h3 class="font-semibold mb-2">About Data Management</h3>
		<ul class="text-sm text-muted-foreground space-y-1">
			<li>• <strong class="text-foreground">Blueprint Mode:</strong> Planning data (Phases 1-3 structure)</li>
			<li>• <strong class="text-foreground">Testing Mode:</strong> Blueprint + test expenses/vendors</li>
			<li>• <strong class="text-foreground">Production Mode:</strong> Real operational data</li>
		</ul>

		<div class="mt-4 pt-4 border-t border-border">
			<p class="text-sm text-muted-foreground">
				<strong class="text-foreground">Note:</strong> Reset all test data before going live.
			</p>
		</div>
	</div>
</div>
