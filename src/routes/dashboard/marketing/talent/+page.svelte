<script lang="ts">
	import type { PageData } from './$types';
	import { UserCircle, Instagram, Twitter, Youtube, TrendingUp, Star, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const fmt = (n: number) => n >= 1_000_000
		? (n / 1_000_000).toFixed(1) + 'M'
		: n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : String(n ?? 0);

	const STATUS_LABELS: Record<string, string> = {
		primary_pro: 'Primary Pro', reserve_pro: 'Reserve Pro', active: 'Active'
	};

	const AMBASSADOR_CONFIG: Record<string, { label: string; class: string; icon: any }> = {
		active:    { label: 'Ambassador',  class: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50', icon: CheckCircle2 },
		prospect:  { label: 'Prospect',    class: 'bg-amber-900/40 text-amber-300 border-amber-700/50',       icon: Clock },
		inactive:  { label: 'Inactive',    class: 'bg-slate-700/40 text-slate-400 border-slate-600',          icon: AlertCircle },
		declined:  { label: 'Declined',    class: 'bg-red-900/30 text-red-400 border-red-800/50',             icon: AlertCircle },
	};

	const totalFollowers  = $derived(data.talent.reduce((s: number, t: any) => s + (t.marketing?.followerCount ?? 0), 0));
	const avgEngagement   = $derived(() => {
		const withEng = data.ambassadors.filter((t: any) => t.marketing?.engagementRate > 0);
		if (!withEng.length) return 0;
		return withEng.reduce((s: number, t: any) => s + t.marketing.engagementRate, 0) / withEng.length;
	});
</script>

<svelte:head><title>Talent & Ambassadors — Marketing</title></svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-slate-100">Talent & Ambassadors</h1>
		<p class="text-sm text-slate-400 mt-0.5">Track ambassador status, social reach, and content deliverables across the FLI Golf roster.</p>
	</div>

	<!-- KPIs -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
		{#each [
			{ label: 'Ambassadors',    value: String(data.ambassadors.length),  sub: 'active',           cls: 'border-emerald-800/50' },
			{ label: 'Prospects',      value: String(data.prospects.length),    sub: 'being evaluated',  cls: 'border-amber-800/50'   },
			{ label: 'Total Reach',    value: fmt(totalFollowers),              sub: 'combined followers', cls: 'border-slate-700'    },
			{ label: 'Untracked',      value: String(data.untracked.length),    sub: 'no profile yet',   cls: 'border-slate-700'      },
		] as kpi}
			<div class="rounded-xl border {kpi.cls} bg-slate-800/50 px-4 py-3">
				<p class="text-xs text-slate-500">{kpi.label}</p>
				<p class="text-xl font-bold text-slate-100 mt-0.5">{kpi.value}</p>
				<p class="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</p>
			</div>
		{/each}
	</div>

	<!-- Ambassadors -->
	{#if data.ambassadors.length > 0}
	<div>
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Active Ambassadors</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each data.ambassadors as t (t.id)}
				{@const m = t.marketing}
				<div class="rounded-xl border border-emerald-700/30 bg-slate-900/60 p-4 space-y-3">
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-center gap-3">
							<div class="size-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
								<UserCircle class="size-6 text-slate-400" />
							</div>
							<div>
								<p class="font-semibold text-slate-100 text-sm">{t.name}</p>
								<p class="text-xs text-slate-500">{STATUS_LABELS[t.status] ?? t.status} · {t.gender === 'female' ? 'FPO' : 'MPO'}</p>
							</div>
						</div>
						<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-900/40 text-emerald-300 border-emerald-700/50">
							<CheckCircle2 class="size-2.5" /> Ambassador
						</span>
					</div>

					<!-- Social -->
					<div class="flex flex-wrap gap-2 text-xs text-slate-400">
						{#if m?.instagramHandle}
							<span class="flex items-center gap-1"><Instagram class="size-3" /> {m.instagramHandle}</span>
						{/if}
						{#if m?.tiktokHandle}
							<span class="flex items-center gap-1"><TrendingUp class="size-3" /> {m.tiktokHandle}</span>
						{/if}
						{#if m?.twitterHandle}
							<span class="flex items-center gap-1"><Twitter class="size-3" /> {m.twitterHandle}</span>
						{/if}
						{#if m?.youtubeHandle}
							<span class="flex items-center gap-1"><Youtube class="size-3" /> {m.youtubeHandle}</span>
						{/if}
					</div>

					<!-- Stats -->
					<div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50">
						<div class="text-center">
							<p class="text-xs font-bold text-slate-200">{fmt(m?.followerCount ?? 0)}</p>
							<p class="text-[10px] text-slate-600">Followers</p>
						</div>
						<div class="text-center">
							<p class="text-xs font-bold text-slate-200">{m?.engagementRate ? m.engagementRate.toFixed(1) + '%' : '—'}</p>
							<p class="text-[10px] text-slate-600">Engagement</p>
						</div>
						<div class="text-center">
							<p class="text-xs font-bold {(m?.deliverablesMet ?? 0) >= (m?.contentDeliverables ?? 0) && (m?.contentDeliverables ?? 0) > 0 ? 'text-emerald-400' : 'text-slate-200'}">
								{m?.deliverablesMet ?? 0}/{m?.contentDeliverables ?? 0}
							</p>
							<p class="text-[10px] text-slate-600">Posts/mo</p>
						</div>
					</div>

					{#if t.sponsoredBy}
						<p class="text-[10px] text-slate-600">Disc sponsor: {t.sponsoredBy}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
	{/if}

	<!-- Prospects -->
	{#if data.prospects.length > 0}
	<div>
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Prospects</h2>
		<div class="rounded-xl border border-slate-700 overflow-hidden">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-700 bg-slate-800/60">
						<th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
						<th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Division</th>
						<th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Followers</th>
						<th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Disc Sponsor</th>
						<th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-700/60">
					{#each data.prospects as t (t.id)}
						<tr class="bg-slate-900/30 hover:bg-slate-800/40 transition-colors">
							<td class="px-4 py-3 font-medium text-slate-200">{t.name}</td>
							<td class="px-4 py-3 text-slate-400 hidden sm:table-cell">{t.gender === 'female' ? 'FPO' : 'MPO'}</td>
							<td class="px-4 py-3 text-slate-300">{fmt(t.marketing?.followerCount ?? 0)}</td>
							<td class="px-4 py-3 text-slate-400 hidden md:table-cell">{t.sponsoredBy || '—'}</td>
							<td class="px-4 py-3 text-slate-500 text-xs">{t.marketing?.notes || '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
	{/if}

	<!-- Full roster (untracked) -->
	<div>
		<h2 class="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Full Roster — No Marketing Profile</h2>
		<div class="rounded-xl border border-slate-700 overflow-hidden">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-700 bg-slate-800/60">
						<th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
						<th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Type</th>
						<th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Division</th>
						<th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
						<th class="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Disc Sponsor</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-700/60">
					{#each data.untracked as t (t.id)}
						<tr class="bg-slate-900/30 hover:bg-slate-800/40 transition-colors">
							<td class="px-4 py-3 font-medium text-slate-200">{t.name}</td>
							<td class="px-4 py-3 text-slate-400 capitalize hidden sm:table-cell">{t.talentType}</td>
							<td class="px-4 py-3 text-slate-400 hidden sm:table-cell">{t.gender === 'female' ? 'FPO' : 'MPO'}</td>
							<td class="px-4 py-3">
								<span class="text-xs text-slate-400">{STATUS_LABELS[t.status] ?? t.status}</span>
							</td>
							<td class="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{t.sponsoredBy || '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
