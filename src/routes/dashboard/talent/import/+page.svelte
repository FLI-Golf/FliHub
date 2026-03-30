<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Upload, Download, CheckCircle2, AlertCircle, X } from 'lucide-svelte';

	// ── state ────────────────────────────────────────────────────────────────
	let fileInput: HTMLInputElement;
	let dragOver    = $state(false);
	let fileName    = $state('');
	let rows        = $state<Record<string, string>[]>([]);
	let parseError  = $state('');
	let importing   = $state(false);
	let result      = $state<{ created: number; failed: number; errors: string[] } | null>(null);
	let pasteText   = $state('');

	function handlePaste() {
		if (!pasteText.trim()) return;
		fileName   = 'pasted data';
		parseError = '';
		rows       = [];
		result     = null;
		try { rows = parseCSV(pasteText); }
		catch (err: any) { parseError = err.message; }
	}

	// ── CSV columns ──────────────────────────────────────────────────────────
	const REQUIRED = ['name'];
	const OPTIONAL = ['nickname','email','phone','gender','country','talentType','status','bio','height','weight','homeTown'];
	const ALL_COLS  = [...REQUIRED, ...OPTIONAL];

	const SAMPLE_ROWS = [
		['name','nickname','email','phone','gender','country','talentType','status','bio','height','weight','homeTown'],
		['Jordan Smith','The Shark','jordan@example.com','+1 555 100 0001','male','USA','player','active','Two-time FLI champion','6\'1"','185 lbs','Atlanta, GA'],
		['Taylor Brooks','T-Brooks','taylor@example.com','+1 555 100 0002','female','Canada','player,ambassador','active','Rising star on the women\'s tour','5\'7"','140 lbs','Toronto, ON'],
		['Casey Rivera','','casey@example.com','','','Mexico','coach','active','Head coach with 10 years experience','','','Mexico City'],
	];

	// ── helpers ──────────────────────────────────────────────────────────────
	function downloadSample() {
		const csv = SAMPLE_ROWS.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = 'talent_import_sample.csv';
		a.click();
	}

	function parseCSV(text: string): Record<string, string>[] {
		const lines = text.trim().split(/\r?\n/);
		if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

		// Simple CSV parser — handles quoted fields
		function parseLine(line: string): string[] {
			const fields: string[] = [];
			let cur = '', inQ = false;
			for (let i = 0; i < line.length; i++) {
				const ch = line[i];
				if (ch === '"') {
					if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
					else inQ = !inQ;
				} else if (ch === ',' && !inQ) {
					fields.push(cur.trim()); cur = '';
				} else {
					cur += ch;
				}
			}
			fields.push(cur.trim());
			return fields;
		}

		const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''));
		const missing = REQUIRED.filter(r => !headers.includes(r.toLowerCase()));
		if (missing.length) throw new Error(`Missing required column(s): ${missing.join(', ')}`);

		return lines.slice(1).filter(l => l.trim()).map(line => {
			const vals = parseLine(line);
			const obj: Record<string, string> = {};
			headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
			return obj;
		});
	}

	function handleFile(file: File) {
		if (!file.name.endsWith('.csv')) { parseError = 'Please upload a .csv file'; return; }
		fileName   = file.name;
		parseError = '';
		rows       = [];
		result     = null;
		const reader = new FileReader();
		reader.onload = e => {
			try { rows = parseCSV(e.target!.result as string); }
			catch (err: any) { parseError = err.message; }
		};
		reader.readAsText(file);
	}

	function onFileChange(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (f) handleFile(f);
	}

	function onDrop(e: DragEvent) {
		e.preventDefault(); dragOver = false;
		const f = e.dataTransfer?.files?.[0];
		if (f) handleFile(f);
	}

	function clearFile() {
		rows = []; fileName = ''; parseError = ''; result = null; pasteText = '';
		if (fileInput) fileInput.value = '';
	}

	async function runImport() {
		if (!rows.length) return;
		importing = true; result = null;
		try {
			const res = await fetch('/api/talent/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ rows })
			});
			result = await res.json();
		} catch (err: any) {
			result = { created: 0, failed: rows.length, errors: [err.message] };
		} finally {
			importing = false;
		}
	}
</script>

