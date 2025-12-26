<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { parseTasksCSV, taskCSVToRecord } from '$lib/utils/csv-import';

	let tasksFile: FileList | null = $state(null);
	let importing = $state(false);
	let result = $state<string>('');

	async function importTasks() {
		if (!tasksFile || tasksFile.length === 0) return;

		importing = true;
		result = '';

		try {
			const text = await tasksFile[0].text();
			const rows = parseTasksCSV(text);
			
			result = `Parsed ${rows.length} tasks:\n\n`;
			rows.slice(0, 10).forEach(row => {
				const record = taskCSVToRecord(row);
				result += `- ${record.task} (${record.status})\n`;
			});

			if (rows.length > 10) {
				result += `\n... and ${rows.length - 10} more\n`;
			}

			result += '\n✅ Ready to import to PocketBase';
		} catch (error) {
			result = `❌ Error: ${error}`;
		} finally {
			importing = false;
		}
	}
</script>

<svelte:head>
	<title>Import Data - FliHub</title>
</svelte:head>

<div class="max-w-4xl">
	<h1 class="text-3xl font-bold mb-6">Import CSV Data</h1>

	<div class="space-y-6">
		<Card class="p-6 bg-muted/50">
			<h2 class="text-xl font-semibold mb-4">Import Managers</h2>
			<p class="text-muted-foreground mb-2">Managers are now imported as user accounts with profiles.</p>
			<p class="text-sm text-muted-foreground">All managers from Managers.csv have been imported as users with role='leader'. View them in the <a href="/dashboard/managers" class="text-primary hover:underline">Managers</a> section.</p>
		</Card>

		<Card class="p-6">
			<h2 class="text-xl font-semibold mb-4">Import Tasks</h2>
			<p class="text-slate-600 mb-4">Upload the Business Roadmap.csv file to preview the data.</p>
			
			<div class="space-y-4">
				<input
					type="file"
					accept=".csv"
					bind:files={tasksFile}
					class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
				/>
				
				<Button onclick={importTasks} disabled={!tasksFile || importing}>
					{importing ? 'Processing...' : 'Preview Tasks'}
				</Button>
			</div>
		</Card>

		{#if result}
			<Card class="p-6">
				<h2 class="text-xl font-semibold mb-4">Preview</h2>
				<pre class="text-sm bg-slate-100 p-4 rounded-md overflow-auto whitespace-pre-wrap">{result}</pre>
			</Card>
		{/if}

		<Card class="p-6 bg-blue-50">
			<h3 class="font-semibold mb-2">📝 Note</h3>
			<p class="text-sm text-slate-700">
				This preview tool parses your CSV files and shows what will be imported. 
				To actually import the data into PocketBase, you'll need to:
			</p>
			<ol class="list-decimal list-inside text-sm text-slate-700 mt-2 space-y-1">
				<li>Set up your PocketBase instance</li>
				<li>Import the collection schemas from <code class="bg-white px-1 rounded">pocketbase-schema.json</code></li>
				<li>Use the PocketBase admin panel to import CSV data, or</li>
				<li>Use the API endpoints (coming soon) to bulk import</li>
			</ol>
		</Card>
	</div>
</div>
