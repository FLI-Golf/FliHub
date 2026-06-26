<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { browser } from '$app/environment';
	import { CheckCircle2, ChevronLeft, ChevronRight, Save, User } from 'lucide-svelte';
	import { getProfileWizard, type WizardField } from '$lib/domain/profile-wizard/ProfileWizard';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const config = $derived((data as any).portalConfig);
	const role = $derived((data as any).portalRole ?? 'leader');
	const wizardData = $derived({
		role,
		profile: (data as any).profile,
		roleExtra: (data as any).roleExtra ?? {},
		proTalent: (data as any).proTalent ?? null,
		proTalentMeta: (data as any).proTalentMeta ?? { linked: false, matchedByEmail: false },
	});

	const adapter = $derived(getProfileWizard(role));
	const wizardHeader = $derived(adapter.getHeader(wizardData));
	const steps = $derived(adapter.getSteps(wizardData));
	const initialValues = $derived(adapter.getInitialValues(wizardData));
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-violet-400');
	const accentBorder = $derived(config?.accentTw?.split(' ')[1] ?? 'border-violet-500');

	let currentStepIndex = $state(0);
	let saving = $state(false);
	let stepError = $state('');
	let values = $state<Record<string, string>>({});
	let didInitStep = $state(false);

	$effect(() => {
		values = { ...initialValues };
		stepError = '';
	});

	const currentStep = $derived(steps[currentStepIndex]);
	const totalSteps = $derived(steps.length);
	const progressPct = $derived(totalSteps > 0 ? Math.round(((currentStepIndex + 1) / totalSteps) * 100) : 0);
	const allFields = $derived(steps.flatMap((step) => step.fields));
	const stepStorageKey = $derived(`portal-profile-step:${role}`);

	function clampStepIndex(value: number): number {
		if (!Number.isFinite(value)) return 0;
		if (value < 0) return 0;
		if (value > totalSteps - 1) return totalSteps - 1;
		return value;
	}

	$effect(() => {
		if (!browser || didInitStep || totalSteps <= 0) return;

		const params = new URLSearchParams(window.location.search);
		const fromUrlRaw = Number(params.get('step') ?? '');
		const fromUrl = Number.isFinite(fromUrlRaw) && fromUrlRaw > 0
			? clampStepIndex(fromUrlRaw - 1)
			: null;

		const fromStorageRaw = Number(window.localStorage.getItem(stepStorageKey) ?? '');
		const fromStorage = Number.isFinite(fromStorageRaw)
			? clampStepIndex(fromStorageRaw)
			: 0;

		currentStepIndex = fromUrl ?? fromStorage;
		didInitStep = true;
	});

	$effect(() => {
		if (!browser || !didInitStep || totalSteps <= 0) return;

		window.localStorage.setItem(stepStorageKey, String(currentStepIndex));

		const nextUrl = new URL(window.location.href);
		nextUrl.searchParams.set('step', String(currentStepIndex + 1));
		window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}`);
	});

	function updateValue(key: string, value: string) {
		values[key] = value;
	}

	function inputType(field: WizardField): string {
		switch (field.type) {
			case 'email':
			case 'tel':
			case 'number':
			case 'date':
			case 'hidden':
				return field.type;
			default:
				return 'text';
		}
	}

	function canNavigateToNext(): boolean {
		if (!currentStep) return false;
		const err = adapter.validateStep(currentStep, values);
		stepError = err ?? '';
		return !err;
	}

	function isCurrentStepValid(): boolean {
		if (!currentStep) return false;
		return !adapter.validateStep(currentStep, values);
	}

	function nextStep() {
		if (currentStepIndex >= totalSteps - 1) return;
		if (!canNavigateToNext()) return;
		currentStepIndex += 1;
		stepError = '';
	}

	function prevStep() {
		if (currentStepIndex <= 0) return;
		currentStepIndex -= 1;
		stepError = '';
	}

	function isReadOnly(field: WizardField): boolean {
		return !!field.readOnly;
	}

	function shouldSubmitField(field: WizardField): boolean {
		if (field.readOnly) return false;
		if (field.key === 'email') return false;
		return true;
	}
</script>

<svelte:head><title>{wizardHeader.title} — {config?.label} Portal · FliHub</title></svelte:head>

<div class="space-y-6 max-w-3xl">
	<div class="flex items-center gap-3">
		<div class="size-10 rounded-xl bg-gradient-to-br {config?.logoGradient} flex items-center justify-center shadow">
			<User class="size-5 text-white" />
		</div>
		<div>
			<h1 class="text-xl font-bold text-white">{wizardHeader.title}</h1>
			<p class="text-xs {accentText} font-semibold uppercase tracking-widest">{config?.label} · {wizardHeader.subtitle ?? config?.tagline}</p>
		</div>
	</div>

		{#if role === 'pro' || role === 'manager' || role === 'broadcaster'}
			<div class="bg-sky-950/30 border border-sky-700/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
				<div>
					<p class="text-sm font-semibold text-sky-300">Need the full long-form profile?</p>
					<p class="text-xs text-sky-200/80">Use the full onboarding form to complete all player profile fields over time.</p>
				</div>
				<a
					href="/portal/player-profile"
					class="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold bg-sky-500 text-white hover:bg-sky-400 transition-colors"
				>
					Open Full Player Profile
				</a>
			</div>
		{/if}

	<div class="bg-slate-900 border border-slate-800 rounded-xl p-5">
		<div class="flex items-center justify-between mb-2">
			<p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Step {currentStepIndex + 1} of {totalSteps}</p>
			<p class="text-xs text-slate-500">{progressPct}%</p>
		</div>
		<div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
			<div class="h-full bg-gradient-to-r {config?.logoGradient} transition-all duration-300" style="width: {progressPct}%"></div>
		</div>
	</div>

	{#if form?.success}
		<div class="rounded-lg bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 text-sm px-4 py-3 flex items-center gap-2">
			<CheckCircle2 class="size-4" />
			Profile progress saved successfully.
		</div>
	{/if}
	{#if form?.error}
		<div class="rounded-lg bg-red-950/40 border border-red-700/50 text-red-300 text-sm px-4 py-3">
			{form.error}
		</div>
	{/if}
	{#if stepError}
		<div class="rounded-lg bg-amber-950/40 border border-amber-700/50 text-amber-300 text-sm px-4 py-3">
			{stepError}
		</div>
	{/if}

	<form
		method="POST"
		action="?/update"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
			};
		}}
		class="space-y-6"
	>
		{#each allFields as field (field.key)}
			{#if shouldSubmitField(field)}
				<input type="hidden" name={field.key} value={values[field.key] ?? ''} />
			{/if}
		{/each}

		<div class="bg-slate-900 border {accentBorder}/30 rounded-xl p-6 space-y-4">
			<h2 class="text-sm font-bold text-slate-200">{currentStep?.title}</h2>
			{#if currentStep?.description}
				<p class="text-xs text-slate-500">{currentStep.description}</p>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each currentStep?.fields ?? [] as field (field.key)}
					{#if field.type === 'hidden'}
						<!-- hidden step field -->
					{:else}
						<div class={field.type === 'textarea' ? 'md:col-span-2' : ''}>
							<label class="block text-xs font-medium text-slate-400 mb-1.5" for={field.key}>
								{field.label}{#if field.required}<span class="text-red-400"> *</span>{/if}
							</label>

							{#if field.type === 'textarea'}
								<textarea
									id={field.key}
									rows={field.rows ?? 3}
									value={values[field.key] ?? ''}
									oninput={(e) => updateValue(field.key, (e.currentTarget as HTMLTextAreaElement).value)}
									placeholder={field.placeholder ?? ''}
									readonly={isReadOnly(field)}
									class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100
										focus:outline-none focus:ring-1 focus:border-slate-500 placeholder:text-slate-600 resize-none
										{isReadOnly(field) ? 'opacity-70 cursor-not-allowed' : ''}"
								></textarea>
							{:else if field.type === 'select'}
								<select
									id={field.key}
									value={values[field.key] ?? ''}
									onchange={(e) => updateValue(field.key, (e.currentTarget as HTMLSelectElement).value)}
									disabled={isReadOnly(field)}
									class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100
										focus:outline-none focus:ring-1 focus:border-slate-500
										{isReadOnly(field) ? 'opacity-70 cursor-not-allowed' : ''}"
								>
									<option value="">Select…</option>
									{#each field.options ?? [] as option}
										<option value={option.value}>{option.label}</option>
									{/each}
								</select>
							{:else}
								<input
									id={field.key}
									type={inputType(field)}
									value={values[field.key] ?? ''}
									oninput={(e) => updateValue(field.key, (e.currentTarget as HTMLInputElement).value)}
									placeholder={field.placeholder ?? ''}
									readonly={isReadOnly(field)}
									min={field.min}
									max={field.max}
									step={field.step}
									class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100
										focus:outline-none focus:ring-1 focus:border-slate-500 placeholder:text-slate-600
										{isReadOnly(field) ? 'opacity-70 cursor-not-allowed' : ''}"
								/>
							{/if}

							{#if field.helpText}
								<p class="text-[11px] text-slate-600 mt-1">{field.helpText}</p>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<div class="flex items-center justify-between gap-3">
			<button
				type="button"
				onclick={prevStep}
				disabled={currentStepIndex === 0 || saving}
				class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-sm text-slate-300
					hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<ChevronLeft class="size-4" /> Back
			</button>

			<div class="flex items-center gap-2">
				<button
					type="submit"
					disabled={saving}
					class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-300
						hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<Save class="size-4" /> {saving ? 'Saving…' : 'Save Progress'}
				</button>

				{#if currentStepIndex < totalSteps - 1}
					<button
						type="button"
						onclick={nextStep}
						disabled={saving}
						class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
							bg-gradient-to-r {config?.logoGradient} hover:opacity-90 transition-opacity shadow-lg
							disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next <ChevronRight class="size-4" />
					</button>
				{:else}
					<button
						type="submit"
						disabled={saving || !isCurrentStepValid()}
						class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
							bg-gradient-to-r {config?.logoGradient} hover:opacity-90 transition-opacity shadow-lg
							disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Save class="size-4" /> {saving ? 'Saving…' : 'Save Profile'}
					</button>
				{/if}
			</div>
		</div>
	</form>
</div>