<div class="max-w-3xl mx-auto space-y-6">

	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button href="/dashboard/talent" variant="outline" size="sm" class="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5">
			<ArrowLeft class="size-4" /> Back
		</Button>
		<div>
			<h1 class="text-2xl font-bold text-slate-100">Bulk Import Talent</h1>
			<p class="text-sm text-slate-400">Upload a CSV to create multiple talent profiles at once</p>
		</div>
	</div>

	<!-- Sample download -->
	<div class="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-5 py-4">
		<div>
			<p class="text-sm font-semibold text-slate-100">Download sample CSV</p>
			<p class="text-xs text-slate-400 mt-0.5">Use this template to format your data correctly</p>
		</div>
		<Button onclick={downloadSample} variant="outline" size="sm" class="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2">
			<Download class="size-4" /> Download
		</Button>
	</div>

	<!-- Column reference -->
	<div class="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3">
		<h2 class="text-sm font-semibold text-slate-300">CSV Columns</h2>
		<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
			{#each ALL_COLS as col}
				<div class="flex items-center gap-2">
					<span class="size-1.5 rounded-full {REQUIRED.includes(col) ? 'bg-emerald-400' : 'bg-slate-600'}"></span>
					<code class="text-xs text-slate-300">{col}</code>
					{#if REQUIRED.includes(col)}
						<span class="text-[10px] text-emerald-400">required</span>
					{/if}
				</div>
			{/each}
		</div>
		<p class="text-xs text-slate-500">
			<code>talentType</code> accepts comma-separated values: <code>player</code>, <code>coach</code>, <code>caddie</code>, <code>ambassador</code><br/>
			<code>gender</code>: <code>male</code> | <code>female</code> | <code>other</code> &nbsp;·&nbsp;
			<code>status</code>: <code>active</code> | <code>inactive</code> | <code>suspended</code> (default: <code>active</code>)
		</p>
	</div>

	<!-- Drop zone -->
	{#if !rows.length}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="rounded-xl border-2 border-dashed {dragOver ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-600 bg-slate-900'} transition-colors cursor-pointer p-10 text-center"
			ondragover={(e) => { e.preventDefault(); dragOver = true; }}
			ondragleave={() => dragOver = false}
			ondrop={onDrop}
			onclick={() => fileInput.click()}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
		>
			<Upload class="size-10 mx-auto mb-3 {dragOver ? 'text-emerald-400' : 'text-slate-500'}" />
			<p class="text-sm font-medium text-slate-300">Drop your CSV here or <span class="text-emerald-400 underline">browse</span></p>
			<p class="text-xs text-slate-500 mt-1">.csv files only</p>
			<input bind:this={fileInput} type="file" accept=".csv" class="hidden" onchange={onFileChange} />
		</div>
	{/if}

	<!-- Paste CSV -->
	{#if !rows.length}
		<div class="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-2">
			<label for="csv-paste" class="block text-xs font-medium text-slate-400">Or paste CSV data directly</label>
			<textarea
				id="csv-paste"
				bind:value={pasteText}
				rows="5"
				placeholder="name,nickname,email,phone,gender,country,talentType,status&#10;Jordan Smith,The Shark,jordan@example.com,+1 555 100 0001,male,USA,player,active"
				class="w-full rounded-lg border border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-600 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
			></textarea>
			<div class="flex justify-end">
				<Button onclick={handlePaste} disabled={!pasteText.trim()} variant="outline" size="sm" class="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5">
					<Upload class="size-3.5" /> Parse CSV
				</Button>
			</div>
		</div>
	{/if}

	{#if parseError}
		<div class="flex items-center gap-3 rounded-xl border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">
			<AlertCircle class="size-4 shrink-0" />
			{parseError}
		</div>
	{/if}

	<!-- Preview table -->
	{#if rows.length}
		<div class="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
			<div class="flex items-center justify-between px-5 py-3 border-b border-slate-700">
				<p class="text-sm font-semibold text-slate-100">{rows.length} row{rows.length !== 1 ? 's' : ''} ready — <span class="text-slate-400 font-normal">{fileName}</span></p>
				<button onclick={clearFile} class="text-slate-500 hover:text-slate-300 transition-colors">
					<X class="size-4" />
				</button>
			</div>
			<div class="overflow-x-auto max-h-72">
				<table class="w-full text-xs">
					<thead class="bg-slate-800 sticky top-0">
						<tr>
							{#each Object.keys(rows[0]) as col}
								<th class="px-3 py-2 text-left text-slate-400 font-medium whitespace-nowrap">{col}</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-800">
						{#each rows.slice(0, 50) as row, i}
							<tr class="{i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/50'}">
								{#each Object.values(row) as val}
									<td class="px-3 py-1.5 text-slate-300 whitespace-nowrap max-w-[160px] truncate">{val || '—'}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if rows.length > 50}
				<p class="px-5 py-2 text-xs text-slate-500 border-t border-slate-700">Showing first 50 of {rows.length} rows</p>
			{/if}
		</div>

		<div class="flex justify-end gap-3">
			<Button onclick={clearFile} variant="outline" class="border-slate-600 text-slate-300 hover:bg-slate-700">Clear</Button>
			<Button onclick={runImport} disabled={importing} class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-32">
				<Upload class="size-4" />
				{importing ? 'Importing…' : `Import ${rows.length} records`}
			</Button>
		</div>
	{/if}

	<!-- Result -->
	{#if result}
		<div class="rounded-xl border {result.failed === 0 ? 'border-emerald-700 bg-emerald-900/20' : 'border-yellow-700 bg-yellow-900/20'} p-5 space-y-3">
			<div class="flex items-center gap-3">
				{#if result.failed === 0}
					<CheckCircle2 class="size-5 text-emerald-400 shrink-0" />
					<p class="font-semibold text-emerald-300">Import complete — {result.created} talent profile{result.created !== 1 ? 's' : ''} created</p>
				{:else}
					<AlertCircle class="size-5 text-yellow-400 shrink-0" />
					<p class="font-semibold text-yellow-300">{result.created} created, {result.failed} failed</p>
				{/if}
			</div>
			{#if result.errors.length}
				<ul class="space-y-1 pl-8">
					{#each result.errors as err}
						<li class="text-xs text-red-300">• {err}</li>
					{/each}
				</ul>
			{/if}
			{#if result.created > 0}
				<Button href="/dashboard/talent" size="sm" class="bg-emerald-600 hover:bg-emerald-700 text-white">View Talent</Button>
			{/if}
		</div>
	{/if}

</div>
