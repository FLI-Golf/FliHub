<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { ChevronRight, Trophy, Globe, DollarSign, Tv, Users, Star, Shield, Target, Zap, BarChart3, Briefcase, Calendar, FileText, Megaphone, Lightbulb, Layers, Settings } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const roleLabel: Record<string, string> = {
		pro: 'Professional Player',
		manager: 'Player Manager',
		broadcaster: 'Broadcaster',
		vendor: 'Vendor',
		admin: 'Administrator',
		leader: 'Leadership',
		sales: 'Sales Team',
		marketing: 'Marketing Team'
	};

	let activeSection = $state<string | null>(null);

	function toggleSection(id: string) {
		activeSection = activeSection === id ? null : id;
	}

	// Role-based quick start guides
	const roleGuides: Record<string, { title: string; description: string; actions: Array<{ label: string; href: string; icon: any; color: string }> }> = {
		admin: {
			title: 'Administrator Dashboard',
			description: 'Manage the entire FLI Golf League operation',
			actions: [
				{ label: 'Sponsors', href: '/dashboard/sponsors', icon: Star, color: 'text-yellow-600' },
				{ label: 'Franchises', href: '/dashboard/franchises', icon: Trophy, color: 'text-emerald-600' },
				{ label: 'Projects', href: '/dashboard/projects', icon: BarChart3, color: 'text-blue-600' },
				{ label: 'Departments', href: '/dashboard/departments', icon: Briefcase, color: 'text-purple-600' },
				{ label: 'People', href: '/dashboard/people', icon: Users, color: 'text-indigo-600' },
				{ label: 'Marketing Goals', href: '/dashboard/marketing-goals', icon: Target, color: 'text-orange-600' },
				{ label: 'Talent', href: '/dashboard/talent', icon: Users, color: 'text-red-600' },
				{ label: 'Continuous Improvements', href: '/dashboard/continuous-improvements', icon: Lightbulb, color: 'text-amber-600' },
				{ label: 'Media', href: '/dashboard/media', icon: Tv, color: 'text-pink-600' },
				{ label: 'Events', href: '/dashboard/events', icon: Calendar, color: 'text-cyan-600' }
			]
		},
		leader: {
			title: 'Leadership Operations',
			description: 'Oversee teams, projects, and strategic initiatives',
			actions: [
				{ label: 'Projects', href: '/dashboard/projects', icon: BarChart3, color: 'text-blue-600' },
				{ label: 'Tasks', href: '/dashboard/tasks', icon: FileText, color: 'text-slate-600' },
				{ label: 'Departments', href: '/dashboard/departments', icon: Briefcase, color: 'text-purple-600' },
				{ label: 'People', href: '/dashboard/people', icon: Users, color: 'text-indigo-600' },
				{ label: 'Talent Management', href: '/dashboard/talent', icon: Users, color: 'text-red-600' },
				{ label: 'Budget Tracking', href: '/dashboard/income', icon: DollarSign, color: 'text-green-600' },
				{ label: 'Continuous Improvements', href: '/dashboard/continuous-improvements', icon: Lightbulb, color: 'text-amber-600' },
				{ label: 'Work Orders', href: '/dashboard/work-orders', icon: Layers, color: 'text-teal-600' }
			]
		},
		pro: {
			title: 'Player Dashboard',
			description: 'Track your performance and opportunities',
			actions: [
				{ label: 'Player Profile', href: '/portal/player-profile', icon: Users, color: 'text-indigo-600' },
				{ label: 'Events', href: '/dashboard/events', icon: Calendar, color: 'text-cyan-600' },
				{ label: 'Media', href: '/dashboard/media', icon: Tv, color: 'text-pink-600' },
				{ label: 'My Payments', href: '/dashboard/my-payments', icon: DollarSign, color: 'text-green-600' }
			]
		},
		broadcaster: {
			title: 'Broadcaster Opportunities',
			description: 'Browse events and tournaments, then signal interest in broadcast work and appearances',
			actions: [
				{ label: 'Events', href: '/dashboard/events', icon: Calendar, color: 'text-cyan-600' },
				{ label: 'Tournaments', href: '/dashboard/talent/tournaments', icon: Trophy, color: 'text-emerald-600' },
				{ label: 'Media', href: '/dashboard/media', icon: Tv, color: 'text-pink-600' }
			]
		},
		vendor: {
			title: 'Vendor Opportunities',
			description: 'Browse events, track tournament opportunities, and signal interest in future bookings',
			actions: [
				{ label: 'Events', href: '/dashboard/events', icon: Calendar, color: 'text-cyan-600' },
				{ label: 'Tournaments', href: '/dashboard/talent/tournaments', icon: Trophy, color: 'text-emerald-600' },
				{ label: 'Media', href: '/dashboard/media', icon: Tv, color: 'text-pink-600' }
			]
		},
		marketing: {
			title: 'Marketing Hub',
			description: 'Execute campaigns, manage content, and drive growth',
			actions: [
				{ label: 'Marketing Goals', href: '/dashboard/marketing-goals', icon: Target, color: 'text-orange-600' },
				{ label: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone, color: 'text-rose-600' },
				{ label: 'Media Assets', href: '/dashboard/media', icon: Tv, color: 'text-pink-600' },
				{ label: 'Sponsors', href: '/dashboard/sponsors', icon: Star, color: 'text-yellow-600' },
				{ label: 'Geo Marketing', href: '/dashboard/geo-marketing', icon: Globe, color: 'text-blue-600' },
				{ label: 'Content Pipeline', href: '/dashboard/content', icon: BarChart3, color: 'text-blue-600' }
			]
		},
		sales: {
			title: 'Sales Operations',
			description: 'Manage franchises, sponsors, and revenue pipelines',
			actions: [
				{ label: 'Franchise Sales', href: '/dashboard/sales', icon: Trophy, color: 'text-emerald-600' },
				{ label: 'Franchises', href: '/dashboard/franchises', icon: Trophy, color: 'text-emerald-600' },
				{ label: 'Sponsors', href: '/dashboard/sponsors', icon: Star, color: 'text-yellow-600' },
				{ label: 'Collections', href: '/dashboard/sponsor-collections', icon: DollarSign, color: 'text-green-600' },
				{ label: 'Revenue Pipeline', href: '/dashboard/income', icon: DollarSign, color: 'text-green-600' }
			]
		}
	};

	// League information sections
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
				{ label: 'Prize Pool', value: 'Prize money distributed across all placements — every event has significant earnings' },
				{ label: 'Live Coverage', value: 'Professional-grade broadcasting with global digital and traditional media reach' },
				{ label: 'Sponsorship', value: 'Exclusive partnerships with leading brands in golf, sports, and lifestyle sectors' }
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
						{ label: 'Tournament Earnings', value: 'Competitive prize money based on performance across all 6 events' },
						{ label: 'Team Payouts', value: 'Every team takes home earnings from every event, ensuring financial stability' },
						{ label: 'Travel Benefits', value: 'Full coverage of flights, hotels, and ground transportation' },
						{ label: 'Revenue Opportunities', value: 'Media rights, player likeness, sponsorships, and merchandise' }
					]
				},
				{
					title: 'Sponsorship & Endorsement',
					items: [
						{ label: 'Brand Partnerships', value: 'Access to FGL affiliate brands and exclusive endorsement opportunities' },
						{ label: 'Marketing Support', value: 'League promotion of player profiles and personal brands' }
					]
				},
				{
					title: 'Competitive Advantages',
					items: [
						{ label: 'Gender-Equal Opportunity', value: 'Equal competition, payouts, and media exposure for all athletes' },
						{ label: 'Elite Venues', value: 'Championship courses in major markets with sold-out spectators' },
						{ label: 'Analytics Platform', value: 'Advanced performance tracking and statistical analysis' },
						{ label: 'Sports Betting Integration', value: 'Legal betting engagement increases fan interest and prize pools' }
					]
				},
				{
					title: 'Media & Exposure',
					items: [
						{ label: 'Broadcast Coverage', value: 'Professional production with national and international distribution' },
						{ label: 'Player Profiles', value: 'Prominent positioning in league promotions and digital platforms' },
						{ label: 'Interview Opportunities', value: 'Premium on-course and studio interview slots' }
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
				{ label: 'Regular Season', value: '6 tournaments spanning the competitive season with varying formats' },
				{ label: 'Tournament Schedule', value: 'Spread across key markets and locations to maximize fan engagement' },
				{ label: 'Championship Event', value: 'The final event crowns the season champion with the highest prize pool' },
				{ label: 'Scoring System', value: 'Tracks individual and team performance with detailed analytics' },
				{ label: 'Team Selection', value: 'Professional draft model ensures competitive balance across all teams' },
				{ label: 'Playoffs', value: 'Top-performing teams compete in playoff rounds for championship glory' }
			]
		},
		{
			id: 'expectations',
			number: '4',
			title: 'Player Expectations – On and Off the Course',
			icon: Shield,
			color: 'amber',
			content: [
				{ label: 'Professionalism', value: 'Represent the league, your team, and yourself with integrity' },
				{ label: 'Media Engagement', value: 'Participate in interviews, content creation, and fan interactions' },
				{ label: 'Policy Compliance', value: 'Adherence to league regulations, anti-doping, and conduct policies' },
				{ label: 'Sportsmanship', value: 'Respect for competitors, officials, fans, and the sport' },
				{ label: 'Promotion', value: 'Support league growth through social media and public appearances' }
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
						{ label: 'World Ranking', value: 'Top 24 players in the world by PDGA rating' },
						{ label: 'International Competition', value: 'Open to elite players globally' },
						{ label: 'Commitment', value: 'Full commitment to season schedule and league responsibilities' }
					]
				},
				{
					title: 'The Application Process',
					items: [
						{ label: 'Step 1', value: 'Letter of Intent — Express your interest in competing' },
						{ label: 'Step 2', value: 'Documentation review and signing of league agreements' },
						{ label: 'Step 3', value: 'Finalize player contract with FLI Golf' },
						{ label: 'Step 4', value: 'Team assignment through competitive draft process' }
					]
				}
			]
		},
		{
			id: 'contact',
			number: '6',
			title: 'League Contact & Resources',
			icon: Globe,
			color: 'slate',
			content: [
				{ label: 'Tour Director', value: 'Andrew Panza' },
				{ label: 'Email', value: 'Andrew@FLIGolf.com' },
				{ label: 'Website', value: 'fligolf.com' },
				{ label: 'Social Media', value: '@FLIGolf on all platforms' }
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

	const currentRoleGuide = $derived(roleGuides[data.role] || roleGuides['admin']);
</script>

<svelte:head>
	<title>Welcome to FLI Golf League</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
	<!-- Hero Section -->
	<div class="relative overflow-hidden bg-gradient-to-r from-black to-slate-900 text-white">
		<!-- Animated background elements -->
		<div class="absolute inset-0 opacity-5 overflow-hidden">
			<div class="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
			<div class="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
		</div>

		<div class="relative max-w-5xl mx-auto px-6 py-20 text-center">
			<!-- Logo -->
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

			<!-- Welcome Badge -->
			<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
				<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
				Welcome, {roleLabel[data.role] ?? 'Member'}
				{#if data.profile?.firstName}
					— {data.profile.firstName} {data.profile.lastName ?? ''}
				{/if}
			</div>

			<!-- Main Heading -->
			<h1 class="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
				Welcome to<br />
				<span class="text-emerald-400">FLI Golf League</span>
			</h1>

			<p class="text-lg text-white/70 font-medium mb-6">The future of professional disc golf is here</p>

			<p class="text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
				You're now part of an elite ecosystem that combines professional competition, cutting-edge operations, and global reach. Whether you're competing on the course, building franchises, managing media, or leading strategy — this is where it all happens.
			</p>

			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a
					href="#role-guide"
					class="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-emerald-500/30 text-base"
				>
					Get Started
					<ChevronRight class="w-5 h-5" />
				</a>
				<a
					href="#league-info"
					class="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-200 border border-white/20 text-base"
				>
					Learn About FLI Golf
				</a>
			</div>

			<p class="mt-8 text-white/40 text-sm">
				Ready to make an impact?
			</p>
		</div>
	</div>

	<!-- Stats Bar -->
	<div class="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
		<div class="max-w-5xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
			<div>
				<div class="text-3xl font-black">12</div>
				<div class="text-xs text-emerald-100 font-medium uppercase tracking-wide">Elite Teams</div>
			</div>
			<div>
				<div class="text-3xl font-black">6</div>
				<div class="text-xs text-emerald-100 font-medium uppercase tracking-wide">Events/Season</div>
			</div>
			<div>
				<div class="text-3xl font-black">24</div>
				<div class="text-xs text-emerald-100 font-medium uppercase tracking-wide">Top Players</div>
			</div>
			<div>
				<div class="text-3xl font-black">∞</div>
				<div class="text-xs text-emerald-100 font-medium uppercase tracking-wide">Global Impact</div>
			</div>
		</div>
	</div>

	<!-- Role-Based Quick Start Guide -->
	<div id="role-guide" class="max-w-5xl mx-auto px-6 py-16 space-y-8">
		<div class="text-center">
			<h2 class="text-3xl font-black mb-3">Your FliHub Dashboard</h2>
			<p class="text-slate-600 dark:text-slate-400">Quick access to tools and features for your role</p>
		</div>

		<div class="bg-slate-900 dark:bg-slate-950 rounded-2xl border-2 border-slate-700 dark:border-slate-800 p-8 shadow-sm">
			<h3 class="text-xl font-bold mb-2 text-white">{currentRoleGuide.title}</h3>
			<p class="text-slate-300 dark:text-slate-400 mb-6">{currentRoleGuide.description}</p>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each currentRoleGuide.actions as action}
					{@const Icon = action.icon}
					<a
						href={action.href}
						class="flex items-center gap-3 p-4 rounded-xl bg-slate-800 dark:bg-slate-800/80 hover:bg-slate-700 dark:hover:bg-slate-700 border border-slate-700 dark:border-slate-600 transition-all duration-200 hover:shadow-md hover:scale-105 text-white"
					>
						<Icon class={`w-5 h-5 ${action.color}`} />
						<span class="font-semibold text-white">{action.label}</span>
						<ChevronRight class="w-4 h-4 text-slate-400 ml-auto" />
					</a>
				{/each}
			</div>
		</div>
	</div>

	<!-- League Information Sections -->
	<div id="league-info" class="bg-slate-900 dark:bg-slate-950 py-16">
		<div class="max-w-5xl mx-auto px-6 space-y-4">
			<div class="text-center mb-8">
				<h2 class="text-3xl font-black mb-2 text-white">League Information</h2>
				<p class="text-slate-300 dark:text-slate-400">Everything you need to know about FLI Golf</p>
			</div>

			{#each sections as section (section.id)}
				{@const colors = colorMap[section.color]}
				{@const Icon = section.icon}
				{@const isOpen = activeSection === section.id}

				<div class="border-2 rounded-xl overflow-hidden transition-all duration-200 bg-slate-900 dark:bg-slate-950 {colors.border} {colors.hover}">
					<!-- Section Header (clickable) -->
					<button
						onclick={() => toggleSection(section.id)}
						class="w-full flex items-center gap-4 p-5 text-left transition-colors duration-150 hover:bg-slate-800 dark:hover:bg-slate-800/50"
					>
						<div class="flex items-center justify-center w-10 h-10 rounded-xl {colors.num} text-white shrink-0">
							<Icon class="w-5 h-5" />
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-xs font-bold uppercase tracking-widest {colors.text}">Section {section.number}</span>
							</div>
							<h3 class="font-bold text-base text-white">{section.title}</h3>
						</div>
						<ChevronRight class="w-5 h-5 text-slate-500 dark:text-slate-600 shrink-0 transition-transform duration-200 {isOpen ? 'rotate-90' : ''}" />
					</button>

					<!-- Section Content -->
					{#if isOpen}
					<div class="px-5 pb-5 pt-2 bg-slate-800 dark:bg-slate-900 border-t {colors.border}">
							{#if section.content}
								<dl class="space-y-3 mt-3">
									{#each section.content as item}
										<div class="flex gap-3">
											<dt class="text-sm font-semibold {colors.text} shrink-0 min-w-fit">{item.label}</dt>
											<dd class="text-sm text-slate-300 dark:text-slate-400">{item.value}</dd>
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
														<dt class="text-sm font-semibold text-slate-400 dark:text-slate-500 shrink-0 min-w-fit">{item.label}</dt>
														<dd class="text-sm text-slate-300 dark:text-slate-400">{item.value}</dd>
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
	</div>

	<!-- Bottom CTA -->
	<div class="bg-gradient-to-r from-black to-slate-900 text-white">
		<div class="max-w-5xl mx-auto px-6 py-16 text-center">
			<h2 class="text-3xl font-black mb-4">You're Ready to Lead</h2>
			<p class="text-white/70 max-w-xl mx-auto mb-8">
				FliHub is your all-in-one platform for managing operations, tracking performance, and driving the FLI Golf League forward.
			</p>
			<a
				href="/dashboard"
				class="inline-flex items-center gap-2 px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-emerald-500/30 text-lg"
			>
				Explore Your Dashboard
				<ChevronRight class="w-5 h-5" />
			</a>
			<p class="mt-6 text-white/40 text-sm">
				Questions? Contact the team
			</p>
		</div>
	</div>
</div>
