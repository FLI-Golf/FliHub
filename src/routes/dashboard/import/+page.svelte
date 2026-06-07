<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Upload, CheckCircle2, AlertCircle, X, FileText, Copy, Check, Bot, History, ChevronDown, ChevronUp } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ── Import type definitions ───────────────────────────────────────────────
	type ImportType = 'vendors' | 'sponsors' | 'pros' | 'territories' | 'reimbursements';

	const TYPES: { id: ImportType; label: string; description: string; color: string }[] = [
		{ id: 'vendors',        label: 'Vendors',        description: 'Service providers, suppliers, contractors', color: 'bg-blue-950/40 border-blue-700' },
		{ id: 'sponsors',       label: 'Sponsors',       description: 'Corporate sponsors and casino partners',    color: 'bg-emerald-950/40 border-emerald-700' },
		{ id: 'pros',           label: 'Pros',           description: 'Players, coaches, ambassadors',             color: 'bg-violet-950/40 border-violet-700' },
		{ id: 'territories',    label: 'Territories',    description: 'Franchise territory markets',               color: 'bg-yellow-950/40 border-yellow-700' },
		{ id: 'reimbursements', label: 'Reimbursements', description: 'Historical & new expense claims',           color: 'bg-orange-950/40 border-orange-700' }
	];

	// ── AI Prompt tool state ──────────────────────────────────────────────────
	let showAiTool = $state(false);
	let aiPromptCopied = $state(false);

	const deptNames   = $derived(((data.departments   ?? []) as any[]).map((d: any) => d.name).join(' · '));
	const userEmails  = $derived(((data.userProfiles  ?? []) as any[]).map((u: any) => u.email).filter(Boolean).join(', '));
	const vendorNames = $derived(((data.vendors       ?? []) as any[]).map((v: any) => v.name).join(', '));
	const firstUserEmail = $derived(((data.userProfiles ?? []) as any[]).map((u: any) => u.email).find(Boolean) || 'jane@example.com');
	const firstVendorName = $derived(((data.vendors ?? []) as any[]).map((v: any) => v.name).find(Boolean) || '');
	const reimbursementDeptName = $derived(
		(((data.departments ?? []) as any[]).find((d: any) => d.name === 'Tax-Exempt Reimbursements')?.name)
		|| (((data.departments ?? []) as any[]).map((d: any) => d.name).find(Boolean))
		|| 'Tax-Exempt Reimbursements'
	);

	const aiPrompt = $derived(`You are helping me import historical reimbursement records into FliHub, a golf operations management app.

Convert the following expense/reimbursement records into a CSV with EXACTLY these columns (in this order):
claimTitle,claimantEmail,itemDescription,itemAmount,itemDate,itemCategory,vendorName,itemNotes,claimStatus,claimNotes,departmentName,isHistorical

RULES:
- One row per line item (if a claim has 3 receipts, create 3 rows with the same claimTitle and claimantEmail)
- claimantEmail must be one of these exact values: ${userEmails || 'use the person\'s email address'}
- itemAmount: number only, no $ or commas (e.g. 342.50)
- itemDate: YYYY-MM-DD format
- itemCategory: one of → travel · meals · equipment · software · marketing · legal · office · other
- vendorName: optional, match exactly to one of → ${vendorNames || 'vendor name as written'}
- If vendorName is not in the list, leave vendorName blank instead of inventing a new name
- claimStatus: use "paid" for already-reimbursed items, "submitted" for pending
- departmentName: one of → ${deptNames || 'department name'}
- If departmentName is unknown, use "Tax-Exempt Reimbursements"
- isHistorical: true for all records that existed before FliHub was set up, false for new claims
- claimNotes: add "Historical import — pre-FliHub" for historical records
- Wrap all values in double quotes
- Include the header row

Here are the records to convert:
[PASTE YOUR LIST HERE]`);

	async function copyAiPrompt() {
		await navigator.clipboard.writeText(aiPrompt);
		aiPromptCopied = true;
		setTimeout(() => (aiPromptCopied = false), 2500);
	}

	const SCHEMAS: Record<ImportType, { col: string; required: boolean; example: string; note?: string }[]> = {
		reimbursements: [
			{ col: 'claimTitle',       required: true,  example: 'Q1 Travel Expenses' },
			{ col: 'claimantEmail',    required: true,  example: 'jane@example.com',           note: 'Must match a user account' },
			{ col: 'itemDescription',  required: true,  example: 'Flight to Phoenix' },
			{ col: 'itemAmount',       required: true,  example: '342.50',                     note: 'Number, no $ or commas' },
			{ col: 'itemDate',         required: false, example: '2025-03-15',                 note: 'YYYY-MM-DD' },
			{ col: 'itemCategory',     required: false, example: 'travel',                     note: 'travel · meals · equipment · software · marketing · legal · office · other' },
			{ col: 'vendorName',       required: false, example: 'Delta Airlines',             note: 'Matched by name in vendors collection' },
			{ col: 'itemNotes',        required: false, example: 'Round trip, economy' },
			{ col: 'claimStatus',      required: false, example: 'paid',                       note: 'draft · submitted · under_review · approved · paid · rejected' },
			{ col: 'claimNotes',       required: false, example: 'Historical import — pre-FliHub' },
			{ col: 'departmentName',   required: false, example: 'Tax-Exempt Reimbursements',  note: 'Matched by name — debits dept budget when paid' },
			{ col: 'isHistorical',     required: false, example: 'true',                       note: 'true for pre-FliHub records, false for new claims' },
		],
		territories: [
			{ col: 'name',        required: true,  example: 'Las Vegas Metro' },
			{ col: 'code',        required: false, example: 'LV-01' },
			{ col: 'state',       required: false, example: 'NV' },
			{ col: 'city',        required: false, example: 'Las Vegas' },
			{ col: 'region',      required: false, example: 'Southwest' },
			{ col: 'population',  required: false, example: '2200000', note: 'Number, no commas' },
			{ col: 'marketSize',  required: false, example: 'large', note: 'small · medium · large · major' },
			{ col: 'status',      required: false, example: 'available', note: 'available · reserved · sold' },
			{ col: 'price',       required: false, example: '250000', note: 'Number, no $ or commas' },
			{ col: 'description', required: false, example: 'Greater Las Vegas area including Henderson' },
			{ col: 'notes',       required: false, example: 'High priority market' }
		],
		vendors: [
			{ col: 'name',         required: true,  example: 'Acme Productions' },
			{ col: 'type',         required: false, example: 'service_provider', note: 'service_provider · equipment · venue · technology · other' },
			{ col: 'contactName',  required: false, example: 'Jane Smith' },
			{ col: 'contactEmail', required: false, example: 'jane@acme.com' },
			{ col: 'contactPhone', required: false, example: '+1 555 000 0001' },
			{ col: 'website',      required: false, example: 'https://acme.com' },
			{ col: 'location',     required: false, example: 'Las Vegas, NV' },
			{ col: 'status',       required: false, example: 'active', note: 'active · inactive' },
			{ col: 'notes',        required: false, example: 'Preferred AV vendor' }
		],
		sponsors: [
			{ col: 'companyName',         required: true,  example: 'MGM Resorts' },
			{ col: 'type',                required: false, example: 'casino', note: 'casino · resort · corporate · media · technology · financial · other' },
			{ col: 'tier',                required: false, example: 'tier_1', note: 'tier_1 · tier_2 · tier_3 · tier_4' },
			{ col: 'status',              required: false, example: 'prospect', note: 'prospect · outreach · negotiating · contracted · active · renewed' },
			{ col: 'primaryContactName',  required: false, example: 'John Doe' },
			{ col: 'primaryContactEmail', required: false, example: 'john@mgm.com' },
			{ col: 'primaryContactPhone', required: false, example: '+1 702 000 0001' },
			{ col: 'location',            required: false, example: 'Las Vegas, NV' },
			{ col: 'territory',           required: false, example: 'Southwest' },
			{ col: 'annualCommitment',    required: false, example: '1000000', note: 'Number, no $ or commas' },
			{ col: 'franchiseInterest',   required: false, example: 'false', note: 'true or false' },
			{ col: 'notes',               required: false, example: 'Met at trade show' }
		],
		pros: [
			{ col: 'name',       required: true,  example: 'Jordan Smith' },
			{ col: 'nickname',   required: false, example: 'The Shark' },
			{ col: 'email',      required: false, example: 'jordan@example.com' },
			{ col: 'phone',      required: false, example: '+1 555 100 0001' },
			{ col: 'gender',     required: false, example: 'male', note: 'male · female · other' },
			{ col: 'country',    required: false, example: 'USA' },
			{ col: 'talentType', required: false, example: 'player', note: 'player · coach · ambassador · caddie' },
			{ col: 'status',     required: false, example: 'active', note: 'active · inactive · prospect' },
			{ col: 'bio',        required: false, example: 'Two-time FLI champion' },
			{ col: 'height',     required: false, example: '6\'1"' },
			{ col: 'weight',     required: false, example: '185 lbs' },
			{ col: 'homeTown',   required: false, example: 'Atlanta, GA' }
		]
	};

	// ── State ─────────────────────────────────────────────────────────────────
	let selectedType = $state<ImportType>('vendors');
	let csvText      = $state('');
	let rows         = $state<Record<string, string>[]>([]);
	let parseError   = $state('');
	let importing    = $state(false);
	let progress     = $state(0);   // 0–100
	let result       = $state<{ created: number; failed: number; errors: string[] } | null>(null);

	const schema = $derived(SCHEMAS[selectedType]);
	const cols   = $derived(schema.map(s => s.col));

	// Sample CSV for the selected type
	const sampleCSV = $derived.by(() => {
		if (selectedType !== 'reimbursements') {
			return cols.join(',') + '\n' + schema.map(s => `"${s.example}"`).join(',');
		}

		const headers = cols.join(',');
		const row = [
			'Q1 Travel Expenses',
			firstUserEmail,
			'Flight to Phoenix',
			'342.50',
			'2025-03-15',
			'travel',
			firstVendorName,
			'Round trip, economy',
			'paid',
			'Historical import — pre-FliHub',
			reimbursementDeptName,
			'true'
		].map(v => `"${v}"`).join(',');

		return `${headers}\n${row}`;
	});

	let copied = $state(false);
	async function copySample() {
		await navigator.clipboard.writeText(sampleCSV);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	// ── CSV parser ────────────────────────────────────────────────────────────
	function parseCSV(text: string): Record<string, string>[] {
		const lines = text.trim().split(/\r?\n/);
		if (lines.length < 2) throw new Error('Need a header row and at least one data row');

		function parseLine(line: string): string[] {
			const fields: string[] = [];
			let cur = '', inQ = false;
			for (let i = 0; i < line.length; i++) {
				const ch = line[i];
				if (ch === '"') {
					if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
					else inQ = !inQ;
				} else if (ch === ',' && !inQ) { fields.push(cur); cur = ''; }
				else cur += ch;
			}
			fields.push(cur);
			return fields;
		}

		const headers = parseLine(lines[0]).map(h => h.trim());
		return lines.slice(1).filter(l => l.trim()).map(line => {
			const vals = parseLine(line);
			const obj: Record<string, string> = {};
			headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim(); });
			return obj;
		});
	}

	function handleParse() {
		parseError = '';
		rows       = [];
		result     = null;
		if (!csvText.trim()) return;
		try { rows = parseCSV(csvText); }
		catch (err: any) { parseError = err.message; }
	}

	function clearAll() {
		csvText = ''; rows = []; parseError = ''; result = null; progress = 0;
	}

	// ── Import in batches with progress ───────────────────────────────────────
	async function runImport() {
		if (!rows.length) return;
		importing = true;
		progress  = 0;
		result    = null;

		const BATCH = 10;
		let created = 0, failed = 0;
		const errors: string[] = [];

		for (let i = 0; i < rows.length; i += BATCH) {
			const batch = rows.slice(i, i + BATCH);
			try {
				const res = await fetch('/api/import', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ type: selectedType, rows: batch })
				});
				const data = await res.json();
				created += data.created ?? 0;
				failed  += data.failed  ?? 0;
				errors.push(...(data.errors ?? []));
			} catch (err: any) {
				failed += batch.length;
				errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${err.message}`);
			}
			progress = Math.round(((i + batch.length) / rows.length) * 100);
		}

		result    = { created, failed, errors };
		importing = false;
		progress  = 100;
	}

	function selectType(t: ImportType) {
		selectedType = t;
		rows = []; csvText = ''; parseError = ''; result = null; progress = 0;
	}
</script>

<svelte:head><title>Import Data — FliHub</title></svelte:head>

<div class="space-y-6 max-w-5xl">

	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Import Data</h1>
		<p class="text-muted-foreground mt-1">Bulk-import vendors, sponsors, pros, territories, or reimbursements — including historical records from before FliHub</p>
	</div>

	<!-- Type selector -->
	<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
		{#each TYPES as t}
			<button
				onclick={() => selectType(t.id)}
				class="p-4 rounded-xl border text-left transition-all {selectedType === t.id ? t.color + ' ring-2 ring-offset-2 ring-offset-background ring-current' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'}"
			>
				<p class="font-semibold text-slate-100">{t.label}</p>
				<p class="text-xs text-slate-400 mt-0.5">{t.description}</p>
			</button>
		{/each}
	</div>

	<!-- AI Prompt Tool (reimbursements only) -->
	{#if selectedType === 'reimbursements'}
	<Card class="p-5 bg-indigo-950/40 border-indigo-700">
		<button
			onclick={() => (showAiTool = !showAiTool)}
			class="w-full flex items-center justify-between text-left"
		>
			<div class="flex items-center gap-2">
				<Bot class="size-5 text-indigo-400" />
				<div>
					<p class="font-semibold text-indigo-200">AI Import Assistant</p>
					<p class="text-xs text-indigo-400 mt-0.5">Generate a ready-to-paste CSV from any list of expenses using ChatGPT, Claude, or Gemini</p>
				</div>
			</div>
			{#if showAiTool}
				<ChevronUp class="size-4 text-indigo-400 shrink-0" />
			{:else}
				<ChevronDown class="size-4 text-indigo-400 shrink-0" />
			{/if}
		</button>

		{#if showAiTool}
		<div class="mt-4 space-y-4">
			<!-- How it works -->
			<div class="bg-indigo-900/30 rounded-lg p-4 border border-indigo-800/50">
				<p class="text-sm font-semibold text-indigo-200 mb-2">How to use this tool</p>
				<ol class="text-sm text-indigo-300 space-y-1.5 list-decimal list-inside">
					<li>Copy the prompt below using the button</li>
					<li>Open ChatGPT, Claude, or Gemini and paste it</li>
					<li>Replace <span class="font-mono bg-indigo-900 px-1 rounded text-indigo-200">[PASTE YOUR LIST HERE]</span> with your expense records — emails, spreadsheet rows, receipts, notes, anything</li>
					<li>The AI will return a properly formatted CSV</li>
					<li>Paste the CSV output into the field below and click Import</li>
				</ol>
			</div>

			<!-- Historical flag callout -->
			<div class="flex gap-3 bg-amber-950/40 border border-amber-700/60 rounded-lg p-3">
				<History class="size-4 text-amber-400 shrink-0 mt-0.5" />
				<div class="text-xs text-amber-300">
					<span class="font-semibold">Historical records:</span> Set <span class="font-mono bg-amber-900/40 px-1 rounded">isHistorical=true</span> for any reimbursement that was paid before FliHub existed. These are tagged in the system so you can distinguish imported history from live claims. The AI prompt already instructs the model to set this correctly.
				</div>
			</div>

			<!-- The prompt -->
			<div>
				<div class="flex items-center justify-between mb-1.5">
					<p class="text-xs font-semibold text-indigo-300 uppercase tracking-wide">AI Prompt — copy and paste into your AI of choice</p>
					<button
						onclick={copyAiPrompt}
						class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-indigo-600 bg-indigo-800/60 hover:bg-indigo-700 text-indigo-200 hover:text-white transition-all"
					>
						{#if aiPromptCopied}
							<Check class="size-3.5 text-emerald-400" /> Copied!
						{:else}
							<Copy class="size-3.5" /> Copy Prompt
						{/if}
					</button>
				</div>
				<pre
					onclick={(e) => { const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(e.currentTarget); sel?.removeAllRanges(); sel?.addRange(range); }}
					class="text-[11px] text-indigo-200 bg-slate-900 rounded-lg p-4 overflow-x-auto border border-indigo-800/60 leading-relaxed cursor-text select-all whitespace-pre-wrap max-h-64 overflow-y-auto"
				>{aiPrompt}</pre>
				<p class="text-[10px] text-indigo-500 mt-1">Click to select all · or use the Copy button above · The prompt is auto-populated with your actual users, vendors, and departments</p>
			</div>
		</div>
		{/if}
	</Card>
	{/if}

	<!-- Schema reference -->
	<Card class="p-5 bg-slate-800/50 border-slate-700">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
				<FileText class="size-4 text-slate-400" /> Column Reference — {selectedType}
			</h2>
			<button onclick={copySample} class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all">
				{#if copied}
					<Check class="size-3.5 text-emerald-400" /> Copied!
				{:else}
					<Copy class="size-3.5" /> Copy Sample
				{/if}
			</button>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-xs">
				<thead>
					<tr class="text-left text-slate-400 uppercase tracking-wide border-b border-slate-700">
						<th class="pb-2 pr-4">Column</th>
						<th class="pb-2 pr-4">Required</th>
						<th class="pb-2 pr-4">Example</th>
						<th class="pb-2">Allowed Values</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-700/50">
					{#each schema as field}
						<tr class="hover:bg-slate-700/20">
							<td class="py-1.5 pr-4 font-mono text-slate-200">{field.col}</td>
							<td class="py-1.5 pr-4">
								{#if field.required}
									<span class="text-red-400 font-semibold">Required</span>
								{:else}
									<span class="text-slate-500">Optional</span>
								{/if}
							</td>
							<td class="py-1.5 pr-4 text-slate-400 font-mono">{field.example}</td>
							<td class="py-1.5 text-slate-500">{field.note ?? '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Sample preview -->
		<div class="mt-4">
			<p class="text-xs text-slate-400 mb-1.5 font-medium">Sample CSV — paste this directly into the field below:</p>
			<pre
				onclick={(e) => { const sel = window.getSelection(); const range = document.createRange(); range.selectNodeContents(e.currentTarget); sel?.removeAllRanges(); sel?.addRange(range); }}
				class="text-[11px] text-emerald-300 bg-slate-900 rounded-lg p-3 overflow-x-auto border border-slate-600 leading-relaxed cursor-text select-all whitespace-pre"
			>{sampleCSV}</pre>
			<p class="text-[10px] text-slate-500 mt-1">Click to select all · or use the Copy button above</p>
		</div>
	</Card>

	<!-- Paste area -->
	<Card class="p-5 bg-slate-800/50 border-slate-700">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide">Paste CSV Data</h2>
			{#if csvText}
				<button onclick={clearAll} class="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
					<X class="size-3.5" /> Clear
				</button>
			{/if}
		</div>
		<textarea
			bind:value={csvText}
			oninput={handleParse}
			rows="10"
			placeholder="Paste your CSV here — include the header row as the first line…"
			class="w-full rounded-lg border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600 resize-y"
		></textarea>

		{#if parseError}
			<div class="mt-2 flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
				<AlertCircle class="size-4 shrink-0" /> {parseError}
			</div>
		{/if}
	</Card>

	<!-- Preview table -->
	{#if rows.length > 0}
	<Card class="p-5 bg-slate-800/50 border-slate-700">
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wide">
				Preview — {rows.length} row{rows.length !== 1 ? 's' : ''} detected
			</h2>
			<Button
				onclick={runImport}
				disabled={importing}
				class="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-9"
			>
				<Upload class="size-4" />
				{importing ? `Importing… ${progress}%` : `Import ${rows.length} ${selectedType}`}
			</Button>
		</div>

		<!-- Progress bar -->
		{#if importing || (result && progress === 100)}
			<div class="mb-4">
				<div class="flex justify-between text-xs text-slate-400 mb-1">
					<span>{importing ? 'Importing…' : 'Complete'}</span>
					<span>{progress}%</span>
				</div>
				<div class="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
					<div
						class="h-full rounded-full transition-all duration-300 {result?.failed ? 'bg-yellow-500' : 'bg-emerald-500'}"
						style="width: {progress}%"
					></div>
				</div>
			</div>
		{/if}

		<!-- Result summary -->
		{#if result}
			<div class="mb-4 p-4 rounded-xl border {result.failed === 0 ? 'bg-emerald-950/40 border-emerald-700' : 'bg-yellow-950/40 border-yellow-700'}">
				<div class="flex items-center gap-3">
					{#if result.failed === 0}
						<CheckCircle2 class="size-5 text-emerald-400 shrink-0" />
						<div>
							<p class="font-semibold text-emerald-300">Import complete — {result.created} records created</p>
						</div>
					{:else}
						<AlertCircle class="size-5 text-yellow-400 shrink-0" />
						<div>
							<p class="font-semibold text-yellow-300">{result.created} created, {result.failed} failed</p>
						</div>
					{/if}
				</div>
				{#if result.errors.length}
					<div class="mt-3 space-y-1 max-h-40 overflow-y-auto">
						{#each result.errors as err}
							<p class="text-xs text-red-300 font-mono bg-red-950/30 px-2 py-1 rounded">{err}</p>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Data preview (first 5 rows) -->
		<div class="overflow-x-auto">
			<table class="w-full text-xs">
				<thead>
					<tr class="text-left text-slate-400 uppercase tracking-wide border-b border-slate-700">
						<th class="pb-2 pr-2 text-slate-500">#</th>
						{#each Object.keys(rows[0]) as col}
							<th class="pb-2 pr-4 font-mono">{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-700/40">
					{#each rows.slice(0, 5) as row, i}
						<tr class="hover:bg-slate-700/20">
							<td class="py-1.5 pr-2 text-slate-600">{i + 1}</td>
							{#each Object.values(row) as val}
								<td class="py-1.5 pr-4 text-slate-300 max-w-32 truncate" title={val}>{val || '—'}</td>
							{/each}
						</tr>
					{/each}
					{#if rows.length > 5}
						<tr>
							<td colspan={Object.keys(rows[0]).length + 1} class="py-2 text-center text-xs text-slate-500">
								… and {rows.length - 5} more rows
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</Card>
	{/if}

</div>
