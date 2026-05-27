<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData } from './$types';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const pro = data.pro;

	let open = $state<Record<string, boolean>>({
		stats: true, contact: true, profile: true, performance: true,
		career: true, manager: true, social: true, travel: true,
		health: true, personal: true, tournaments: false, payments: false
	});
	const toggle = (key: string) => { open[key] = !open[key]; };

	const fmt$ = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
	const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
	const statusColor = (s: string) => ({ primary_pro: 'bg-green-600 text-white', reserve_pro: 'bg-yellow-600 text-white', active: 'bg-green-600 text-white', inactive: 'bg-gray-600 text-white', retired: 'bg-blue-600 text-white' }[s] ?? 'bg-gray-600 text-white');
	const statusLabel = (s: string) => ({ primary_pro: 'Primary Pro', reserve_pro: 'Reserve Pro' }[s] ?? (s ? s.charAt(0).toUpperCase() + s.slice(1) : ''));
	const badge = (n: number) => n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : `${n}th`;
	const talentTypes: string[] = Array.isArray(pro.talentType) ? pro.talentType : pro.talentType ? [pro.talentType] : ['player'];
</script>

<div class="container mx-auto p-6 space-y-3 max-w-5xl">

<!-- HEADER -->
<div class="flex items-start justify-between mb-2">
	<div class="flex items-start gap-5">
		{#if pro.avatar}
			<img src={pro.avatar} alt={pro.name} class="w-24 h-24 rounded-full object-cover border-4 border-gray-600 shadow-lg" />
		{:else}
			<div class="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-3xl border-4 border-gray-600">{pro.name?.charAt(0) ?? '?'}</div>
		{/if}
		<div>
			<h1 class="text-3xl font-bold text-white">{pro.name}</h1>
			{#if pro.nickname}<p class="text-gray-400 mt-0.5">"{pro.nickname}"</p>{/if}
			<div class="flex flex-wrap gap-2 mt-2">
				{#if pro.status}<Badge class={statusColor(pro.status)}>{statusLabel(pro.status)}</Badge>{/if}
				{#if pro.gender}<Badge variant="outline">{pro.gender === 'male' ? '♂ Male' : pro.gender === 'female' ? '♀ Female' : pro.gender}</Badge>{/if}
				{#if pro.worldRanking}<Badge variant="outline">Rank #{pro.worldRanking}</Badge>{/if}
				{#each talentTypes as tt}<Badge class="bg-purple-700 text-white capitalize">{tt}</Badge>{/each}
			</div>
			<div class="flex flex-wrap gap-4 mt-1.5 text-sm text-gray-400">
				{#if pro.hometown}<span>📍 {pro.hometown}</span>{/if}
				{#if pro.country}<span>🌍 {pro.country}</span>{/if}
				{#if pro.yearTurnedPro}<span>📅 Pro since {pro.yearTurnedPro}</span>{/if}
				{#if pro.careerEarnings}<span>💰 {pro.careerEarnings} career earnings</span>{/if}
			</div>
		</div>
	</div>
	<div class="flex gap-2 shrink-0">
		<Button href="/dashboard/talent" variant="outline">← Back</Button>
		<Button href="/dashboard/talent/{pro.id}/edit">Edit</Button>
	</div>
</div>

<!-- CAREER STATS -->
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('stats')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Career Statistics</span>
		{#if open.stats}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.stats}
	<div class="p-5 bg-gray-800/50 border-t border-gray-700">
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
			<div class="text-center p-3 bg-green-900/40 rounded-lg border border-green-800">
				<div class="text-xl font-bold text-green-400">{fmt$(data.stats.totalEarnings)}</div>
				<div class="text-xs text-gray-400 mt-1">FLI Earnings</div>
			</div>
			<div class="text-center p-3 bg-blue-900/40 rounded-lg border border-blue-800">
				<div class="text-xl font-bold text-blue-400">{data.stats.tournamentsPlayed}</div>
				<div class="text-xs text-gray-400 mt-1">Tournaments</div>
			</div>
			<div class="text-center p-3 bg-yellow-900/40 rounded-lg border border-yellow-800">
				<div class="text-xl font-bold text-yellow-400">🏆 {data.stats.wins}</div>
				<div class="text-xs text-gray-400 mt-1">Wins</div>
			</div>
			<div class="text-center p-3 bg-orange-900/40 rounded-lg border border-orange-800">
				<div class="text-xl font-bold text-orange-400">{data.stats.podiums}</div>
				<div class="text-xs text-gray-400 mt-1">Podiums</div>
			</div>
			<div class="text-center p-3 bg-purple-900/40 rounded-lg border border-purple-800">
				<div class="text-xl font-bold text-purple-400">{data.stats.topTens}</div>
				<div class="text-xs text-gray-400 mt-1">Top 10s</div>
			</div>
			<div class="text-center p-3 bg-slate-700/40 rounded-lg border border-slate-600">
				<div class="text-xl font-bold text-slate-300">{data.stats.avgPlacement > 0 ? data.stats.avgPlacement.toFixed(1) : '—'}</div>
				<div class="text-xs text-gray-400 mt-1">Avg Place</div>
			</div>
		</div>
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-700 text-sm">
			{#if pro.careerWins}<div><div class="text-gray-400">Career Wins (all)</div><div class="font-semibold text-white">{pro.careerWins}</div></div>{/if}
			<div><div class="text-gray-400">Best Finish</div><div class="font-semibold text-white">{data.stats.bestPlacement ? badge(data.stats.bestPlacement) : '—'}</div></div>
			<div><div class="text-gray-400">2nd Place</div><div class="font-semibold text-white">🥈 {data.stats.secondPlace}</div></div>
			<div><div class="text-gray-400">Top 5s</div><div class="font-semibold text-white">{data.stats.topFives}</div></div>
			{#if pro.avgDriveDistance}<div><div class="text-gray-400">Avg Drive</div><div class="font-semibold text-white">{pro.avgDriveDistance}</div></div>{/if}
			{#if pro.circle1Pct}<div><div class="text-gray-400">Circle 1 %</div><div class="font-semibold text-white">{pro.circle1Pct}</div></div>{/if}
			{#if pro.circle2Pct}<div><div class="text-gray-400">Circle 2 %</div><div class="font-semibold text-white">{pro.circle2Pct}</div></div>{/if}
			{#if pro.fairwayPct}<div><div class="text-gray-400">Fairway %</div><div class="font-semibold text-white">{pro.fairwayPct}</div></div>{/if}
			{#if pro.puttPct}<div><div class="text-gray-400">Putt %</div><div class="font-semibold text-white">{pro.puttPct}</div></div>{/if}
		</div>
	</div>
	{/if}
</div>

<!-- CONTACT INFO -->
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('contact')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Contact Information</span>
		{#if open.contact}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.contact}
	<div class="p-5 bg-gray-800/50 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
		{#if pro.email}<div><div class="text-gray-400">Email</div><a href="mailto:{pro.email}" class="text-blue-400 hover:underline">{pro.email}</a></div>{/if}
		{#if pro.phone}<div><div class="text-gray-400">Phone</div><div class="text-white">{pro.phone}</div></div>{/if}
		{#if pro.residence}<div><div class="text-gray-400">Residence</div><div class="text-white">{pro.residence}</div></div>{/if}
		{#if pro.hometown}<div><div class="text-gray-400">Hometown</div><div class="text-white">{pro.hometown}</div></div>{/if}
		{#if pro.geolocation}<div><div class="text-gray-400">Geolocation</div><div class="text-white">{pro.geolocation}</div></div>{/if}
		{#if pro.emergencyContact}<div><div class="text-gray-400">Emergency Contact</div><div class="text-white">{pro.emergencyContact}</div></div>{/if}
	</div>
	{/if}
</div>

<!-- PROFILE -->
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('profile')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Player Profile</span>
		{#if open.profile}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.profile}
	<div class="p-5 bg-gray-800/50 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
		{#if pro.dateOfBirth}<div><div class="text-gray-400">Date of Birth</div><div class="text-white">{fmtDate(pro.dateOfBirth)}</div></div>{/if}
		{#if pro.height}<div><div class="text-gray-400">Height</div><div class="text-white">{pro.height}</div></div>{/if}
		{#if pro.weight}<div><div class="text-gray-400">Weight</div><div class="text-white">{pro.weight}</div></div>{/if}
		{#if pro.yearsPlayingDiscGolf}<div><div class="text-gray-400">Years Playing</div><div class="text-white">{pro.yearsPlayingDiscGolf}</div></div>{/if}
		{#if pro.yearTurnedPro}<div><div class="text-gray-400">Year Turned Pro</div><div class="text-white">{pro.yearTurnedPro}</div></div>{/if}
		{#if pro.sponsoredBy}<div><div class="text-gray-400">Sponsored By</div><div class="text-white">{pro.sponsoredBy}</div></div>{/if}
		{#if pro.primarySponsor}<div><div class="text-gray-400">Primary Sponsor</div><div class="text-white">{pro.primarySponsor}</div></div>{/if}
		{#if pro.favoriteDisc}<div><div class="text-gray-400">Favorite Disc</div><div class="text-white">{pro.favoriteDisc}</div></div>{/if}
		{#if pro.signatureMove}<div><div class="text-gray-400">Signature Move</div><div class="text-white">{pro.signatureMove}</div></div>{/if}
		{#if pro.injured !== undefined && pro.injured !== null}<div><div class="text-gray-400">Currently Injured</div><div class="text-white">{pro.injured ? '⚠️ Yes' : '✅ No'}</div></div>{/if}
		{#if pro.education}<div><div class="text-gray-400">Education</div><div class="text-white">{pro.education}</div></div>{/if}
	</div>
	{/if}
</div>

<!-- MANAGER / AGENT -->
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('manager')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Manager / Agent</span>
		{#if open.manager}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.manager}
	<div class="p-5 bg-gray-800/50 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
		{#if pro.managerName}<div><div class="text-gray-400">Name</div><div class="text-white">{pro.managerName}</div></div>{/if}
		{#if pro.managerEmail}<div><div class="text-gray-400">Email</div><a href="mailto:{pro.managerEmail}" class="text-blue-400 hover:underline">{pro.managerEmail}</a></div>{/if}
		{#if pro.managerPhone}<div><div class="text-gray-400">Phone</div><div class="text-white">{pro.managerPhone}</div></div>{/if}
		{#if pro.managerCutPercentage}<div><div class="text-gray-400">Cut %</div><div class="text-white">{pro.managerCutPercentage}%</div></div>{/if}
		{#if !pro.managerName && !pro.managerEmail && !pro.managerPhone}<div class="col-span-3 text-gray-500">No manager on file</div>{/if}
	</div>
	{/if}
</div>

<!-- SOCIAL MEDIA -->
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('social')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Social Media & Web</span>
		{#if open.social}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.social}
	<div class="p-5 bg-gray-800/50 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
		{#if pro.instagram}<div><div class="text-gray-400">Instagram</div><a href="https://instagram.com/{pro.instagram.replace('@','')}" target="_blank" rel="noopener" class="text-blue-400 hover:underline">{pro.instagram}</a></div>{/if}
		{#if pro.twitter}<div><div class="text-gray-400">Twitter / X</div><a href="https://x.com/{pro.twitter.replace('@','')}" target="_blank" rel="noopener" class="text-blue-400 hover:underline">{pro.twitter}</a></div>{/if}
		{#if pro.facebook}<div><div class="text-gray-400">Facebook</div><a href="{pro.facebook}" target="_blank" rel="noopener" class="text-blue-400 hover:underline">{pro.facebook}</a></div>{/if}
		{#if pro.youtube}<div><div class="text-gray-400">YouTube</div><a href="{pro.youtube}" target="_blank" rel="noopener" class="text-blue-400 hover:underline">{pro.youtube}</a></div>{/if}
		{#if pro.tiktok}<div><div class="text-gray-400">TikTok</div><div class="text-white">{pro.tiktok}</div></div>{/if}
		{#if pro.twitch}<div><div class="text-gray-400">Twitch</div><div class="text-white">{pro.twitch}</div></div>{/if}
		{#if pro.website}<div><div class="text-gray-400">Website</div><a href="{pro.website}" target="_blank" rel="noopener" class="text-blue-400 hover:underline">{pro.website}</a></div>{/if}
		{#if pro.videoHighlightsLinks}<div class="col-span-3"><div class="text-gray-400">Video Highlights</div><div class="text-white whitespace-pre-line">{pro.videoHighlightsLinks}</div></div>{/if}
	</div>
	{/if}
</div>

<!-- TRAVEL -->
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('travel')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Travel</span>
		{#if open.travel}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.travel}
	<div class="p-5 bg-gray-800/50 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
		{#if pro.primaryAirport}<div><div class="text-gray-400">Primary Airport</div><div class="text-white">{pro.primaryAirport}</div></div>{/if}
		{#if pro.secondaryAirport}<div><div class="text-gray-400">Secondary Airport</div><div class="text-white">{pro.secondaryAirport}</div></div>{/if}
		{#if pro.frequentFlyerNumbers}<div><div class="text-gray-400">Frequent Flyer #s</div><div class="text-white">{pro.frequentFlyerNumbers}</div></div>{/if}
		{#if pro.favoriteDestination}<div><div class="text-gray-400">Favorite Destination</div><div class="text-white">{pro.favoriteDestination}</div></div>{/if}
		{#if !pro.primaryAirport && !pro.secondaryAirport && !pro.frequentFlyerNumbers}<div class="col-span-3 text-gray-500">No travel info on file</div>{/if}
	</div>
	{/if}
</div>

<!-- HEALTH & FITNESS -->
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('health')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Health & Fitness</span>
		{#if open.health}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.health}
	<div class="p-5 bg-gray-800/50 border-t border-gray-700 space-y-4 text-sm">
		{#if pro.injuryHistory}<div><div class="text-gray-400 mb-1">Injury History</div><div class="text-white whitespace-pre-line">{@html pro.injuryHistory}</div></div>{/if}
		{#if pro.fitnessRegimen}<div><div class="text-gray-400 mb-1">Fitness Regimen</div><div class="text-white whitespace-pre-line">{@html pro.fitnessRegimen}</div></div>{/if}
		{#if pro.dietaryPreferences}<div><div class="text-gray-400 mb-1">Dietary Preferences</div><div class="text-white">{pro.dietaryPreferences}</div></div>{/if}
		{#if !pro.injuryHistory && !pro.fitnessRegimen && !pro.dietaryPreferences}<div class="text-gray-500">No health info on file</div>{/if}
	</div>
	{/if}
</div>

<!-- PERSONAL -->
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('personal')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Personal</span>
		{#if open.personal}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.personal}
	<div class="p-5 bg-gray-800/50 border-t border-gray-700 space-y-4 text-sm">
		{#if pro.otherSports}<div><div class="text-gray-400 mb-1">Other Sports</div><div class="text-white">{pro.otherSports}</div></div>{/if}
		{#if pro.hobbies}<div><div class="text-gray-400 mb-1">Hobbies</div><div class="text-white">{pro.hobbies}</div></div>{/if}
		{#if pro.longTermGoals}<div><div class="text-gray-400 mb-1">Long-Term Goals</div><div class="text-white whitespace-pre-line">{@html pro.longTermGoals}</div></div>{/if}
		{#if pro.missionStatement}<div><div class="text-gray-400 mb-1">Mission Statement</div><div class="text-white whitespace-pre-line">{@html pro.missionStatement}</div></div>{/if}
		{#if pro.personalMotivation}<div><div class="text-gray-400 mb-1">Personal Motivation</div><div class="text-white whitespace-pre-line">{@html pro.personalMotivation}</div></div>{/if}
	</div>
	{/if}
</div>

<!-- CAREER / BIO -->
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('career')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Bio & Career</span>
		{#if open.career}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.career}
	<div class="p-5 bg-gray-800/50 border-t border-gray-700 space-y-5 text-sm">
		{#if pro.bio}<div><div class="text-gray-400 mb-1 font-medium">Biography</div><div class="text-gray-200 prose prose-invert max-w-none">{@html pro.bio}</div></div>{/if}
		{#if pro.careerHighlights}<div><div class="text-gray-400 mb-1 font-medium">Career Highlights</div><div class="text-gray-200 prose prose-invert max-w-none">{@html pro.careerHighlights}</div></div>{/if}
		{#if pro.notableRecords}<div><div class="text-gray-400 mb-1 font-medium">Notable Records & Milestones</div><div class="text-gray-200 prose prose-invert max-w-none">{@html pro.notableRecords}</div></div>{/if}
	</div>
	{/if}
</div>

<!-- SEASON PERFORMANCE -->
{#if data.seasonStats.length > 0}
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('performance')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Season Performance</span>
		{#if open.performance}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.performance}
	<div class="border-t border-gray-700 overflow-x-auto">
		<table class="w-full text-sm">
			<thead class="bg-gray-900">
				<tr>
					<th class="px-4 py-3 text-left text-gray-300">Season</th>
					<th class="px-4 py-3 text-right text-gray-300">Events</th>
					<th class="px-4 py-3 text-right text-gray-300">Wins</th>
					<th class="px-4 py-3 text-right text-gray-300">Podiums</th>
					<th class="px-4 py-3 text-right text-gray-300">Avg Place</th>
					<th class="px-4 py-3 text-right text-gray-300">Earnings</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-700 bg-gray-800/50">
				{#each data.seasonStats as s}
				<tr class="hover:bg-gray-700/50">
					<td class="px-4 py-3 font-medium text-white">{s.season}</td>
					<td class="px-4 py-3 text-right text-white">{s.tournaments}</td>
					<td class="px-4 py-3 text-right">{#if s.wins > 0}<span class="text-yellow-400 font-bold">🏆 {s.wins}</span>{:else}<span class="text-gray-500">0</span>{/if}</td>
					<td class="px-4 py-3 text-right text-white">{s.podiums}</td>
					<td class="px-4 py-3 text-right text-white">{s.avgPlacement.toFixed(1)}</td>
					<td class="px-4 py-3 text-right font-bold text-white">{fmt$(s.earnings)}</td>
				</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{/if}
</div>
{/if}

<!-- TOURNAMENT RESULTS -->
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('tournaments')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Tournament Results ({data.results.length})</span>
		{#if open.tournaments}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.tournaments}
	<div class="p-4 bg-gray-800/50 border-t border-gray-700">
		{#if data.results.length > 0}
		<div class="space-y-2">
			{#each data.results as r}
			<div class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600">
				<div class="flex items-center gap-3">
					<div class="text-2xl font-bold w-12 text-center text-white">{badge(r.placement)}</div>
					<div>
						<div class="font-medium text-white">{r.expand?.tournament?.name ?? 'Unknown Tournament'}</div>
						<div class="text-xs text-gray-400">Season {r.expand?.tournament?.season ?? 'N/A'} · {r.division === 'mens' ? "Men's" : "Women's"}{#if r.score} · Score: {r.score}{/if}</div>
					</div>
				</div>
				<div class="text-right">
					<div class="font-bold text-green-400">{fmt$(r.proEarnings ?? 0)}</div>
					{#if r.franchiseEarnings}<div class="text-xs text-gray-400">+{fmt$(r.franchiseEarnings)} franchise</div>{/if}
				</div>
			</div>
			{/each}
		</div>
		{:else}
		<div class="text-center py-6 text-gray-500">No tournament results yet</div>
		{/if}
	</div>
	{/if}
</div>

<!-- PAYMENTS -->
<div class="rounded-lg border border-gray-700 overflow-hidden">
	<button type="button" onclick={() => toggle('payments')} class="w-full flex items-center justify-between px-5 py-4 bg-gray-800 hover:bg-gray-700 text-left">
		<span class="text-base font-semibold text-white">Payment History</span>
		{#if open.payments}<ChevronUp class="w-5 h-5 text-gray-400" />{:else}<ChevronDown class="w-5 h-5 text-gray-400" />{/if}
	</button>
	{#if open.payments}
	<div class="p-4 bg-gray-800/50 border-t border-gray-700">
		<div class="grid grid-cols-3 gap-3 mb-4">
			<div class="text-center p-3 bg-green-900/40 rounded-lg border border-green-800">
				<div class="text-lg font-bold text-green-400">{fmt$(data.paymentStats.totalPaid)}</div>
				<div class="text-xs text-gray-400">Total Paid</div>
			</div>
			<div class="text-center p-3 bg-yellow-900/40 rounded-lg border border-yellow-800">
				<div class="text-lg font-bold text-yellow-400">{fmt$(data.paymentStats.totalPending)}</div>
				<div class="text-xs text-gray-400">Pending</div>
			</div>
			<div class="text-center p-3 bg-blue-900/40 rounded-lg border border-blue-800">
				<div class="text-lg font-bold text-blue-400">{data.paymentStats.totalPayments}</div>
				<div class="text-xs text-gray-400">Total Payments</div>
			</div>
		</div>
		{#if data.payments.length > 0}
		<div class="space-y-2">
			{#each data.payments as p}
			<div class="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600">
				<div>
					<div class="font-medium text-white">{p.description || p.paymentType}</div>
					<div class="text-xs text-gray-400">
						{#if p.dueDate}Due: {fmtDate(p.dueDate)}{/if}
						{#if p.paymentDate} · Paid: {fmtDate(p.paymentDate)}{/if}
					</div>
				</div>
				<div class="text-right">
					<div class="font-bold text-white">{fmt$(p.amount)}</div>
					<Badge class={p.status === 'paid' ? 'bg-green-900 text-green-400' : p.status === 'pending' ? 'bg-yellow-900 text-yellow-400' : 'bg-gray-700 text-gray-400'}>{p.status}</Badge>
				</div>
			</div>
			{/each}
		</div>
		{:else}
		<div class="text-center py-6 text-gray-500">No payment records</div>
		{/if}
	</div>
	{/if}
</div>

</div>
