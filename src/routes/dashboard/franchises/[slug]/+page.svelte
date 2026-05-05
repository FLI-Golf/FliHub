<script lang="ts">
	import type { PageData } from './$types';
	import Card from '$lib/components/ui/card.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { ArrowLeft, Download, ExternalLink, Pencil, Check, X, Loader, Plus } from 'lucide-svelte';
	import TrademarkStatus from '$lib/components/trademarks/TrademarkStatus.svelte';
	import FranchiseCommunitySection from '$lib/components/franchise/FranchiseCommunitySection.svelte';
	
	let { data }: { data: PageData } = $props();
	
	let franchise = $state(data.franchise);
	const pbUrl = 'https://pocketbase-production-6ab5.up.railway.app';
	
	function getLogoUrls(field: string) {
		if (!franchise[field] || franchise[field].length === 0) return [];
		return franchise[field].map((filename: string) => ({
			filename,
			url: `${pbUrl}/api/files/${franchise.collectionId}/${franchise.id}/${filename}`,
			thumb: `${pbUrl}/api/files/${franchise.collectionId}/${franchise.id}/${filename}?thumb=400x400`
		}));
	}
	
	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			available: 'bg-green-500',
			reserved: 'bg-yellow-500',
			in_negotiation: 'bg-blue-500',
			sold: 'bg-purple-500',
			active: 'bg-emerald-500',
			suspended: 'bg-gray-500',
			terminated: 'bg-red-500'
		};
		return colors[status] || 'bg-gray-500';
	}
	
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}
	
	function formatDate(dateStr: string) {
		if (!dateStr) return 'Not set';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	const logoSections = [
		{ field: 'logoFull', label: 'Full Logos', description: 'Main franchise logos' },
		{ field: 'logoMini', label: 'Mini Logos', description: 'Icons and small versions' },
		{ field: 'logoHorizontal', label: 'Horizontal Logos', description: 'Wide layout versions' },
		{ field: 'logoVertical', label: 'Vertical Logos', description: 'Stacked layout versions' },
		{ field: 'logoMonochrome', label: 'Monochrome Logos', description: 'Single color versions' },
		{ field: 'logoWordmark', label: 'Wordmark Logos', description: 'Text-only versions' }
	];

	// ── Shared save helper ────────────────────────────────────────────────────
	async function patchFranchise(payload: Record<string, unknown>) {
		const res = await fetch(`/api/franchises/${franchise.slug}`, {
			method:  'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify(payload)
		});
		if (!res.ok) {
			const d = await res.json().catch(() => ({}));
			throw new Error(d.message ?? `Error ${res.status}`);
		}
		return res.json();
	}

	// ── Team Roster editor ────────────────────────────────────────────────────
	const maleTalent   = (data.talent ?? []).filter((t: any) => t.gender === 'male');
	const femaleTalent = (data.talent ?? []).filter((t: any) => t.gender === 'female');

	let editingMalePro   = $state(false);
	let editingFemalePro = $state(false);
	let rosterSaving     = $state<'male' | 'female' | null>(null);
	let rosterError      = $state('');

	async function savePro(field: 'malePro' | 'femalePro', id: string) {
		rosterSaving = field === 'malePro' ? 'male' : 'female';
		rosterError  = '';
		try {
			await patchFranchise({ [field]: id || null });
			franchise[field] = id;
			franchise.expand = franchise.expand ?? {};
			franchise.expand[field] = (data.talent ?? []).find((t: any) => t.id === id) ?? null;
		} catch (err: any) {
			rosterError = err.message ?? 'Failed to save';
		} finally {
			rosterSaving     = null;
			editingMalePro   = false;
			editingFemalePro = false;
		}
	}

	// ── Franchise Owner editor ────────────────────────────────────────────────
	type OwnerField = 'franchiseeName' | 'franchiseeEmail' | 'franchiseePhone' | 'franchiseeCompany';
	let editingOwnerField = $state<OwnerField | null>(null);
	let ownerDraft        = $state('');
	let ownerSaving       = $state(false);
	let ownerError        = $state('');

	function startEditOwner(field: OwnerField) {
		editingOwnerField = field;
		ownerDraft        = franchise[field] || '';
		ownerError        = '';
	}

	function cancelEditOwner() { editingOwnerField = null; ownerError = ''; }

	async function saveOwner() {
		if (!editingOwnerField) return;
		ownerSaving = true;
		ownerError  = '';
		try {
			await patchFranchise({ [editingOwnerField]: ownerDraft });
			franchise[editingOwnerField] = ownerDraft;
			editingOwnerField = null;
		} catch (err: any) {
			ownerError = err.message ?? 'Failed to save';
		} finally {
			ownerSaving = false;
		}
	}

	function ownerKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter')  saveOwner();
		if (e.key === 'Escape') cancelEditOwner();
	}

	// ── Brand color editor ────────────────────────────────────────────────────
	type ColorEntry = { label: string; value: string };

	// Which swatch is open: 'primary' | 'secondary' | palette index (number) | null
	let editingColor = $state<'primary' | 'secondary' | number | null>(null);
	let colorSaving  = $state<'primary' | 'secondary' | number | null>(null);
	let colorError   = $state('');
	let colorDraft   = $state('#000000');
	let labelDraft   = $state('');

	// Extra palette colors (from colorPalette JSON field)
	let palette = $state<ColorEntry[]>(
		Array.isArray(franchise.colorPalette) ? franchise.colorPalette : []
	);

	function openColor(which: 'primary' | 'secondary' | number) {
		editingColor = which;
		colorError   = '';
		if (which === 'primary')        { colorDraft = franchise.primaryColor   || '#1E40AF'; labelDraft = 'Primary Color'; }
		else if (which === 'secondary') { colorDraft = franchise.secondaryColor || '#FBBF24'; labelDraft = 'Secondary Color'; }
		else { colorDraft = palette[which as number]?.value || '#000000'; labelDraft = palette[which as number]?.label || ''; }
	}

	function cancelColor() { editingColor = null; colorError = ''; }

	async function saveColor() {
		if (editingColor === null) return;
		colorSaving = editingColor;
		colorError  = '';
		try {
			const patch: Record<string, unknown> = {};
			if (editingColor === 'primary') {
				patch.primaryColor = colorDraft;
				franchise.primaryColor = colorDraft;
			} else if (editingColor === 'secondary') {
				patch.secondaryColor = colorDraft;
				franchise.secondaryColor = colorDraft;
			} else {
				palette[editingColor as number].value = colorDraft;
				palette[editingColor as number].label = labelDraft;
				patch.colorPalette = palette;
			}
			await patchFranchise(patch);
			editingColor = null;
		} catch (err: any) {
			colorError = err.message ?? 'Failed to save';
		} finally {
			colorSaving = null;
		}
	}

	function colorKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter')  saveColor();
		if (e.key === 'Escape') cancelColor();
	}

	async function addPaletteColor() {
		const newEntry: ColorEntry = { label: 'New Color', value: '#6366f1' };
		palette = [...palette, newEntry];
		await patchFranchise({ colorPalette: palette });
		openColor(palette.length - 1);
	}

	async function removePaletteColor(idx: number) {
		palette = palette.filter((_, i) => i !== idx);
		await patchFranchise({ colorPalette: palette });
	}

	// Inline label editing
	let editingLabelIdx   = $state<number | null>(null);
	let editingLabelValue = $state('');

	async function savePaletteLabel(idx: number) {
		if (editingLabelIdx !== idx) return;
		palette[idx].label = editingLabelValue.trim() || 'Unnamed';
		editingLabelIdx = null;
		await patchFranchise({ colorPalette: palette });
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/dashboard/franchises">
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div class="flex-1">
			<div class="flex items-center gap-3">
				<h1 class="text-3xl font-bold tracking-tight">{franchise.name}</h1>
				<Badge class="{getStatusColor(franchise.status)} text-white border-0">
					{franchise.status}
				</Badge>
			</div>
			<p class="text-muted-foreground italic">{franchise.tagline || 'No tagline'}</p>
		</div>
	</div>

	<!-- Hero Section with Colors -->
	<Card>
		<div 
			class="h-32 rounded-t-lg"
			style="background: linear-gradient(135deg, {franchise.primaryColor || '#3B82F6'} 0%, {franchise.secondaryColor || '#1E40AF'} 100%)"
		></div>
		<div class="p-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div>
					<div class="text-sm text-muted-foreground">Territory</div>
					<div class="text-lg font-semibold">{franchise.territory || 'Not set'}</div>
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Franchise Fee</div>
					<div class="text-lg font-semibold">{formatCurrency(franchise.franchiseFee || 0)}</div>
				</div>
				<div>
					<div class="text-sm text-muted-foreground">Target Sale Date</div>
					<div class="text-lg font-semibold">{formatDate(franchise.targetSaleDate)}</div>
				</div>
			</div>
		</div>
	</Card>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Team Roster -->
		<Card>
			<div class="p-6 space-y-4">
				<div>
					<h3 class="text-lg font-semibold">Team Roster</h3>
					<p class="text-sm text-muted-foreground mt-0.5">Professional players assigned to represent this franchise.</p>
				</div>

				<!-- Male Pro -->
				<div>
					<div class="text-sm text-muted-foreground mb-1">Male Pro</div>
					{#if editingMalePro}
						<div class="flex items-center gap-2">
							<select
								value={franchise.malePro || ''}
								onchange={async (e) => savePro('malePro', (e.target as HTMLSelectElement).value)}
								class="flex-1 rounded-lg border border-slate-600 bg-slate-800 text-white px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="" class="bg-slate-800">— Unassigned —</option>
								{#each maleTalent as t}
									<option value={t.id} class="bg-slate-800">{t.name}</option>
								{/each}
							</select>
							{#if rosterSaving === 'male'}
								<Loader class="size-4 animate-spin text-muted-foreground shrink-0" />
							{:else}
								<button onclick={() => editingMalePro = false} class="p-1 rounded hover:bg-muted text-muted-foreground">
									<X class="size-4" />
								</button>
							{/if}
						</div>
					{:else}
						<button
							onclick={() => { editingMalePro = true; editingFemalePro = false; }}
							class="group flex items-center gap-2 w-full text-left"
						>
							<span class="font-semibold group-hover:text-primary transition-colors">
								{franchise.expand?.malePro?.name || 'Not assigned'}
							</span>
							<Pencil class="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
						</button>
					{/if}
				</div>

				<Separator />

				<!-- Female Pro -->
				<div>
					<div class="text-sm text-muted-foreground mb-1">Female Pro</div>
					{#if editingFemalePro}
						<div class="flex items-center gap-2">
							<select
								value={franchise.femalePro || ''}
								onchange={async (e) => savePro('femalePro', (e.target as HTMLSelectElement).value)}
								class="flex-1 rounded-lg border border-slate-600 bg-slate-800 text-white px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="" class="bg-slate-800">— Unassigned —</option>
								{#each femaleTalent as t}
									<option value={t.id} class="bg-slate-800">{t.name}</option>
								{/each}
							</select>
							{#if rosterSaving === 'female'}
								<Loader class="size-4 animate-spin text-muted-foreground shrink-0" />
							{:else}
								<button onclick={() => editingFemalePro = false} class="p-1 rounded hover:bg-muted text-muted-foreground">
									<X class="size-4" />
								</button>
							{/if}
						</div>
					{:else}
						<button
							onclick={() => { editingFemalePro = true; editingMalePro = false; }}
							class="group flex items-center gap-2 w-full text-left"
						>
							<span class="font-semibold group-hover:text-primary transition-colors">
								{franchise.expand?.femalePro?.name || 'Not assigned'}
							</span>
							<Pencil class="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
						</button>
					{/if}
				</div>

				{#if rosterError}
					<p class="text-xs text-destructive">{rosterError}</p>
				{/if}

				{#if franchise.expand?.additionalPros?.length > 0}
					<Separator />
					<div>
						<div class="text-sm text-muted-foreground mb-2">Additional Pros</div>
						<div class="space-y-1">
							{#each franchise.expand.additionalPros as pro}
								<div class="text-sm">{pro.name}</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</Card>

		<!-- Financial Info -->
		<Card>
			<div class="p-6 space-y-4">
				<div>
					<h3 class="text-lg font-semibold">Financial Overview</h3>
					<p class="text-sm text-muted-foreground mt-0.5">Revenue share and projected earnings for this franchise territory.</p>
				</div>
				<div>
					<div class="text-sm text-muted-foreground mb-0.5">Royalty Rate</div>
					<div class="font-semibold">{franchise.royaltyPercentage || 0}%</div>
					<div class="text-xs text-muted-foreground mt-0.5">Percentage of gross revenue paid to the league each season.</div>
				</div>
				<Separator />
				<div>
					<div class="text-sm text-muted-foreground mb-0.5">Marketing Fee</div>
					<div class="font-semibold">{franchise.marketingFeePercentage || 0}%</div>
					<div class="text-xs text-muted-foreground mt-0.5">Contribution to the shared league marketing and brand fund.</div>
				</div>
				<Separator />
				<div>
					<div class="text-sm text-muted-foreground mb-0.5">Estimated Revenue</div>
					<div class="font-semibold">{formatCurrency(franchise.estimatedRevenue || 0)}</div>
					<div class="text-xs text-muted-foreground mt-0.5">Projected annual revenue based on territory size and market data.</div>
				</div>
			</div>
		</Card>

		<!-- Owner Info -->
		<Card>
			<div class="p-6 space-y-4">
				<div>
					<h3 class="text-lg font-semibold">Franchise Owner</h3>
					<p class="text-sm text-muted-foreground mt-0.5">Primary contact and ownership details for this territory.</p>
				</div>

				{#snippet ownerRow(label: string, field: OwnerField, type: string, placeholder: string)}
					<div>
						<div class="text-sm text-muted-foreground mb-1">{label}</div>
						{#if editingOwnerField === field}
							<div class="flex items-center gap-2">
								<input
									bind:value={ownerDraft}
									{type}
									{placeholder}
									onkeydown={ownerKeydown}
									autofocus
									class="flex-1 rounded-lg border border-slate-600 bg-slate-800 text-white px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
								/>
								{#if ownerSaving}
									<Loader class="size-4 animate-spin text-muted-foreground shrink-0" />
								{:else}
									<button onclick={saveOwner} class="p-1 rounded hover:bg-muted text-muted-foreground">
										<Check class="size-4 text-primary" />
									</button>
									<button onclick={cancelEditOwner} class="p-1 rounded hover:bg-muted text-muted-foreground">
										<X class="size-4" />
									</button>
								{/if}
							</div>
							{#if ownerError}
								<p class="text-xs text-destructive mt-1">{ownerError}</p>
							{/if}
						{:else}
							<button
								onclick={() => startEditOwner(field)}
								class="group flex items-center gap-2 w-full text-left"
							>
								<span class="font-semibold group-hover:text-primary transition-colors">
									{franchise[field] || 'Not set'}
								</span>
								<Pencil class="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
							</button>
						{/if}
					</div>
				{/snippet}

				{@render ownerRow('Name',    'franchiseeName',    'text',  'Full name')}
				<Separator />
				{@render ownerRow('Email',   'franchiseeEmail',   'email', 'email@example.com')}
				<Separator />
				{@render ownerRow('Phone',   'franchiseePhone',   'tel',   '+1 (555) 000-0000')}
				<Separator />
				{@render ownerRow('Company', 'franchiseeCompany', 'text',  'Company name')}
			</div>
		</Card>
	</div>

	<!-- Brand Colors -->
	<Card>
		<div class="p-6 space-y-5">
			<div>
				<h3 class="text-lg font-semibold">Brand Colors</h3>
				<p class="text-sm text-muted-foreground mt-0.5">Click any swatch to edit. Use + to add additional palette colors.</p>
			</div>

			{#snippet colorRow(which: 'primary' | 'secondary' | number, label: string, value: string)}
				<div>
					{#if editingColor === which}
						<div class="space-y-2">
							<!-- Label input (palette entries only) -->
							{#if typeof which === 'number'}
								<input
									bind:value={labelDraft}
									placeholder="Color name (e.g. Accent, Background…)"
									class="w-full text-sm rounded-lg border border-slate-600 bg-slate-800 text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							{:else}
								<div class="text-sm text-muted-foreground">{label}</div>
							{/if}
							<!-- Swatch + hex -->
							<div class="flex items-center gap-3">
								<label class="relative cursor-pointer shrink-0">
									<div class="w-10 h-10 rounded-lg border-2 border-slate-600 shadow-sm ring-2 ring-primary ring-offset-2"
										style="background-color: {colorDraft}"></div>
									<input type="color" bind:value={colorDraft} class="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
								</label>
								<input
									type="text"
									bind:value={colorDraft}
									maxlength="7"
									onkeydown={colorKeydown}
									autofocus
									class="w-28 font-mono text-sm rounded-lg border border-slate-600 bg-slate-800 text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
								/>
								{#if colorSaving === which}
									<Loader class="size-4 animate-spin text-muted-foreground shrink-0" />
								{:else}
									<button onclick={saveColor} class="p-1 rounded hover:bg-muted">
										<Check class="size-4 text-primary" />
									</button>
									<button onclick={cancelColor} class="p-1 rounded hover:bg-muted text-muted-foreground">
										<X class="size-4" />
									</button>
								{/if}
							</div>
						</div>
					{:else}
						{#if typeof which !== 'number'}
							<div class="text-sm text-muted-foreground mb-1.5">{label}</div>
						{/if}
						<button onclick={() => openColor(which)} class="group flex items-center gap-3">
							<div class="w-10 h-10 rounded-lg border-2 border-border shadow-sm group-hover:ring-2 group-hover:ring-primary group-hover:ring-offset-1 transition-all"
								style="background-color: {value}"></div>
							<span class="font-mono text-sm group-hover:text-primary transition-colors">{value}</span>
							<Pencil class="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
						</button>
					{/if}
				</div>
			{/snippet}

			<!-- Primary & Secondary -->
			{@render colorRow('primary',   'Primary Color',   franchise.primaryColor   || '#1E40AF')}
			<Separator />
			{@render colorRow('secondary', 'Secondary Color', franchise.secondaryColor || '#FBBF24')}

			<!-- Extra palette colors -->
			{#each palette as entry, idx}
				<Separator />
				<div class="flex items-end gap-2">
					<div class="flex-1 space-y-1">
						<!-- Editable label -->
						{#if editingColor === idx}
							<!-- label shown inside colorRow snippet when editing -->
						{:else}
							<div class="flex items-center gap-1.5 group/label">
								{#if editingLabelIdx === idx}
									<input
										bind:value={editingLabelValue}
										onkeydown={(e) => {
											if (e.key === 'Enter' || e.key === 'Escape') savePaletteLabel(idx);
										}}
										onblur={() => savePaletteLabel(idx)}
										autofocus
										class="text-sm rounded border border-slate-600 bg-slate-800 text-white px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary w-40"
									/>
								{:else}
									<button
										onclick={() => { editingLabelIdx = idx; editingLabelValue = entry.label; }}
										class="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
									>
										{entry.label || 'Unnamed'}
										<Pencil class="size-3 opacity-0 group-hover/label:opacity-100 transition-opacity" />
									</button>
								{/if}
							</div>
						{/if}
						{@render colorRow(idx, entry.label, entry.value)}
					</div>
					<button
						onclick={() => removePaletteColor(idx)}
						class="mb-0.5 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors"
						title="Remove color"
					>
						<X class="size-3.5" />
					</button>
				</div>
			{/each}

			{#if colorError}
				<p class="text-xs text-destructive">{colorError}</p>
			{/if}

			<!-- Gradient preview -->
			<div class="h-8 rounded-lg w-full"
				style="background: linear-gradient(135deg, {franchise.primaryColor || '#1E40AF'} 0%, {franchise.secondaryColor || '#FBBF24'} 100%)">
			</div>

			<!-- Add color -->
			<button
				onclick={addPaletteColor}
				class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				<div class="size-7 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors">
					<Plus class="size-3.5" />
				</div>
				Add color
			</button>
		</div>
	</Card>

	<!-- Logos Section -->
	{#each logoSections as section}
		{@const logos = getLogoUrls(section.field)}
		{#if logos.length > 0}
			<Card>
				<div class="p-6">
					<div class="flex items-center justify-between mb-4">
						<div>
							<h3 class="text-lg font-semibold">{section.label}</h3>
							<p class="text-sm text-muted-foreground mt-1">{section.description}</p>
						</div>
						<Badge variant="secondary">{logos.length} file{logos.length !== 1 ? 's' : ''}</Badge>
					</div>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
						{#each logos as logo}
							<div class="group relative">
								<div class="aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted">
									<img 
										src={logo.thumb} 
										alt={logo.filename}
										class="w-full h-full object-contain p-2"
									/>
								</div>
								<div class="mt-2 space-y-1">
									<div class="text-xs text-muted-foreground truncate" title={logo.filename}>
										{logo.filename}
									</div>
									<div class="flex gap-1">
										<Button 
											variant="outline" 
											size="sm" 
											class="h-7 text-xs flex-1"
											href={logo.url}
											target="_blank"
										>
											<ExternalLink class="h-3 w-3 mr-1" />
											View
										</Button>
										<Button 
											variant="outline" 
											size="sm" 
											class="h-7 text-xs flex-1"
											href={logo.url}
											download
										>
											<Download class="h-3 w-3 mr-1" />
											Download
										</Button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</Card>
		{/if}
	{/each}

	<!-- Brand Spec Sheets -->
	{#if franchise.brandSpecSheet && franchise.brandSpecSheet.length > 0}
		<Card>
			<div class="p-6">
				<div class="flex items-center justify-between mb-4">
					<div>
						<h3 class="text-lg font-semibold">Brand Spec Sheets</h3>
						<p class="text-sm text-muted-foreground mt-1">PDF brand guidelines and specifications</p>
					</div>
					<Badge variant="secondary">{franchise.brandSpecSheet.length} file{franchise.brandSpecSheet.length !== 1 ? 's' : ''}</Badge>
				</div>
				<div class="space-y-2">
					{#each franchise.brandSpecSheet as filename}
						{@const url = `${pbUrl}/api/files/${franchise.collectionId}/${franchise.id}/${filename}`}
						<div class="flex items-center justify-between p-3 border rounded-lg">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded bg-red-100 dark:bg-red-900 flex items-center justify-center">
									<span class="text-xs font-bold text-red-600 dark:text-red-300">PDF</span>
								</div>
								<div>
									<div class="font-medium">{filename}</div>
									<div class="text-xs text-muted-foreground">Brand Guidelines</div>
								</div>
							</div>
							<div class="flex gap-2">
								<Button variant="outline" size="sm" href={url} target="_blank">
									<ExternalLink class="h-4 w-4 mr-2" />
									View
								</Button>
								<Button variant="outline" size="sm" href={url} download>
									<Download class="h-4 w-4 mr-2" />
									Download
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</Card>
	{/if}

	<!-- Community & Story PDFs -->
	<FranchiseCommunitySection
		{franchise}
		isAdmin={data.isAdmin ?? false}
	/>

	<!-- Trademark Protection -->
	<TrademarkStatus filings={data.trademarkFilings ?? []} entityType="franchise" />

	<!-- Description -->
	{#if franchise.description}
		<Card>
			<div class="p-6">
				<h3 class="text-lg font-semibold mb-4">Description</h3>
				<div class="prose dark:prose-invert max-w-none">
					{@html franchise.description}
				</div>
			</div>
		</Card>
	{/if}
</div>
