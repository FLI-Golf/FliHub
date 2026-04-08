<script lang="ts">
	import { CheckCircle, Download, FileText, ChevronDown, ChevronUp } from 'lucide-svelte';
	import SignaturePad from './SignaturePad.svelte';

	interface Props {
		documentType: string;
		title: string;
		description: string;
		content: string; // HTML or plain text body of the document
		requiresSignature?: boolean; // full signature vs initials only
		signed?: boolean;
		initials?: string;
		signatureDataUrl?: string;
		onSign?: (data: { initials: string; signatureDataUrl: string; agreed: boolean }) => void;
	}

	let {
		documentType,
		title,
		description,
		content,
		requiresSignature = false,
		signed = $bindable(false),
		initials = $bindable(''),
		signatureDataUrl = $bindable(''),
		onSign
	}: Props = $props();

	let expanded = $state(false);
	let agreed = $state(false);
	let localInitials = $state(initials);
	let localSig = $state(signatureDataUrl);
	let submitting = $state(false);
	let error = $state('');

	function handleSign() {
		error = '';
		if (!localInitials.trim()) {
			error = 'Please enter your initials.';
			return;
		}
		if (requiresSignature && !localSig) {
			error = 'Please draw your signature.';
			return;
		}
		if (!agreed) {
			error = 'Please confirm you have read and agree to this document.';
			return;
		}

		submitting = true;
		onSign?.({ initials: localInitials.trim().toUpperCase(), signatureDataUrl: localSig, agreed });
		initials = localInitials.trim().toUpperCase();
		signatureDataUrl = localSig;
		signed = true;
		submitting = false;
	}

	function downloadDocument() {
		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${documentType}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="border-2 rounded-xl overflow-hidden {signed ? 'border-emerald-300 dark:border-emerald-700' : 'border-border'}">
	<!-- Header -->
	<div class="flex items-center gap-4 p-5 {signed ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-card'}">
		<div class="flex items-center justify-center w-10 h-10 rounded-xl {signed ? 'bg-emerald-500' : 'bg-muted'} shrink-0">
			{#if signed}
				<CheckCircle class="w-5 h-5 text-white" />
			{:else}
				<FileText class="w-5 h-5 text-muted-foreground" />
			{/if}
		</div>

		<div class="flex-1 min-w-0">
			<h3 class="font-bold text-base {signed ? 'text-emerald-800 dark:text-emerald-200' : 'text-foreground'}">{title}</h3>
			<p class="text-sm text-muted-foreground">{description}</p>
		</div>

		<div class="flex items-center gap-2 shrink-0">
			{#if signed}
				<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
					<CheckCircle class="w-3 h-3" /> Signed
				</span>
				<button
					type="button"
					onclick={downloadDocument}
					class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
					title="Download document"
				>
					<Download class="w-3 h-3" /> Download
				</button>
			{/if}
			<button
				type="button"
				onclick={() => (expanded = !expanded)}
				class="p-1.5 rounded-lg hover:bg-muted transition-colors"
			>
				{#if expanded}
					<ChevronUp class="w-4 h-4 text-muted-foreground" />
				{:else}
					<ChevronDown class="w-4 h-4 text-muted-foreground" />
				{/if}
			</button>
		</div>
	</div>

	<!-- Expanded content -->
	{#if expanded}
		<div class="border-t border-border">
			<!-- Document body -->
			<div class="p-5 bg-muted/20 max-h-72 overflow-y-auto">
				<div class="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground/80">
					{content}
				</div>
			</div>

			{#if !signed}
				<!-- Signing area -->
				<div class="p-5 bg-card border-t border-border space-y-4">
					<h4 class="font-semibold text-sm">Sign this document</h4>

					<!-- Initials -->
					<div>
						<label for="initials-{documentType}" class="block text-sm font-medium mb-1.5">
							Your Initials <span class="text-rose-500">*</span>
						</label>
						<input
							id="initials-{documentType}"
							type="text"
							bind:value={localInitials}
							maxlength="5"
							placeholder="e.g. JD"
							class="w-32 px-3 py-2 border-2 border-input rounded-lg text-center text-lg font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
						/>
					</div>

					{#if requiresSignature}
						<SignaturePad
							bind:value={localSig}
							label="Full Signature"
						/>
					{/if}

					<!-- Agreement checkbox -->
					<label class="flex items-start gap-3 cursor-pointer group">
						<input
							type="checkbox"
							bind:checked={agreed}
							class="mt-0.5 w-4 h-4 rounded border-2 border-input accent-black cursor-pointer"
						/>
						<span class="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
							I confirm that I have read, understood, and agree to the terms of this document. I acknowledge that my initials{requiresSignature ? ' and signature' : ''} constitute a legally binding electronic signature.
						</span>
					</label>

					{#if error}
						<p class="text-sm text-rose-600 font-medium">{error}</p>
					{/if}

					<button
						type="button"
						onclick={handleSign}
						disabled={submitting}
						class="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
					>
						{#if submitting}
							Saving…
						{:else}
							Confirm & Sign
						{/if}
					</button>
				</div>
			{:else}
				<!-- Signed confirmation -->
				<div class="p-5 bg-emerald-50 dark:bg-emerald-950/20 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<CheckCircle class="w-5 h-5 text-emerald-600" />
						<div>
							<p class="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Signed with initials: <span class="font-black tracking-widest">{initials}</span></p>
							<p class="text-xs text-emerald-600 dark:text-emerald-400">Electronic signature recorded</p>
						</div>
					</div>
					<button
						type="button"
						onclick={downloadDocument}
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
					>
						<Download class="w-3.5 h-3.5" /> Download Copy
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
