<script lang="ts">
	import type { PageData } from './$types';
	import { Handshake, Mail, Phone, MapPin } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const config = $derived((data as any).portalConfig);
	const sponsors = $derived((data as any).sponsors ?? []);
	const accentText = $derived(config?.accentTw?.split(' ')[0] ?? 'text-orange-400');

	function statusStyle(status: string) {
		const styles: Record<string, string> = {
			active:     'bg-emerald-950/50 text-emerald-300 border-emerald-700/50',
			prospect:   'bg-blue-950/50 text-blue-300 border-blue-700/50',
			completed:  'bg-slate-700/50 text-slate-300 border-slate-600/50',
			paused:     'bg-amber-950/50 text-amber-300 border-amber-700/50',
		};
		return styles[status] ?? 'bg-slate-800/50 text-slate-300 border-slate-700/50';
	}
</script>

<svelte:head><title>Sponsorships — Marketing Portal · FliHub</title></svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-white flex items-center gap-2">
		<Handshake class="size-6 {accentText}" /> Sponsorships
	</h1>

	{#if sponsors.length === 0}
		<div class="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center">
			<Handshake class="size-10 text-slate-700 mx-auto mb-3" />
			<p class="text-sm text-slate-500">No sponsors yet.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each sponsors as sponsor}
				<a href={`/portal/marketing/sponsors/${sponsor.id}`} class="block">
					<div class="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-orange-500/10">
						<div class="flex items-start justify-between gap-3 mb-3">
							<div class="min-w-0">
								<h3 class="font-semibold text-white truncate">{sponsor.companyName ?? 'Untitled'}</h3>
								<p class="text-xs text-slate-400 mt-1 truncate">{sponsor.primaryContactName ?? 'No contact'}</p>
							</div>
							<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border shrink-0 {statusStyle(sponsor.status)}">
								{sponsor.status ?? 'prospect'}
							</span>
						</div>

						<div class="space-y-2">
							{#if sponsor.primaryContactEmail}
								<div class="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300">
									<Mail class="size-3.5 shrink-0" />
									<a href={`mailto:${sponsor.primaryContactEmail}`} class="truncate">{sponsor.primaryContactEmail}</a>
								</div>
							{/if}
							{#if sponsor.primaryContactPhone}
								<div class="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-300">
									<Phone class="size-3.5 shrink-0" />
									<a href={`tel:${sponsor.primaryContactPhone}`}>{sponsor.primaryContactPhone}</a>
								</div>
							{/if}
							{#if sponsor.location}
								<div class="flex items-center gap-2 text-xs text-slate-400">
									<MapPin class="size-3.5 shrink-0" />
									<span>{sponsor.location}</span>
								</div>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
