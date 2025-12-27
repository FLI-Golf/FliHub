<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { parseTasksCSV, taskCSVToRecord, parseBroadcastPartnersCSV, broadcastPartnerCSVToRecord } from '$lib/utils/csv-import';

	let tasksFile: FileList | null = $state(null);
	let partnersFile: FileList | null = $state(null);
	let importing = $state(false);
	let submitting = $state(false);
	let importingPartners = $state(false);
	let submittingPartners = $state(false);
	let result = $state<string>('');
	let partnersResult = $state<string>('');
	let parsedTasks = $state<any[]>([]);
	let parsedPartners = $state<any[]>([]);

	async function previewTasks() {
		if (!tasksFile || tasksFile.length === 0) return;

		importing = true;
		result = '';
		parsedTasks = [];

		try {
			const text = await tasksFile[0].text();
			const rows = parseTasksCSV(text);
			parsedTasks = rows.map(row => taskCSVToRecord(row));
			
			console.log('Parsed tasks count:', parsedTasks.length);
			
			result = `Parsed ${rows.length} tasks:\n\n`;
			parsedTasks.slice(0, 10).forEach(task => {
				result += `- ${task.task} (${task.status})\n`;
			});

			if (rows.length > 10) {
				result += `\n... and ${rows.length - 10} more\n`;
			}

			result += '\n✅ Ready to import to PocketBase';
		} catch (error) {
			console.error('Preview error:', error);
			parsedTasks = [];
			result = `❌ Error: ${error}`;
		} finally {
			importing = false;
		}
	}

	async function submitImport() {
		if (parsedTasks.length === 0) return;

		submitting = true;

		try {
			const response = await fetch('/api/tasks/bulk-import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tasks: parsedTasks })
			});

			const data = await response.json();

			if (response.ok) {
				result = `✅ Successfully imported ${data.imported} tasks!\n\n`;
				if (data.duplicates > 0) {
					result += `⚠️ Skipped ${data.duplicates} duplicate tasks\n`;
				}
				if (data.skipped > 0) {
					result += `❌ Failed to import ${data.skipped} tasks\n`;
				}
				if (data.errors && data.errors.length > 0) {
					result += `\nErrors:\n`;
					data.errors.forEach((err: string) => {
						result += `  - ${err}\n`;
					});
				}
				parsedTasks = [];
				tasksFile = null;
			} else {
				result = `❌ Import failed: ${data.error}`;
				if (data.details) {
					result += `\n\nDetails: ${data.details}`;
				}
			}
		} catch (error) {
			result = `❌ Error: ${error}`;
		} finally {
			submitting = false;
		}
	}

	async function previewPartners() {
		if (!partnersFile || partnersFile.length === 0) return;

		importingPartners = true;
		partnersResult = '';
		parsedPartners = [];

		try {
			const text = await partnersFile[0].text();
			const rows = parseBroadcastPartnersCSV(text);
			parsedPartners = rows.map(row => broadcastPartnerCSVToRecord(row));
			
			console.log('Parsed broadcast partners count:', parsedPartners.length);
			
			partnersResult = `Parsed ${rows.length} broadcast partners:\n\n`;
			parsedPartners.slice(0, 10).forEach(partner => {
				partnersResult += `- ${partner.point} (${partner.type})\n`;
			});

			if (rows.length > 10) {
				partnersResult += `\n... and ${rows.length - 10} more\n`;
			}

			partnersResult += '\n✅ Ready to import to PocketBase';
		} catch (error) {
			console.error('Preview error:', error);
			parsedPartners = [];
			partnersResult = `❌ Error: ${error}`;
		} finally {
			importingPartners = false;
		}
	}

	async function submitPartnersImport() {
		if (parsedPartners.length === 0) return;

		submittingPartners = true;

		try {
			const response = await fetch('/api/broadcast-partners/bulk-import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ partners: parsedPartners })
			});

			const data = await response.json();

			if (response.ok) {
				partnersResult = `✅ Successfully imported ${data.imported} broadcast partners!\n\n`;
				if (data.duplicates > 0) {
					partnersResult += `⚠️ Skipped ${data.duplicates} duplicate partners\n`;
				}
				if (data.skipped > 0) {
					partnersResult += `❌ Failed to import ${data.skipped} partners\n`;
				}
				if (data.errors && data.errors.length > 0) {
					partnersResult += `\nErrors:\n`;
					data.errors.forEach((err: string) => {
						partnersResult += `  - ${err}\n`;
					});
				}
				parsedPartners = [];
				partnersFile = null;
			} else {
				partnersResult = `❌ Import failed: ${data.error}`;
				if (data.details) {
					partnersResult += `\n\nDetails: ${data.details}`;
				}
			}
		} catch (error) {
			partnersResult = `❌ Error: ${error}`;
		} finally {
			submittingPartners = false;
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
				
				<Button onclick={previewTasks} disabled={!tasksFile || importing}>
					{importing ? 'Processing...' : 'Preview Tasks'}
				</Button>
			</div>
		</Card>

		{#if result}
			<Card class="p-6">
				<h2 class="text-xl font-semibold mb-4">Preview</h2>
				<pre class="text-sm bg-slate-100 p-4 rounded-md overflow-auto whitespace-pre-wrap">{result}</pre>
				
				{#if parsedTasks.length > 0 && !result.includes('❌')}
					<div class="mt-4 flex gap-2">
						<Button onclick={submitImport} disabled={submitting} class="bg-primary">
							{submitting ? 'Importing...' : 'Import to PocketBase'}
						</Button>
						<Button onclick={() => { parsedTasks = []; result = ''; tasksFile = null; }} variant="outline">
							Clear
						</Button>
					</div>
				{/if}
			</Card>
		{/if}

		<Card class="p-6">
			<h2 class="text-xl font-semibold mb-4">Import Broadcast Partners</h2>
			<p class="text-slate-600 mb-4">Upload the FanNetApp_broadcast_partner.csv file to preview the data.</p>
			
			<div class="space-y-4">
				<input
					type="file"
					accept=".csv"
					bind:files={partnersFile}
					class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
				/>
				
				<Button onclick={previewPartners} disabled={!partnersFile || importingPartners}>
					{importingPartners ? 'Processing...' : 'Preview Broadcast Partners'}
				</Button>
			</div>
		</Card>

		{#if partnersResult}
			<Card class="p-6">
				<h2 class="text-xl font-semibold mb-4">Broadcast Partners Preview</h2>
				<pre class="text-sm bg-slate-100 p-4 rounded-md overflow-auto whitespace-pre-wrap">{partnersResult}</pre>
				
				{#if parsedPartners.length > 0 && !partnersResult.includes('❌')}
					<div class="mt-4 flex gap-2">
						<Button onclick={submitPartnersImport} disabled={submittingPartners} class="bg-primary">
							{submittingPartners ? 'Importing...' : 'Import to PocketBase'}
						</Button>
						<Button onclick={() => { parsedPartners = []; partnersResult = ''; partnersFile = null; }} variant="outline">
							Clear
						</Button>
					</div>
				{/if}
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
