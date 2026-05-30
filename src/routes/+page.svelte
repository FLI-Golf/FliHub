<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		ArrowRight, LayoutDashboard, Users, ListTodo, UserCircle,
		FolderKanban, Receipt, Trophy, Star, Building2, TrendingUp,
		CheckCircle2, ShieldCheck, Handshake, Globe, Wallet, Scale,
		Megaphone, Video, Cpu, Briefcase, BarChart3, CalendarDays,
		ClipboardList, Bell, FileText, Tags, MapPin, Zap, Package,
		PieChart, Clock, UserCheck, Layers, Target, DollarSign, ChevronRight
	} from 'lucide-svelte';

	const features = [
		{
			icon: FolderKanban,
			title: 'Project Management',
			description: 'Track tournaments, events, activations, and campaigns from kickoff to completion.',
			color: 'from-orange-500 to-amber-500',
			border: 'border-orange-500/30',
			bg: 'from-orange-500/10 to-amber-500/5',
			accent: 'text-orange-400',
			items: [
				'Tournament & event lifecycle tracking',
				'Multi-type: campaigns, activations, events',
				'Budget allocation per project',
				'Vendor assignment & management',
				'Task checklists with due dates',
				'Progress & status monitoring'
			]
		},
		{
			icon: ListTodo,
			title: 'Task Tracking',
			description: 'Break projects into actionable tasks with owners, deadlines, and priority levels.',
			color: 'from-purple-500 to-violet-500',
			border: 'border-purple-500/30',
			bg: 'from-purple-500/10 to-violet-500/5',
			accent: 'text-purple-400',
			items: [
				'Priority-based task queues',
				'Assignee & department ownership',
				'Due date & timeline management',
				'Status workflow: draft → done',
				'Linked to projects & budgets',
				'Overdue alerts & notifications'
			]
		},
		{
			icon: Receipt,
			title: 'Expense Management',
			description: 'Submit, review, and approve expenses with full audit trails and receipt tracking.',
			color: 'from-red-500 to-rose-500',
			border: 'border-red-500/30',
			bg: 'from-red-500/10 to-rose-500/5',
			accent: 'text-red-400',
			items: [
				'Expense submission & categorization',
				'Multi-stage approval workflows',
				'Receipt & document attachments',
				'Project-linked cost tracking',
				'Approved vs. pending reporting',
				'Budget variance alerts'
			]
		},
		{
			icon: Building2,
			title: 'Department Budgets',
			description: 'Set annual budgets per department and track actual vs. forecasted spend in real time.',
			color: 'from-blue-500 to-cyan-500',
			border: 'border-blue-500/30',
			bg: 'from-blue-500/10 to-cyan-500/5',
			accent: 'text-blue-400',
			items: [
				'Annual budget allocation',
				'Actual vs. forecasted spend',
				'Department-level rollups',
				'Over-budget early warnings',
				'Cross-department comparisons',
				'Fiscal year management'
			]
		},
		{
			icon: Star,
			title: 'Sponsor Management',
			description: 'Manage sponsor relationships, tiers, commitments, and payment tracking.',
			color: 'from-yellow-500 to-orange-400',
			border: 'border-yellow-500/30',
			bg: 'from-yellow-500/10 to-orange-400/5',
			accent: 'text-yellow-400',
			items: [
				'Tiered sponsor classification',
				'Committed vs. paid tracking',
				'Sponsor contact database',
				'Activation & deliverable tracking',
				'Revenue pipeline visibility',
				'Renewal & status management'
			]
		},
		{
			icon: Trophy,
			title: 'Franchise Pipeline',
			description: 'Track franchise leads, opportunities, and deals through every stage of the sales funnel.',
			color: 'from-violet-500 to-purple-600',
			border: 'border-violet-500/30',
			bg: 'from-violet-500/10 to-purple-600/5',
			accent: 'text-violet-400',
			items: [
				'Lead capture & qualification',
				'Opportunity stage tracking',
				'Territory management',
				'Deal pipeline visibility',
				'Franchise contact records',
				'Sales funnel analytics'
			]
		},
		{
			icon: Users,
			title: 'People & Contacts',
			description: 'Centralize your network — players, partners, sponsors, and staff — in one searchable database.',
			color: 'from-green-500 to-emerald-500',
			border: 'border-green-500/30',
			bg: 'from-green-500/10 to-emerald-500/5',
			accent: 'text-green-400',
			items: [
				'Unified contact database',
				'Role & relationship tagging',
				'Player profile management',
				'Sponsor & partner records',
				'Communication history',
				'Status & engagement tracking'
			]
		},
		{
			icon: Handshake,
			title: 'Vendor Management',
			description: 'Maintain a directory of suppliers and service providers linked directly to your projects.',
			color: 'from-teal-500 to-cyan-500',
			border: 'border-teal-500/30',
			bg: 'from-teal-500/10 to-cyan-500/5',
			accent: 'text-teal-400',
			items: [
				'Vendor contact directory',
				'Project-vendor assignments',
				'Service category tagging',
				'Website & contact details',
				'Multi-vendor per project',
				'Vendor history tracking'
			]
		},
		{
			icon: BarChart3,
			title: 'Analytics & Reporting',
			description: 'Real-time dashboards with KPIs, budget health, and operational metrics across every module.',
			color: 'from-indigo-500 to-blue-600',
			border: 'border-indigo-500/30',
			bg: 'from-indigo-500/10 to-blue-600/5',
			accent: 'text-indigo-400',
			items: [
				'Live KPI dashboard',
				'Budget utilization charts',
				'Project status breakdowns',
				'Expense category analysis',
				'Sponsor revenue tracking',
				'Department performance views'
			]
		},
		{
			icon: ShieldCheck,
			title: 'Approvals & Governance',
			description: 'Structured approval workflows ensure every expense and decision has the right sign-off.',
			color: 'from-emerald-500 to-green-600',
			border: 'border-emerald-500/30',
			bg: 'from-emerald-500/10 to-green-600/5',
			accent: 'text-emerald-400',
			items: [
				'Multi-level approval chains',
				'Pending / approved / rejected states',
				'Revision request workflows',
				'Audit trail & history',
				'Role-based access control',
				'Notification on status change'
			]
		},
		{
			icon: Video,
			title: 'Media & Content',
			description: 'Coordinate content production, streaming, and media deliverables across your organization.',
			color: 'from-pink-500 to-rose-500',
			border: 'border-pink-500/30',
			bg: 'from-pink-500/10 to-rose-500/5',
			accent: 'text-pink-400',
			items: [
				'Content project tracking',
				'Streaming media coordination',
				'Stage production planning',
				'Documentary & film tracking',
				'Media budget management',
				'Deliverable status monitoring'
			]
		},
		{
			icon: Globe,
			title: 'League Operations',
			description: 'Manage league structure, licensing, territories, and on-course branding from one hub.',
			color: 'from-cyan-500 to-teal-500',
			border: 'border-cyan-500/30',
			bg: 'from-cyan-500/10 to-teal-500/5',
			accent: 'text-cyan-400',
			items: [
				'League structure management',
				'Bag & disc licensing',
				'Territory assignments',
				'On-course branding tracking',
				'Stadium & course management',
				'Prize purse administration'
			]
		}
	];

	const stats = [
		{ value: '12+', label: 'Modules', icon: Layers },
		{ value: '100%', label: 'Web-based', icon: Globe },
		{ value: 'Real-time', label: 'Analytics', icon: BarChart3 },
		{ value: 'Unified', label: 'Data Hub', icon: Target }
	];
