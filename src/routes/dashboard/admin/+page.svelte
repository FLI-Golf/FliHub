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
	<div class="bg-white rounded-lg shadow p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Current Database State</h2>
		
		<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
			<div class="bg-gray-50 p-4 rounded">
				<div class="text-sm text-gray-600">Departments</div>
				<div class="text-2xl font-bold">{dataStatus.counts.departments}</div>
			</div>
			<div class="bg-gray-50 p-4 rounded">
				<div class="text-sm text-gray-600">Projects</div>
				<div class="text-2xl font-bold">{dataStatus.counts.projects}</div>
			</div>
			<div class="bg-gray-50 p-4 rounded">
				<div class="text-sm text-gray-600">Tasks</div>
				<div class="text-2xl font-bold">{dataStatus.counts.tasks}</div>
			</div>
			<div class="bg-gray-50 p-4 rounded">
				<div class="text-sm text-gray-600">Expenses</div>
				<div class="text-2xl font-bold text-blue-600">{dataStatus.counts.expenses}</div>
			</div>
			<div class="bg-gray-50 p-4 rounded">
				<div class="text-sm text-gray-600">Vendors</div>
				<div class="text-2xl font-bold text-blue-600">{dataStatus.counts.vendors}</div>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<span class="text-sm font-medium">Mode:</span>
			<span class="px-3 py-1 rounded-full text-sm font-medium {
				dataStatus.mode === 'blueprint' ? 'bg-gray-200 text-gray-800' :
				dataStatus.mode === 'testing' ? 'bg-blue-200 text-blue-800' :
				'bg-green-200 text-green-800'
			}">
				{dataStatus.mode.toUpperCase()}
			</span>
		</div>
	</div>

	<!-- Generate Seed Data -->
	<div class="bg-white rounded-lg shadow p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Generate Test Data</h2>
		
		<div class="mb-4">
			<label class="block text-sm font-medium mb-2">Scenario</label>
			<select 
				bind:value={selectedScenario}
				class="w-full px-3 py-2 border rounded-lg"
				disabled={loading}
			>
				<option value="quick">Quick Test (10 expenses, 3 vendors)</option>
				<option value="full">Full Test (50 expenses, 10 vendors)</option>
			</select>
		</div>

		<button
			onclick={generateSeedData}
			disabled={loading}
			class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
		>
			{loading ? 'Generating...' : 'Generate Seed Data'}
		</button>

		<p class="text-sm text-gray-600 mt-2">
			This will create realistic test expenses and vendors for testing workflows.
		</p>
	</div>

	<!-- Reset Data -->
	<div class="bg-white rounded-lg shadow p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Reset Test Data</h2>
		
		{#if !showResetConfirm}
			<button
				onclick={() => showResetConfirm = true}
				disabled={loading || !dataStatus.hasTestData}
				class="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
			>
				Reset Test Data
			</button>
			
			{#if !dataStatus.hasTestData}
				<p class="text-sm text-gray-600 mt-2">
					No test data to reset.
				</p>
			{/if}
		{:else}
			<div class="border-2 border-red-300 rounded-lg p-4 mb-4">
				<p class="text-red-600 font-semibold mb-2">⚠️ Warning</p>
				<p class="text-sm text-gray-700 mb-4">
					This will delete all expenses and vendors. Blueprint data (departments, projects, tasks) will be preserved.
				</p>
				
				<label class="block text-sm font-medium mb-2">
					Type <span class="font-mono font-bold">CONFIRM</span> to proceed:
				</label>
				<input
					type="text"
					bind:value={confirmText}
					placeholder="CONFIRM"
					class="w-full px-3 py-2 border rounded-lg mb-4"
					disabled={loading}
				/>

				<div class="flex gap-2">
					<button
						onclick={resetData}
						disabled={loading || confirmText !== 'CONFIRM'}
						class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{loading ? 'Resetting...' : 'Confirm Reset'}
					</button>
					<button
						onclick={() => { showResetConfirm = false; confirmText = ''; }}
						disabled={loading}
						class="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
					>
						Cancel
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Message Display -->
	{#if message}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
			<p class="text-sm">{message}</p>
		</div>
	{/if}

	<!-- Info -->
	<div class="bg-gray-50 rounded-lg p-6">
		<h3 class="font-semibold mb-2">About Data Management</h3>
		<ul class="text-sm text-gray-700 space-y-1">
			<li>• <strong>Blueprint Mode:</strong> Planning data (Phases 1-3 structure)</li>
			<li>• <strong>Testing Mode:</strong> Blueprint + test expenses/vendors</li>
			<li>• <strong>Production Mode:</strong> Real operational data</li>
		</ul>
		
		<div class="mt-4 pt-4 border-t">
			<p class="text-sm text-gray-600">
				<strong>Note:</strong> This is for testing only. Before going live, reset all test data and switch to Production mode.
			</p>
		</div>
	</div>
</div>
