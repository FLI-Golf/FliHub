<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { 
		LayoutDashboard, 
		Users, 
		ListTodo, 
		UserCircle, 
		FolderKanban, 
		Receipt,
		ArrowRight,
		CheckCircle2
	} from 'lucide-svelte';
</script>

<svelte:head>
	<title>FliHub - Business OS for FLI Golf</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<header class="border-b">
		<div class="container mx-auto px-6 py-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex size-10 items-center justify-center rounded-lg bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white">
					<span class="text-xl font-bold">F</span>
				</div>
				<div class="flex flex-col">
					<span class="text-lg font-bold tracking-tight">FliHub</span>
					<span class="text-xs text-muted-foreground uppercase tracking-wider">Business OS</span>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<Button href="/auth/register" class="gap-2 font-semibold bg-green-600 hover:bg-green-700 text-white">
					Register
				</Button>
				<Button href="/auth/login" variant="default" class="gap-2 font-semibold">
					Login
					<ArrowRight class="size-4 stroke-[2]" />
				</Button>
			</div>
		</div>
	</header>

	<!-- Hero Section -->
	<section class="container mx-auto px-6 py-20">
		<div class="max-w-4xl mx-auto text-center">
			<h1 class="text-6xl font-bold mb-6 tracking-tight">
				Business Operations<br />Simplified
			</h1>
			<p class="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
				Manage your team, track tasks, organize projects, and control expenses—all in one place.
			</p>
			<div class="flex gap-4 justify-center">
				<Button href="/auth/register" size="lg" class="gap-2 font-semibold text-base bg-green-600 hover:bg-green-700 text-white">
					Register
				</Button>
				<Button href="/auth/login" size="lg" class="gap-2 font-semibold text-base">
					Login
					<ArrowRight class="size-5 stroke-[2]" />
				</Button>
			</div>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="container mx-auto px-6 py-20 border-t">
		<div class="max-w-7xl mx-auto">
			<h2 class="text-5xl font-bold mb-16 text-center tracking-tight">Everything You Need</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Managers -->
				<div class="border-2 rounded-2xl p-10 hover:shadow-2xl transition-all bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
					<div class="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-lg">
						<Users class="size-8 stroke-[2.5] text-white" />
					</div>
					<h3 class="text-3xl font-bold mb-4">Managers</h3>
					<p class="text-muted-foreground mb-6 text-lg">
						Organize your team by departments and track responsibilities.
					</p>
					<ul class="space-y-3">
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-blue-400" />
							<span class="text-base">Department organization</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-blue-400" />
							<span class="text-base">Contact management</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-blue-400" />
							<span class="text-base">Goal tracking</span>
						</li>
					</ul>
				</div>

				<!-- Tasks -->
				<div class="border-2 rounded-2xl p-10 hover:shadow-2xl transition-all bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
					<div class="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 mb-6 shadow-lg">
						<ListTodo class="size-8 stroke-[2.5] text-white" />
					</div>
					<h3 class="text-3xl font-bold mb-4">Tasks</h3>
					<p class="text-muted-foreground mb-6 text-lg">
						Business roadmap with detailed checklists and timelines.
					</p>
					<ul class="space-y-3">
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-purple-400" />
							<span class="text-base">Strategic planning</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-purple-400" />
							<span class="text-base">Budget tracking</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-purple-400" />
							<span class="text-base">Status monitoring</span>
						</li>
					</ul>
				</div>

				<!-- People -->
				<div class="border-2 rounded-2xl p-10 hover:shadow-2xl transition-all bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
					<div class="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 mb-6 shadow-lg">
						<UserCircle class="size-8 stroke-[2.5] text-white" />
					</div>
					<h3 class="text-3xl font-bold mb-4">People</h3>
					<p class="text-muted-foreground mb-6 text-lg">
						Manage contacts, sponsors, partners, and players.
					</p>
					<ul class="space-y-3">
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-green-400" />
							<span class="text-base">Contact database</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-green-400" />
							<span class="text-base">Relationship tracking</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-green-400" />
							<span class="text-base">Status management</span>
						</li>
					</ul>
				</div>

				<!-- Projects -->
				<div class="border-2 rounded-2xl p-10 hover:shadow-2xl transition-all bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30">
					<div class="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 mb-6 shadow-lg">
						<FolderKanban class="size-8 stroke-[2.5] text-white" />
					</div>
					<h3 class="text-3xl font-bold mb-4">Projects</h3>
					<p class="text-muted-foreground mb-6 text-lg">
						Track tournaments, events, and marketing campaigns.
					</p>
					<ul class="space-y-3">
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-orange-400" />
							<span class="text-base">Project timelines</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-orange-400" />
							<span class="text-base">Budget allocation</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-orange-400" />
							<span class="text-base">Progress tracking</span>
						</li>
					</ul>
				</div>

				<!-- Expenses -->
				<div class="border-2 rounded-2xl p-10 hover:shadow-2xl transition-all bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30">
					<div class="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 mb-6 shadow-lg">
						<Receipt class="size-8 stroke-[2.5] text-white" />
					</div>
					<h3 class="text-3xl font-bold mb-4">Expenses</h3>
					<p class="text-muted-foreground mb-6 text-lg">
						Financial tracking with approval workflows.
					</p>
					<ul class="space-y-3">
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-red-400" />
							<span class="text-base">Expense submission</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-red-400" />
							<span class="text-base">Approval process</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-red-400" />
							<span class="text-base">Receipt management</span>
						</li>
					</ul>
				</div>

				<!-- Dashboard -->
				<div class="border-2 rounded-2xl p-10 hover:shadow-2xl transition-all bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/30">
					<div class="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 mb-6 shadow-lg">
						<LayoutDashboard class="size-8 stroke-[2.5] text-white" />
					</div>
					<h3 class="text-3xl font-bold mb-4">Dashboard</h3>
					<p class="text-muted-foreground mb-6 text-lg">
						Centralized view of all your business operations.
					</p>
					<ul class="space-y-3">
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-cyan-400" />
							<span class="text-base">Quick access</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-cyan-400" />
							<span class="text-base">Overview metrics</span>
						</li>
						<li class="flex items-start gap-3">
							<CheckCircle2 class="size-6 stroke-[2] mt-0.5 flex-shrink-0 text-cyan-400" />
							<span class="text-base">Easy navigation</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="container mx-auto px-6 py-20 border-t">
		<div class="max-w-3xl mx-auto text-center">
			<h2 class="text-4xl font-bold mb-6 tracking-tight">Ready to Get Started?</h2>
			<p class="text-xl text-muted-foreground mb-10">
				Streamline your business operations with FliHub today.
			</p>
			<div class="flex gap-4 justify-center">
				<Button href="/auth/register" size="lg" variant="outline" class="gap-2 font-semibold text-base border-2">
					Create Account
				</Button>
				<Button href="/auth/login" size="lg" class="gap-2 font-semibold text-base">
					Login to Dashboard
					<ArrowRight class="size-5 stroke-[2]" />
				</Button>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t">
		<div class="container mx-auto px-6 py-8">
			<div class="flex items-center justify-center gap-3">
				<div class="flex size-8 items-center justify-center rounded-lg bg-black dark:bg-white text-white dark:text-black">
					<span class="text-base font-bold">F</span>
				</div>
				<span class="text-sm text-muted-foreground">© 2024 FliHub. Business OS for FLI Golf.</span>
			</div>
		</div>
	</footer>
</div>