</script>

<svelte:head>
	<title>FliHub — Business OS for FLI Golf</title>
</svelte:head>

<div class="min-h-screen bg-background">

	<!-- Header -->
	<header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="container mx-auto px-6 py-4 flex items-center justify-between">
			<a href="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
				<div class="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
					<span class="text-xl font-black text-white">F</span>
				</div>
				<div class="flex flex-col">
					<span class="text-lg font-bold tracking-tight leading-none">FliHub</span>
					<span class="text-[10px] text-muted-foreground uppercase tracking-widest">Business OS</span>
				</div>
			</a>
			<nav class="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
				<a href="#features" class="hover:text-foreground transition-colors">Features</a>
				<a href="#modules" class="hover:text-foreground transition-colors">Modules</a>
			</nav>
			<div class="flex items-center gap-3">
				<Button href="#cta" class="gap-2 font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20">
					<ArrowRight class="size-4" /> Get Started
				</Button>
				<Button href="/auth/login" variant="ghost" class="font-medium">Login</Button>
			</div>
		</div>
	</header>

	<!-- Hero -->
	<section class="relative overflow-hidden border-b">
		<div class="pointer-events-none absolute inset-0 overflow-hidden">
			<div class="absolute -top-40 -right-40 size-[600px] rounded-full bg-green-500/10 blur-3xl"></div>
			<div class="absolute -bottom-40 -left-40 size-[500px] rounded-full bg-blue-500/10 blur-3xl"></div>
		</div>
		<div class="container mx-auto px-6 py-28 relative">
			<div class="max-w-4xl mx-auto text-center">
				<div class="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm text-green-600 dark:text-green-400 font-medium mb-8">
					<Zap class="size-3.5" />
					Built for FLI Golf Operations
				</div>
				<h1 class="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 tracking-tight leading-[1.05]">
					One Platform.<br />
					<span class="bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">
						Every Operation.
					</span>
				</h1>
				<!-- Mission statement -->
				<p class="text-lg sm:text-xl font-semibold text-foreground mb-4 max-w-3xl mx-auto leading-snug">
					FLI Golf is not a disc golf league — it is the first sport built specifically for gender equality, betting, media and live entertainment from day one.
				</p>
				<p class="text-base text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
					FliHub unifies project management, budgets, expenses, sponsors, vendors, people, and league operations into a single business operating system.
				</p>
				<div class="flex justify-center">
					<Button href="#cta" size="lg" class="gap-2 font-bold text-base bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/25 px-8">
						Start Now <ArrowRight class="size-5" />
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- Stats bar -->
	<section id="features" class="border-b bg-muted/30">
		<div class="container mx-auto px-6 py-10">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
				{#each stats as stat}
					<div class="flex flex-col items-center text-center gap-2">
						<div class="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
							<stat.icon class="size-5 text-primary" />
						</div>
						<p class="text-2xl font-black">{stat.value}</p>
						<p class="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Feature highlight strip -->
	<section class="border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white">
		<div class="container mx-auto px-6 py-5">
			<div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium">
				{#each [
					{ icon: CheckCircle2, text: 'Real-time dashboards' },
					{ icon: ShieldCheck, text: 'Approval workflows' },
					{ icon: DollarSign, text: 'Budget tracking' },
					{ icon: CalendarDays, text: 'Project timelines' },
					{ icon: Bell, text: 'Overdue alerts' },
					{ icon: FileText, text: 'Audit trails' },
					{ icon: UserCheck, text: 'Role-based access' },
					{ icon: PieChart, text: 'Expense analytics' }
				] as item}
					<div class="flex items-center gap-1.5 opacity-90">
						<item.icon class="size-4" />
						<span>{item.text}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Modules grid -->
	<section id="modules" class="container mx-auto px-6 py-24">
		<div class="max-w-7xl mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-4xl sm:text-5xl font-black mb-4 tracking-tight">Everything You Need</h2>
				<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
					12 integrated modules covering every aspect of FLI Golf's business operations — all connected, all in sync.
				</p>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
				{#each features as feature}
					<div class="group relative rounded-2xl border-2 p-7 transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-br {feature.bg} {feature.border}">
						<div class="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br {feature.color} mb-5 shadow-lg transition-transform duration-200 group-hover:scale-110">
							<feature.icon class="size-7 stroke-[2] text-white" />
						</div>
						<h3 class="text-xl font-bold mb-2">{feature.title}</h3>
						<p class="text-muted-foreground text-sm mb-5 leading-relaxed">{feature.description}</p>
						<ul class="space-y-2">
							{#each feature.items as item}
								<li class="flex items-start gap-2.5 text-sm">
									<CheckCircle2 class="size-4 mt-0.5 flex-shrink-0 {feature.accent}" />
									<span>{item}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- How it works -->
	<section class="border-t border-b bg-muted/20">
		<div class="container mx-auto px-6 py-24">
			<div class="max-w-5xl mx-auto">
				<div class="text-center mb-16">
					<h2 class="text-4xl font-black mb-4 tracking-tight">How It Works</h2>
					<p class="text-lg text-muted-foreground">From setup to full operations in minutes.</p>
				</div>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-10">
					{#each [
						{ step: '01', icon: UserCheck, title: 'Create Your Account', desc: 'Register and set up your organization profile. Invite team members and assign roles.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
						{ step: '02', icon: Layers, title: 'Configure Your Modules', desc: 'Set up departments, budgets, and projects. Import existing contacts and vendor data.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
						{ step: '03', icon: BarChart3, title: 'Operate & Analyze', desc: 'Track tasks, approve expenses, manage sponsors, and monitor everything from your dashboard.', color: 'text-green-500', bg: 'bg-green-500/10' }
					] as step}
						<div class="relative flex flex-col items-center text-center">
							<div class="text-8xl font-black text-muted-foreground/10 absolute -top-6 left-0 select-none leading-none">{step.step}</div>
							<div class="relative z-10 flex size-16 items-center justify-center rounded-2xl {step.bg} mb-5">
								<step.icon class="size-8 {step.color}" />
							</div>
							<h3 class="text-lg font-bold mb-2">{step.title}</h3>
							<p class="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Module quick-links -->
	<section class="container mx-auto px-6 py-20">
		<div class="max-w-5xl mx-auto">
			<h2 class="text-3xl font-black mb-10 text-center tracking-tight">Explore Every Module</h2>
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
				{#each [
					{ label: 'Dashboard', icon: LayoutDashboard, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' },
					{ label: 'Projects', icon: FolderKanban, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
					{ label: 'Tasks', icon: ListTodo, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
					{ label: 'Expenses', icon: Receipt, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
					{ label: 'Departments', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
					{ label: 'Sponsors', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
					{ label: 'Franchises', icon: Trophy, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30' },
					{ label: 'People', icon: UserCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
					{ label: 'Vendors', icon: Handshake, color: 'text-teal-600', bg: 'bg-teal-100 dark:bg-teal-900/30' },
					{ label: 'Approvals', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
					{ label: 'Analytics', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
					{ label: 'League Ops', icon: Globe, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
					{ label: 'Media', icon: Video, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30' },
					{ label: 'Territories', icon: MapPin, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
					{ label: 'Budgets', icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
					{ label: 'Legal', icon: Scale, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' }
				] as mod}
					<div class="flex items-center gap-3 rounded-xl border p-3.5 hover:border-primary/40 hover:bg-muted/50 transition-all group cursor-default">
						<div class="size-9 rounded-lg {mod.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
							<mod.icon class="size-4 {mod.color}" />
						</div>
						<span class="text-sm font-medium">{mod.label}</span>
						<ChevronRight class="size-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section id="cta" class="border-t bg-muted/20">
		<div class="container mx-auto px-6 py-24">
			<div class="max-w-4xl mx-auto text-center">
				<div class="inline-flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-500/30 mb-8">
					<span class="text-4xl font-black text-white">F</span>
				</div>
				<h2 class="text-4xl sm:text-5xl font-black mb-5 tracking-tight">
					Ready to Run FLI Golf<br />Like a Business?
				</h2>
				<p class="text-xl text-muted-foreground mb-10 leading-relaxed">
					Join the team already using FliHub to manage projects, track budgets, coordinate sponsors, and operate at scale.
				</p>

				<!-- Two-path CTA -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
					<!-- Team member path -->
					<div class="rounded-2xl border-2 border-green-500/30 bg-green-500/5 p-6 text-left">
						<div class="size-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
							<Briefcase class="size-5 text-green-400" />
						</div>
						<h3 class="font-bold text-white mb-1">FLI Golf Team</h3>
						<p class="text-sm text-muted-foreground mb-4">Staff, managers, and league operators — access the full FliHub dashboard.</p>
						<Button href="/auth/register" size="sm" class="w-full gap-2 font-semibold bg-green-600 hover:bg-green-700 text-white">
							Team Sign Up <ArrowRight class="size-3.5" />
						</Button>
					</div>

					<!-- Vendor / bidder path -->
					<div class="rounded-2xl border-2 border-orange-500/30 bg-orange-500/5 p-6 text-left">
						<div class="size-10 rounded-xl bg-orange-500/20 flex items-center justify-center mb-3">
							<Package class="size-5 text-orange-400" />
						</div>
						<h3 class="font-bold text-white mb-1">Vendor / Supplier</h3>
						<p class="text-sm text-muted-foreground mb-4">Register as a vendor to browse open projects and submit competitive bids.</p>
						<Button href="/auth/register/vendor" size="sm" class="w-full gap-2 font-semibold bg-orange-600 hover:bg-orange-700 text-white">
							Register as Vendor <ArrowRight class="size-3.5" />
						</Button>
					</div>
				</div>

				<Button href="/auth/login" size="lg" variant="outline" class="gap-2 font-semibold text-base border-2 px-10">
					Login to Dashboard
				</Button>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t">
		<div class="container mx-auto px-6 py-8">
			<div class="flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="flex items-center gap-3">
					<div class="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
						<span class="text-sm font-black text-white">F</span>
					</div>
					<span class="font-semibold">FliHub</span>
					<span class="text-muted-foreground text-sm">Business OS for FLI Golf</span>
				</div>
				<div class="flex items-center gap-6 text-sm text-muted-foreground">
					<a href="/auth/login" class="hover:text-foreground transition-colors">Login</a>
					<a href="/auth/register" class="hover:text-foreground transition-colors">Register</a>
					<span>© 2025 FliHub</span>
				</div>
			</div>
		</div>
	</footer>

</div>
