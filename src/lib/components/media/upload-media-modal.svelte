<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Upload, Save, X, Image, CheckCircle2, FileText } from 'lucide-svelte';

	let {
		open = $bindable(false),
		franchises = [],
		projects = [],
		campaigns = [],
		sponsors = [],
		people = [],
		onUploaded = () => {}
	} = $props();

	const assetTypes = [
		{ value: 'flyer',   label: 'Flyer' },
		{ value: 'jersey',  label: 'Jersey' },
		{ value: 'shoe',    label: 'Shoe' },
		{ value: 'logo',    label: 'Logo' },
		{ value: 'banner',  label: 'Banner' },
		{ value: 'social',  label: 'Social Media' },
		{ value: 'other',   label: 'Other' }
	];

	const categoryOptions = [
		{ value: 'graphic', label: 'Graphic' },
		{ value: 'photo', label: 'Photo' },
		{ value: 'video', label: 'Video' },
		{ value: 'audio', label: 'Audio' },
		{ value: 'document', label: 'Document' },
		{ value: 'broadcast segment', label: 'Broadcast Segment' },
		{ value: 'social clip', label: 'Social Clip' },
		{ value: 'interview', label: 'Interview' },
		{ value: 'highlight', label: 'Highlight' },
		{ value: 'sponsor asset', label: 'Sponsor Asset' },
		{ value: 'archive package', label: 'Archive Package' },
		{ value: 'other', label: 'Other' }
	];

	const statusOptions = ['uploaded', 'processing', 'tagged', 'approved', 'archived', 'restricted'];
	const roundOptions = ['practice', 'qualifier', 'round 1', 'round 2', 'round 3', 'final round', 'playoff', 'other'];
	const shotTypeOptions = ['drive', 'approach', 'chip', 'putt', 'bunker', 'penalty', 'other'];
	const momentOptions = ['crowd reaction', 'interview segment', 'award ceremony', 'vip / hospitality', 'sponsor activation', 'other'];
	const visibilityOptions = ['internal', 'sponsor', 'broadcast', 'restricted', 'owned', 'shared rights', 'expired'];

	const steps = [
		{ id: 0, title: 'Asset', description: 'Upload and basic details' },
		{ id: 1, title: 'Ownership', description: 'People and org links' },
		{ id: 2, title: 'Context', description: 'Taxonomy and filters' },
		{ id: 3, title: 'Review', description: 'Tags, notes, submit' }
	];

	const ownershipFieldVisibility: Record<string, string[]> = {
		flyer: ['franchise', 'team', 'sponsor', 'project', 'campaign'],
		jersey: ['franchise', 'team', 'sponsor', 'project'],
		shoe: ['franchise', 'team', 'sponsor', 'project'],
		logo: ['franchise', 'team', 'sponsor', 'project', 'campaign'],
		banner: ['franchise', 'team', 'sponsor', 'project', 'campaign'],
		social: ['franchise', 'team', 'person', 'sponsor', 'project', 'campaign'],
		other: ['franchise', 'team', 'person', 'sponsor', 'project', 'campaign']
	};

	const contextFieldVisibility: Record<string, string[]> = {
		flyer: ['category', 'status', 'season', 'visibility'],
		jersey: ['category', 'status', 'season', 'visibility'],
		shoe: ['category', 'status', 'season', 'visibility'],
		logo: ['category', 'status', 'season', 'visibility'],
		banner: ['category', 'status', 'season', 'visibility'],
		social: ['category', 'status', 'season', 'round', 'shot_type', 'moment', 'visibility'],
		other: ['category', 'status', 'season', 'round', 'shot_type', 'moment', 'visibility']
	};

	const requiredFieldsByType: Record<string, string[]> = {
		flyer: ['franchise'],
		jersey: ['franchise', 'team'],
		shoe: ['franchise', 'team'],
		logo: ['franchise'],
		banner: ['franchise'],
		social: ['franchise', 'person', 'moment'],
		other: ['franchise']
	};

	const fieldLabels: Record<string, string> = {
		franchise: 'Franchise',
		team: 'Team',
		person: 'Person',
		sponsor: 'Sponsor',
		project: 'Project',
		campaign: 'Campaign',
		category: 'Category',
		status: 'Status',
		season: 'Season',
		round: 'Round',
		shot_type: 'Shot Type',
		moment: 'Moment',
		visibility: 'Visibility'
	};

	let formData = $state({
		title: '',
		asset_type: 'flyer',
		franchise: '',
		project: '',
		campaign: '',
		category: 'graphic',
		status: 'uploaded',
		season: '',
		person: '',
		team: '',
		sponsor: '',
		round: 'practice',
		shot_type: 'drive',
		moment: 'crowd reaction',
		visibility: 'internal',
		tags: '',
		notes: ''
	});

	let selectedFile: File | null = $state(null);
	let previewUrl = $state('');
	let isSubmitting = $state(false);
	let error = $state('');
	let currentStep = $state(0);

	function ownershipFieldsForType(assetType: string): string[] {
		return ownershipFieldVisibility[assetType] ?? ownershipFieldVisibility.other;
	}

	function contextFieldsForType(assetType: string): string[] {
		return contextFieldVisibility[assetType] ?? contextFieldVisibility.other;
	}

	function isOwnershipFieldVisible(field: string): boolean {
		return ownershipFieldsForType(formData.asset_type).includes(field);
	}

	function isContextFieldVisible(field: string): boolean {
		return contextFieldsForType(formData.asset_type).includes(field);
	}

	function isFieldVisible(field: string): boolean {
		return isOwnershipFieldVisible(field) || isContextFieldVisible(field);
	}

	function requiredFieldsForType(assetType: string): string[] {
		return requiredFieldsByType[assetType] ?? requiredFieldsByType.other;
	}

	function isFieldRequired(field: string): boolean {
		return requiredFieldsForType(formData.asset_type).includes(field);
	}

	function requiredLegendText(): string {
		const labels = requiredFieldsForType(formData.asset_type).map(
			(field) => fieldLabels[field] ?? field
		);
		return labels.join(', ');
	}

	function acceptedMimeTypesForType(assetType: string): string {
		switch (assetType) {
			case 'social':
				return [
					'image/jpeg',
					'image/png',
					'image/webp',
					'image/gif',
					'image/svg+xml',
					'video/mp4',
					'video/quicktime',
					'video/webm',
					'audio/mpeg',
					'audio/wav',
					'audio/mp4'
				].join(',');
			case 'other':
				return [
					'image/jpeg',
					'image/png',
					'image/webp',
					'image/gif',
					'image/svg+xml',
					'video/mp4',
					'video/quicktime',
					'video/webm',
					'audio/mpeg',
					'audio/wav',
					'audio/mp4',
					'application/pdf',
					'text/plain'
				].join(',');
			default:
				return [
					'image/jpeg',
					'image/png',
					'image/webp',
					'image/gif',
					'image/svg+xml',
					'application/pdf'
				].join(',');
		}
	}

	function acceptedTypesHint(assetType: string): string {
		switch (assetType) {
			case 'social':
				return 'Images, video, or audio';
			case 'other':
				return 'Images, video, audio, or docs';
			default:
				return 'Images or PDF documents';
		}
	}

	function isImageFile(file: File | null): boolean {
		return !!file && file.type.startsWith('image/');
	}

	function sponsorLabel(sponsor: any): string {
		return sponsor?.name || sponsor?.companyName || sponsor?.company_name || 'Unnamed Sponsor';
	}

	function stepInstructionTitle(stepId: number): string {
		if (stepId === 0) return 'Start here';
		if (stepId === 1) return 'Ownership links';
		if (stepId === 2) return 'Filter taxonomy';
		return 'Final check';
	}

	function stepInstructionLines(stepId: number): string[] {
		if (stepId === 0) {
			return [
				'Upload one media file, set a clear title, and pick the asset type.',
				'The asset type controls which fields appear in later steps.',
				'The form auto-generates a title from the filename if title is empty and validates accepted file types by asset type.'
			];
		}

		if (stepId === 1) {
			const visible = ownershipFieldsForType(formData.asset_type)
				.map((field) => fieldLabels[field] ?? field)
				.join(', ');
			return [
				`For this asset type, you can link: ${visible}.`,
				'Use these links to connect assets to teams, sponsors, campaigns, and people.',
				'Only visible ownership links are saved with the upload.'
			];
		}

		if (stepId === 2) {
			const visible = contextFieldsForType(formData.asset_type)
				.map((field) => fieldLabels[field] ?? field)
				.join(', ');
			return [
				`For this asset type, taxonomy fields are: ${visible}.`,
				'These values power filtering, queueing, and package grouping in the media dashboard.',
				'Only visible taxonomy fields are stored on submit.'
			];
		}

		return [
			'Review your metadata and add optional tags and notes.',
			'Tags help search and grouping; notes preserve editorial context.',
			'When you click Upload, only currently visible fields are submitted.'
		];
	}

	function valueForField(field: string): string {
		return (formData as Record<string, string>)[field] || '';
	}

	function isFieldFilled(field: string): boolean {
		return valueForField(field).trim().length > 0;
	}

	function fieldStep(field: string): number {
		if (['franchise', 'team', 'person', 'sponsor', 'project', 'campaign'].includes(field)) return 1;
		if (['category', 'status', 'season', 'round', 'shot_type', 'moment', 'visibility'].includes(field)) return 2;
		return 3;
	}

	function missingRequiredFieldsForStep(step: number): string[] {
		return requiredFieldsForType(formData.asset_type).filter(
			(field) => fieldStep(field) === step && isFieldVisible(field) && !isFieldFilled(field)
		);
	}

	function requiredFieldsError(step: number): string | null {
		const missing = missingRequiredFieldsForStep(step);
		if (!missing.length) return null;
		const labels = missing.map((field) => fieldLabels[field] ?? field);
		return `Please complete required fields: ${labels.join(', ')}.`;
	}

	function stepHasVisibleFields(stepId: number): boolean {
		if (stepId === 1) return ownershipFieldsForType(formData.asset_type).length > 0;
		if (stepId === 2) return contextFieldsForType(formData.asset_type).length > 0;
		return true;
	}

	function visibleSteps() {
		return steps.filter((step) => stepHasVisibleFields(step.id));
	}

	function visibleStepOrder(): number[] {
		return visibleSteps().map((step) => step.id);
	}

	function currentVisibleIndex(): number {
		return visibleStepOrder().indexOf(currentStep);
	}

	function finalVisibleStepId(): number {
		const order = visibleStepOrder();
		return order[order.length - 1] ?? 3;
	}

	function isFinalVisibleStep(): boolean {
		return currentStep === finalVisibleStepId();
	}

	function normalizeFieldsForAssetType() {
		const visibleOwnership = new Set(ownershipFieldsForType(formData.asset_type));
		const visibleContext = new Set(contextFieldsForType(formData.asset_type));

		if (!visibleOwnership.has('franchise')) formData.franchise = '';
		if (!visibleOwnership.has('team')) formData.team = '';
		if (!visibleOwnership.has('person')) formData.person = '';
		if (!visibleOwnership.has('sponsor')) formData.sponsor = '';
		if (!visibleOwnership.has('project')) formData.project = '';
		if (!visibleOwnership.has('campaign')) formData.campaign = '';

		if (!visibleContext.has('category')) formData.category = 'graphic';
		if (!visibleContext.has('status')) formData.status = 'uploaded';
		if (!visibleContext.has('season')) formData.season = '';
		if (!visibleContext.has('round')) formData.round = 'practice';
		if (!visibleContext.has('shot_type')) formData.shot_type = 'drive';
		if (!visibleContext.has('moment')) formData.moment = 'crowd reaction';
		if (!visibleContext.has('visibility')) formData.visibility = 'internal';

		const order = visibleStepOrder();
		if (!order.includes(currentStep)) {
			currentStep = order[Math.max(order.length - 1, 0)] ?? 0;
		}
	}

	function handleAssetTypeChange() {
		normalizeFieldsForAssetType();
		error = '';
	}

	function stepIsValid(step: number): boolean {
		if (step === 0) {
			return !!selectedFile && !!formData.title.trim() && !!formData.asset_type;
		}
		return missingRequiredFieldsForStep(step).length === 0;
	}

	function goToStep(step: number) {
		const order = visibleStepOrder();
		if (!order.includes(step)) return;

		const currentIndex = order.indexOf(currentStep);
		const targetIndex = order.indexOf(step);

		if (targetIndex < currentIndex) {
			currentStep = step;
			error = '';
			return;
		}

		for (let i = currentIndex; i < targetIndex; i += 1) {
			if (!stepIsValid(order[i])) {
				error = requiredFieldsError(order[i]) ?? 'Complete required fields before moving to the next step.';
				return;
			}
		}

		error = '';
		currentStep = step;
	}

	function nextStep() {
		const order = visibleStepOrder();
		const index = order.indexOf(currentStep);
		const next = order[index + 1];
		if (next !== undefined) {
			goToStep(next);
		}
	}

	function prevStep() {
		const order = visibleStepOrder();
		const index = order.indexOf(currentStep);
		const previous = order[index - 1];
		if (previous !== undefined) {
			currentStep = previous;
		}
		error = '';
	}

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const accepted = acceptedMimeTypesForType(formData.asset_type)
			.split(',')
			.map((entry) => entry.trim())
			.filter(Boolean);

		if (!accepted.includes(file.type)) {
			error = `Unsupported file type for ${formData.asset_type}. Allowed: ${acceptedTypesHint(formData.asset_type)}.`;
			selectedFile = null;
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
				previewUrl = '';
			}
			input.value = '';
			return;
		}

		error = '';
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
		// Auto-fill title from filename if empty
		if (!formData.title) {
			formData.title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		for (const stepId of visibleStepOrder()) {
			if (!stepIsValid(stepId)) {
				currentStep = stepId;
				error = requiredFieldsError(stepId) ?? 'Complete required fields before submitting.';
				return;
			}
		}

		if (!isFinalVisibleStep()) {
			nextStep();
			return;
		}

		if (!selectedFile) {
			error = 'Please select a file';
			return;
		}

		if (!formData.title.trim()) {
			error = 'Please enter a title';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const body = new FormData();
			body.append('title', formData.title);
			body.append('asset_type', formData.asset_type);
			body.append('file', selectedFile);
			if (isOwnershipFieldVisible('franchise') && formData.franchise) body.append('franchise', formData.franchise);
			if (isOwnershipFieldVisible('project') && formData.project) body.append('project', formData.project);
			if (isOwnershipFieldVisible('campaign') && formData.campaign) body.append('campaign', formData.campaign);
			if (isContextFieldVisible('category') && formData.category) body.append('category', formData.category);
			if (isContextFieldVisible('status') && formData.status) body.append('status', formData.status);
			if (isContextFieldVisible('season') && formData.season) body.append('season', formData.season);
			if (isOwnershipFieldVisible('person') && formData.person) body.append('person', formData.person);
			if (isOwnershipFieldVisible('team') && formData.team) body.append('team', formData.team);
			if (isOwnershipFieldVisible('sponsor') && formData.sponsor) body.append('sponsor', formData.sponsor);
			if (isContextFieldVisible('round') && formData.round) body.append('round', formData.round);
			if (isContextFieldVisible('shot_type') && formData.shot_type) body.append('shot_type', formData.shot_type);
			if (isContextFieldVisible('moment') && formData.moment) body.append('moment', formData.moment);
			if (isContextFieldVisible('visibility') && formData.visibility) body.append('visibility', formData.visibility);
			if (formData.tags)      body.append('tags',      formData.tags);
			if (formData.notes)     body.append('notes',     formData.notes);

			const response = await fetch('/api/media', {
				method: 'POST',
				body,
			});

			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(payload?.message || `Upload failed (${response.status})`);
			}

			const asset = payload;
			resetForm();
			open = false;
			onUploaded(asset);
		} catch (err: any) {
			error = err?.message || 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}

	function resetForm() {
		formData = {
			title: '',
			asset_type: 'flyer',
			franchise: '',
			project: '',
			campaign: '',
			category: 'graphic',
			status: 'uploaded',
			season: '',
			person: '',
			team: '',
			sponsor: '',
			round: 'practice',
			shot_type: 'drive',
			moment: 'crowd reaction',
			visibility: 'internal',
			tags: '',
			notes: ''
		};
		selectedFile = null;
		if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = ''; }
		error = '';
		currentStep = 0;
	}

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (!newOpen) resetForm();
	}
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="left" class="w-full sm:max-w-5xl overflow-y-auto bg-slate-900 text-white p-6 h-full">
		<Sheet.Header class="mb-6">
			<Sheet.Title class="flex items-center gap-2 text-xl text-white">
				<Upload class="size-5" />
				Upload Media Asset
			</Sheet.Title>
			<Sheet.Description class="text-slate-300">
				Upload flyers, jerseys, shoes, logos, and other brand assets.
			</Sheet.Description>
		</Sheet.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			{#if error}
				<div class="p-3 rounded-lg bg-red-900/30 border border-red-700">
					<p class="text-sm text-red-300">{error}</p>
				</div>
			{/if}

			<div class="grid gap-6 lg:grid-cols-[220px_1fr]">
				<aside class="rounded-xl border border-slate-700 bg-slate-950/60 p-3">
					<div class="space-y-2">
						{#each visibleSteps() as step}
							{@const stepIndex = visibleStepOrder().indexOf(step.id)}
							{@const activeIndex = currentVisibleIndex()}
							<button
								type="button"
								onclick={() => goToStep(step.id)}
								class="flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors {currentStep === step.id ? 'border-white bg-white/10 text-white' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'}"
							>
								<CheckCircle2 class="mt-0.5 size-4 {stepIndex < activeIndex || (step.id === 0 && stepIsValid(0)) ? 'text-emerald-300' : 'text-slate-500'}" />
								<span>
									<span class="block text-sm font-medium">{step.title}</span>
									<span class="block text-xs text-slate-400">{step.description}</span>
								</span>
							</button>
							{#if currentStep === step.id}
								<div class="rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
									<p class="font-semibold text-slate-100">{stepInstructionTitle(step.id)}</p>
									<ul class="mt-1 space-y-1 list-disc pl-4">
										{#each stepInstructionLines(step.id) as line}
											<li>{line}</li>
										{/each}
									</ul>
								</div>
							{/if}
						{/each}
					</div>
				</aside>

				<div class="space-y-6">
					{#if currentStep === 0}
						<div class="space-y-2">
							<Label class="text-slate-200">Media File *</Label>
							<label class="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-800 hover:border-slate-400 transition-colors overflow-hidden">
								{#if previewUrl && isImageFile(selectedFile)}
									<img src={previewUrl} alt="Preview" class="h-full w-full object-contain" />
								{:else if selectedFile}
									<div class="flex flex-col items-center gap-2 text-slate-300 px-3 text-center">
										<FileText class="size-10 text-slate-400" />
										<span class="text-sm font-medium break-all">{selectedFile.name}</span>
										<span class="text-xs text-slate-400">{selectedFile.type || 'Unknown type'}</span>
									</div>
								{:else}
									<div class="flex flex-col items-center gap-2 text-slate-400">
										<Image class="size-10" />
										<span class="text-sm">Click to select a media file</span>
										<span class="text-xs">{acceptedTypesHint(formData.asset_type)} - max 50 MB</span>
									</div>
								{/if}
								<input type="file" accept={acceptedMimeTypesForType(formData.asset_type)} class="hidden" onchange={handleFileChange} />
							</label>
							{#if selectedFile}
								<p class="text-xs text-slate-400">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</p>
							{/if}
						</div>

						<div class="space-y-2">
							<Label for="media-title" class="text-slate-200">Title *</Label>
							<Input id="media-title" bind:value={formData.title} placeholder="e.g. Team Alpha Jersey 2026" required class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
						</div>

						<div class="space-y-2">
							<Label for="media-type" class="text-slate-200">Asset Type *</Label>
							<select id="media-type" bind:value={formData.asset_type} onchange={handleAssetTypeChange} required class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
								{#each assetTypes as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
							<p class="text-xs text-slate-400">
								Required for this type:
								<span class="text-red-400 font-semibold"> {requiredLegendText()}</span>
							</p>
						</div>
					{/if}

					{#if currentStep === 1}
						<div class="grid grid-cols-1 gap-4">
							{#if isOwnershipFieldVisible('franchise')}
							<div class="space-y-2">
								<Label for="media-franchise" class="text-slate-200">
									Franchise{#if isFieldRequired('franchise')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-franchise" bind:value={formData.franchise} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									<option value="">None</option>
									{#each franchises as f}
										<option value={f.id}>{f.name}</option>
									{/each}
								</select>
							</div>
							{/if}

							{#if isOwnershipFieldVisible('team')}
							<div class="space-y-2">
								<Label for="media-team" class="text-slate-200">
									Team{#if isFieldRequired('team')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-team" bind:value={formData.team} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									<option value="">None</option>
									{#each franchises as f}
										<option value={f.id}>{f.name}</option>
									{/each}
								</select>
							</div>
							{/if}

							{#if isOwnershipFieldVisible('person')}
							<div class="space-y-2">
								<Label for="media-person" class="text-slate-200">
									Person{#if isFieldRequired('person')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-person" bind:value={formData.person} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									<option value="">None</option>
									{#each people as person}
										<option value={person.id}>{person.name || person.email}</option>
									{/each}
								</select>
							</div>
							{/if}

							{#if isOwnershipFieldVisible('sponsor')}
							<div class="space-y-2">
								<Label for="media-sponsor" class="text-slate-200">
									Sponsor{#if isFieldRequired('sponsor')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-sponsor" bind:value={formData.sponsor} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									<option value="">None</option>
									{#if (sponsors || []).length === 0}
										<option value="" disabled>No sponsors available</option>
									{:else}
										{#each sponsors || [] as sponsor}
											<option value={sponsor.id}>{sponsorLabel(sponsor)}</option>
										{/each}
									{/if}
								</select>
							</div>
							{/if}

							{#if isOwnershipFieldVisible('project')}
							<div class="space-y-2">
								<Label for="media-project" class="text-slate-200">
									Project{#if isFieldRequired('project')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-project" bind:value={formData.project} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									<option value="">None</option>
									{#each projects as p}
										<option value={p.id}>{p.name}</option>
									{/each}
								</select>
							</div>
							{/if}

							{#if isOwnershipFieldVisible('campaign')}
							<div class="space-y-2">
								<Label for="media-campaign" class="text-slate-200">
									Campaign{#if isFieldRequired('campaign')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-campaign" bind:value={formData.campaign} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									<option value="">None</option>
									{#each campaigns as c}
										<option value={c.id}>{c.name}</option>
									{/each}
								</select>
							</div>
							{/if}
						</div>
					{/if}

					{#if currentStep === 2}
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{#if isContextFieldVisible('category')}
							<div class="space-y-2">
								<Label for="media-category" class="text-slate-200">
									Category{#if isFieldRequired('category')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-category" bind:value={formData.category} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									{#each categoryOptions as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							</div>
							{/if}

							{#if isContextFieldVisible('status')}
							<div class="space-y-2">
								<Label for="media-status" class="text-slate-200">
									Status{#if isFieldRequired('status')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-status" bind:value={formData.status} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									{#each statusOptions as status}
										<option value={status}>{status}</option>
									{/each}
								</select>
							</div>
							{/if}

							{#if isContextFieldVisible('season')}
							<div class="space-y-2">
								<Label for="media-season" class="text-slate-200">
									Season{#if isFieldRequired('season')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-season" bind:value={formData.season} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									<option value="">None</option>
									{#each franchises as f}
										<option value={f.id}>{f.name}</option>
									{/each}
								</select>
							</div>
							{/if}

							{#if isContextFieldVisible('round')}
							<div class="space-y-2">
								<Label for="media-round" class="text-slate-200">
									Round{#if isFieldRequired('round')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-round" bind:value={formData.round} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									{#each roundOptions as round}
										<option value={round}>{round}</option>
									{/each}
								</select>
							</div>
							{/if}

							{#if isContextFieldVisible('shot_type')}
							<div class="space-y-2">
								<Label for="media-shot-type" class="text-slate-200">
									Shot Type{#if isFieldRequired('shot_type')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-shot-type" bind:value={formData.shot_type} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									{#each shotTypeOptions as shotType}
										<option value={shotType}>{shotType}</option>
									{/each}
								</select>
							</div>
							{/if}

							{#if isContextFieldVisible('moment')}
							<div class="space-y-2">
								<Label for="media-moment" class="text-slate-200">
									Moment{#if isFieldRequired('moment')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-moment" bind:value={formData.moment} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									{#each momentOptions as moment}
										<option value={moment}>{moment}</option>
									{/each}
								</select>
							</div>
							{/if}

							{#if isContextFieldVisible('visibility')}
							<div class="space-y-2 sm:col-span-2">
								<Label for="media-visibility" class="text-slate-200">
									Visibility{#if isFieldRequired('visibility')}<span class="ml-1 text-red-400 font-semibold">*</span>{/if}
								</Label>
								<select id="media-visibility" bind:value={formData.visibility} class="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500">
									{#each visibilityOptions as visibility}
										<option value={visibility}>{visibility}</option>
									{/each}
								</select>
							</div>
							{/if}
						</div>
					{/if}

					{#if currentStep === 3}
						<div class="space-y-2">
							<Label for="media-tags" class="text-slate-200">Tags</Label>
							<Input id="media-tags" bind:value={formData.tags} placeholder="e.g. 2026, home, blue" class="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400" />
							<p class="text-xs text-slate-500">Comma-separated</p>
						</div>

						<div class="space-y-2">
							<Label for="media-notes" class="text-slate-200">Notes</Label>
							<textarea id="media-notes" bind:value={formData.notes} placeholder="Additional context or usage notes" rows="4" class="flex w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"></textarea>
						</div>

						<div class="rounded-lg border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">
							<p class="font-medium text-white">Review</p>
							<p class="mt-2">Title: {formData.title || 'Untitled'}</p>
							<p>Type: {formData.asset_type}</p>
							{#if isContextFieldVisible('category')}<p>Category: {formData.category}</p>{/if}
							{#if isContextFieldVisible('status')}<p>Status: {formData.status}</p>{/if}
							{#if isContextFieldVisible('visibility')}<p>Visibility: {formData.visibility}</p>{/if}
							{#if isOwnershipFieldVisible('sponsor') && formData.sponsor}<p>Sponsor linked</p>{/if}
						</div>
					{/if}
				</div>
			</div>

			<Sheet.Footer class="flex gap-2 pt-6 border-t border-slate-700 mt-6">
				<Button
					type="button"
					variant="outline"
					onclick={currentVisibleIndex() === 0 ? () => (open = false) : prevStep}
					disabled={isSubmitting}
					class="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
				>
					<X class="size-4 mr-2" />
					{currentVisibleIndex() === 0 ? 'Cancel' : 'Back'}
				</Button>
				<Button
					type={isFinalVisibleStep() ? 'submit' : 'button'}
					onclick={isFinalVisibleStep() ? undefined : nextStep}
					disabled={isSubmitting || !stepIsValid(currentStep)}
					class="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
				>
					<Save class="size-4 mr-2" />
					{#if isFinalVisibleStep()}
						{isSubmitting ? 'Uploading...' : 'Upload'}
					{:else}
						Next
					{/if}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
