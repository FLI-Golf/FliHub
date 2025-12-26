<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ModeToggle from '$lib/components/mode-toggle.svelte';
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

<div class="min-h-screen bg-white">
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
				<ModeToggle />
				<Button href="/auth/register" variant="outline" class="gap-2 font-semibold border-2">
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
				<Button href="/auth/register" size="lg" variant="outline" class="gap-2 font-semibold text-base border-2">
					Register Free
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
		<div class="max-w-6xl mx-auto">
			<h2 class="text-4xl font-bold mb-12 text-center tracking-tight">Everything You Need</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<!-- Managers -->
				<div class="border-2 rounded-lg p-8 hover:shadow-lg transition-shadow">
					<div class="flex size-14 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black mb-6">
						<Users class="size-7 stroke-[2]" />
					</div>
					<h3 class="text-2xl font-bold mb-3">Managers</h3>
					<p class="text-muted-foreground mb-4">
						Organize your team by departments and track responsibilities.
					</p>
					<ul class="space-y-2">
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Department organization</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Contact management</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Goal tracking</span>
						</li>
					</ul>
				</div>

				<!-- Tasks -->
				<div class="border-2 rounded-lg p-8 hover:shadow-lg transition-shadow">
					<div class="flex size-14 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black mb-6">
						<ListTodo class="size-7 stroke-[2]" />
					</div>
					<h3 class="text-2xl font-bold mb-3">Tasks</h3>
					<p class="text-muted-foreground mb-4">
						Business roadmap with detailed checklists and timelines.
					</p>
					<ul class="space-y-2">
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Strategic planning</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Budget tracking</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Status monitoring</span>
						</li>
					</ul>
				</div>

				<!-- People -->
				<div class="border-2 rounded-lg p-8 hover:shadow-lg transition-shadow">
					<div class="flex size-14 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black mb-6">
						<UserCircle class="size-7 stroke-[2]" />
					</div>
					<h3 class="text-2xl font-bold mb-3">People</h3>
					<p class="text-muted-foreground mb-4">
						Manage contacts, sponsors, partners, and players.
					</p>
					<ul class="space-y-2">
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Contact database</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Relationship tracking</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Status management</span>
						</li>
					</ul>
				</div>

				<!-- Projects -->
				<div class="border-2 rounded-lg p-8 hover:shadow-lg transition-shadow">
					<div class="flex size-14 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black mb-6">
						<FolderKanban class="size-7 stroke-[2]" />
					</div>
					<h3 class="text-2xl font-bold mb-3">Projects</h3>
					<p class="text-muted-foreground mb-4">
						Track tournaments, events, and marketing campaigns.
					</p>
					<ul class="space-y-2">
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Project timelines</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Budget allocation</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Progress tracking</span>
						</li>
					</ul>
				</div>

				<!-- Expenses -->
				<div class="border-2 rounded-lg p-8 hover:shadow-lg transition-shadow">
					<div class="flex size-14 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black mb-6">
						<Receipt class="size-7 stroke-[2]" />
					</div>
					<h3 class="text-2xl font-bold mb-3">Expenses</h3>
					<p class="text-muted-foreground mb-4">
						Financial tracking with approval workflows.
					</p>
					<ul class="space-y-2">
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Expense submission</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Approval process</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Receipt management</span>
						</li>
					</ul>
				</div>

				<!-- Dashboard -->
				<div class="border-2 rounded-lg p-8 hover:shadow-lg transition-shadow">
					<div class="flex size-14 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black mb-6">
						<LayoutDashboard class="size-7 stroke-[2]" />
					</div>
					<h3 class="text-2xl font-bold mb-3">Dashboard</h3>
					<p class="text-muted-foreground mb-4">
						Centralized view of all your business operations.
					</p>
					<ul class="space-y-2">
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Quick access</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Overview metrics</span>
						</li>
						<li class="flex items-start gap-2">
							<CheckCircle2 class="size-5 stroke-[2] mt-0.5 flex-shrink-0" />
							<span class="text-sm">Easy navigation</span>
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
