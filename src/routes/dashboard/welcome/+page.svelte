<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { ChevronRight, Trophy, Globe, DollarSign, Tv, Users, Star, Shield, Target, Zap } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const roleLabel: Record<string, string> = {
		pro: 'Professional Player',
		manager: 'Player Manager',
		broadcaster: 'Broadcaster'
	};

	let activeSection = $state<string | null>(null);

	function toggleSection(id: string) {
		activeSection = activeSection === id ? null : id;
	}

	const sections = [
		{
			id: 'overview',
			number: '1',
			title: 'League Overview',
			icon: Trophy,
			color: 'emerald',
			content: [
				{ label: 'Format', value: 'Team-based competition with individual performance recognition' },
				{ label: 'Teams', value: '12 elite teams featuring the best players in the world' },
				{ label: 'Tournaments', value: '6 high-stakes events per season at custom-built courses in unique locations' },
				{ label: 'Prize Pool', value: 'Every team earns money at all 6 events — no matter where they finish' },
				{ label: 'Live Coverage', value: 'Professional-grade broadcasting with global reach' },
				{ label: 'Sponsorship', value: 'Players gain access to exclusive partnerships and career-changing opportunities' }
			]
		},
		{
			id: 'benefits',
			number: '2',
			title: 'Player Benefits – Elevate Your Career',
			icon: Star,
			color: 'violet',
			subsections: [
				{
					title: 'Financial & Travel Perks',
					items: [
						{ label: 'Tournament Winnings', value: 'Prize money based on performance — the better you compete, the more you earn' },
						{ label: 'Guaranteed Team Earnings', value: 'Every team takes home earnings from every event, ensuring financial security' },
						{ label: 'Travel & Accommodation', value: 'Fully covered travel and lodging for all players, including international competitors' },
						{ label: 'Additional Revenue', value: 'Footage licensing, player likeness sales, performance milestone bonuses, and league marketing opportunities' }
					]
				},
				{
					title: 'Sponsorship & Endorsement',
					items: [
						{ label: 'FGL Player Opportunities Packet', value: 'Connects players with FGL affiliate brands looking for athlete endorsements' }
					]
				},
				{
					title: 'Competitive Advantages',
					items: [
						{ label: 'Gender-Equal Playing Field', value: 'Equal competition and payouts for all athletes' },
						{ label: 'World-Class Venues', value: 'Custom-built championship courses in marquee locations' },
						{ label: 'Advanced Stats & Analytics', value: 'Player performance data tracked and analyzed to fine-tune strategy' },
						{ label: 'Gambling Integration', value: 'Legal sports betting integration increasing fan engagement and prize pools' }
					]
				},
				{
					title: 'Media & Exposure',
					items: [
						{ label: 'Player Profiles', value: 'Showcased in league-wide promotions and broadcasts' },
						{ label: 'Exclusive Media Opportunities', value: 'Build your brand and connect with fans through interviews and content' },
						{ label: 'Prime-Time Interviews', value: '1st half, halftime, second half, and post-game interview slots' }
					]
				}
			]
		},
		{
			id: 'season',
			number: '3',
			title: 'Season Structure & Competition Format',
			icon: Target,
			color: 'blue',
			content: [
				{ label: 'Regular Season', value: '6 intense tournaments per season with drama, rivalries, and high-stakes competition' },
				{ label: 'Rankings', value: 'Players and teams ranked based on performance throughout the season' },
				{ label: 'Championship', value: 'The final event is the pinnacle — biggest payouts and ultimate prestige' },
				{ label: 'Scoring System', value: 'Tracks both individual and team success, rewarding the best performances' },
				{ label: 'Preseason Draft', value: 'Controlled by FLI Golf to ensure balance and competitiveness' }
			]
		},
		{
			id: 'expectations',
			number: '4',
			title: 'Player Expectations – On and Off the Course',
			icon: Shield,
			color: 'amber',
			content: [
				{ label: 'Professionalism', value: 'Represent yourself and the sport at the highest level' },
				{ label: 'Engagement', value: 'Participate in media, interviews, and fan interactions' },
				{ label: 'Compliance', value: 'Adherence to FGL policies on competition, media obligations, and sponsorship agreements' },
				{ label: 'Sportsmanship', value: 'Maintain the highest level of respect for the game, competitors, and fans' }
			]
		},
		{
			id: 'joining',
			number: '5',
			title: 'How to Join – Are You Among the Elite?',
			icon: Zap,
			color: 'rose',
			subsections: [
				{
					title: 'Eligibility Requirements',
					items: [
						{ label: 'World Ranking', value: 'Only the Top 24 players in the world are invited' },
						{ label: 'International Field', value: 'Open to the best competitors worldwide' },
						{ label: 'Commitment', value: 'Players must commit to the FLI Golf schedule and promotional responsibilities' }
					]
				},
				{
					title: 'Application & Signing Process',
					items: [
						{ label: 'Step 1', value: 'Sign Letter of Intent — confirm your interest in competing' },
						{ label: 'Step 2', value: 'Review & sign the Player Information Packet, Player Opportunity Packet, and Integrity & Substance Policy' },
						{ label: 'Step 3', value: 'Sign the Official Player Contract' },
						{ label: 'Step 4', value: 'Team Assignment via Preseason Draft' }
					]
				}
			]
		},
		{
			id: 'contact',
			number: '6',
			title: 'Contact & Additional Resources',
			icon: Globe,
			color: 'slate',
			content: [
				{ label: 'CEO & Tour Director', value: 'Andrew Panza' },
				{ label: 'Email', value: 'Andrew@FLIGolf.com' },
				{ label: 'Website', value: 'fligolf.com' }
			]
		}
	];

	const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; hover: string; num: string }> = {
		emerald: {
			bg: 'bg-emerald-50 dark:bg-emerald-950/30',
			border: 'border-emerald-200 dark:border-emerald-800',
			text: 'text-emerald-700 dark:text-emerald-300',
			badge: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
			hover: 'hover:border-emerald-400 dark:hover:border-emerald-600',
			num: 'bg-emerald-500'
		},
		violet: {
			bg: 'bg-violet-50 dark:bg-violet-950/30',
			border: 'border-violet-200 dark:border-violet-800',
			text: 'text-violet-700 dark:text-violet-300',
			badge: 'bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200',
			hover: 'hover:border-violet-400 dark:hover:border-violet-600',
			num: 'bg-violet-500'
		},
		blue: {
			bg: 'bg-blue-50 dark:bg-blue-950/30',
			border: 'border-blue-200 dark:border-blue-800',
			text: 'text-blue-700 dark:text-blue-300',
			badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
			hover: 'hover:border-blue-400 dark:hover:border-blue-600',
			num: 'bg-blue-500'
		},
		amber: {
			bg: 'bg-amber-50 dark:bg-amber-950/30',
			border: 'border-amber-200 dark:border-amber-800',
			text: 'text-amber-700 dark:text-amber-300',
			badge: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
			hover: 'hover:border-amber-400 dark:hover:border-amber-600',
			num: 'bg-amber-500'
		},
		rose: {
			bg: 'bg-rose-50 dark:bg-rose-950/30',
			border: 'border-rose-200 dark:border-rose-800',
			text: 'text-rose-700 dark:text-rose-300',
			badge: 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200',
			hover: 'hover:border-rose-400 dark:hover:border-rose-600',
			num: 'bg-rose-500'
		},
		slate: {
			bg: 'bg-slate-50 dark:bg-slate-900/30',
			border: 'border-slate-200 dark:border-slate-700',
			text: 'text-slate-700 dark:text-slate-300',
			badge: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200',
			hover: 'hover:border-slate-400 dark:hover:border-slate-500',
			num: 'bg-slate-500'
		}
	};
</script>

<svelte:head>
	<title>Welcome to FLI Golf League</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Hero Section -->
	<div class="relative overflow-hidden bg-black text-white">
		<!-- Background pattern -->
		<div class="absolute inset-0 opacity-10">
			<div class="absolute inset-0" style="background-image: repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%); background-size: 20px 20px;"></div>
		</div>

		<div class="relative max-w-4xl mx-auto px-6 py-16 text-center">
			<!-- Crest Logo -->
			<div class="flex justify-center mb-8">
				<div class="relative">
					<div class="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 via-white to-emerald-600 flex items-center justify-center shadow-2xl border-4 border-white/20">
						<div class="w-20 h-20 rounded-full bg-black flex items-center justify-center border-2 border-emerald-400">
							<span class="text-3xl font-black tracking-tighter text-white">FLI</span>
						</div>
					</div>
					<div class="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center">
						<Trophy class="w-4 h-4 text-black" />
					</div>
				</div>
			</div>

			<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
				<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
				Welcome, {roleLabel[data.role] ?? 'Member'}
				{#if data.profile?.firstName}
					— {data.profile.firstName} {data.profile.lastName ?? ''}
				{/if}
			</div>

			<h1 class="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
				Welcome to the<br />
				<span class="text-emerald-400">FLI Golf League</span>
			</h1>

			<p class="text-lg text-white/70 font-medium mb-2">The Future of Disc Golf Starts Here</p>

			<div class="max-w-2xl mx-auto mt-8 space-y-4 text-left">
				<p class="text-white/80 leading-relaxed">
					Imagine stepping onto a custom-built course in a sold-out venue, knowing that every throw, every moment, and every battle on the course is being broadcast to a global audience. Picture yourself competing at the highest level, on a stage built exclusively for the best disc golfers in the world, where every shot counts and every performance is rewarded.
				</p>
				<p class="text-white/80 leading-relaxed">
					The FLI Golf League is breaking boundaries, redefining competition, and putting the spotlight on the elite players who deserve it. With a gender-equal playing field, massive prize pools, and international exposure — this is the stage you've been waiting for.
				</p>
			</div>

			<div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
				<form method="POST" action="?/markComplete" use:enhance>
					<button
						type="submit"
						class="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-emerald-500/30 text-base"
					>
						I'm Ready — Let's Get Started
						<ChevronRight class="w-5 h-5" />
					</button>
				</form>
				<a
					href="#league-info"
					class="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-200 border border-white/20 text-base"
				>
					Learn More First
				</a>
			</div>

			<p class="mt-6 text-white/40 text-sm">
				Are you ready to make history?
			</p>
		</div>
	</div>

	<!-- Stats Bar -->
	<div class="bg-emerald-600 text-white">
		<div class="max-w-4xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
			<div>
				<div class="text-2xl font-black">12</div>
				<div class="text-xs text-emerald-100 font-medium uppercase tracking-wide">Elite Teams</div>
			</div>
			<div>
				<div class="text-2xl font-black">6</div>
				<div class="text-xs text-emerald-100 font-medium uppercase tracking-wide">Events / Season</div>
			</div>
			<div>
				<div class="text-2xl font-black">24</div>
				<div class="text-xs text-emerald-100 font-medium uppercase tracking-wide">Top Players</div>
			</div>
			<div>
				<div class="text-2xl font-black">Global</div>
				<div class="text-xs text-emerald-100 font-medium uppercase tracking-wide">Broadcast Reach</div>
			</div>
		</div>
	</div>

	<!-- Expandable Sections -->
	<div id="league-info" class="max-w-4xl mx-auto px-6 py-12 space-y-4">
		<h2 class="text-2xl font-bold text-center mb-8">Everything You Need to Know</h2>

		{#each sections as section (section.id)}
			{@const colors = colorMap[section.color]}
			{@const Icon = section.icon}
			{@const isOpen = activeSection === section.id}

			<div class="border-2 rounded-xl overflow-hidden transition-all duration-200 {colors.border} {colors.hover}">
				<!-- Section Header (clickable) -->
				<button
					onclick={() => toggleSection(section.id)}
					class="w-full flex items-center gap-4 p-5 text-left transition-colors duration-150 {isOpen ? colors.bg : 'bg-card hover:bg-muted/30'}"
				>
					<div class="flex items-center justify-center w-10 h-10 rounded-xl {colors.num} text-white shrink-0">
						<Icon class="w-5 h-5" />
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<span class="text-xs font-bold uppercase tracking-widest {colors.text}">Section {section.number}</span>
						</div>
						<h3 class="font-bold text-base text-foreground">{section.title}</h3>
					</div>
					<ChevronRight class="w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 {isOpen ? 'rotate-90' : ''}" />
				</button>

				<!-- Section Content -->
				{#if isOpen}
					<div class="px-5 pb-5 pt-2 {colors.bg} border-t {colors.border}">
						{#if section.content}
							<dl class="space-y-3 mt-3">
								{#each section.content as item}
									<div class="flex gap-3">
										<dt class="text-sm font-semibold {colors.text} shrink-0 w-36">{item.label}</dt>
										<dd class="text-sm text-foreground/80">{item.value}</dd>
									</div>
								{/each}
							</dl>
						{/if}

						{#if section.subsections}
							<div class="space-y-5 mt-3">
								{#each section.subsections as sub}
									<div>
										<h4 class="text-sm font-bold {colors.text} uppercase tracking-wide mb-2">{sub.title}</h4>
										<dl class="space-y-2">
											{#each sub.items as item}
												<div class="flex gap-3">
													<dt class="text-sm font-semibold text-foreground/70 shrink-0 w-36">{item.label}</dt>
													<dd class="text-sm text-foreground/80">{item.value}</dd>
												</div>
											{/each}
										</dl>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Bottom CTA -->
	<div class="bg-black text-white">
		<div class="max-w-4xl mx-auto px-6 py-16 text-center">
			<h2 class="text-3xl font-black mb-4">The Time is Now. The Stage is Set.</h2>
			<p class="text-white/70 max-w-xl mx-auto mb-8">
				This isn't just another league. This is the future of disc golf. The brightest lights, the biggest crowds, and the highest payouts — FLI Golf is where champions are made.
			</p>
			<form method="POST" action="?/markComplete" use:enhance>
				<button
					type="submit"
					class="inline-flex items-center gap-2 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-emerald-500/30 text-lg"
				>
					Begin Onboarding
					<ChevronRight class="w-5 h-5" />
				</button>
			</form>
			<p class="mt-6 text-white/40 text-sm">Welcome to FLI Golf – Where the Best Compete at the Highest Level.</p>
		</div>
	</div>
</div>
