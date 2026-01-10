<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { ArrowRight, Users, FileText, Handshake } from 'lucide-svelte';
	
	interface Props {
		leads: number;
		opportunities: number;
		deals: number;
		leadToOppConversion: number;
		oppToDealConversion: number;
	}
	
	let { leads, opportunities, deals, leadToOppConversion, oppToDealConversion }: Props = $props();
	
	const maxValue = $derived(Math.max(leads, opportunities, deals, 1));
	const leadsWidth = $derived((leads / maxValue) * 100);
	const oppsWidth = $derived((opportunities / maxValue) * 100);
	const dealsWidth = $derived((deals / maxValue) * 100);
</script>

<Card class="p-6">
	<h2 class="text-2xl font-bold mb-6">Sales Pipeline</h2>
	
	<div class="space-y-6">
		<!-- Leads Stage -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
						<Users class="size-5 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<h3 class="font-semibold text-lg">Leads</h3>
						<p class="text-sm text-muted-foreground">Initial contacts</p>
					</div>
				</div>
				<span class="text-3xl font-bold">{leads}</span>
			</div>
			<div class="w-full bg-muted rounded-full h-3">
				<div 
					class="bg-blue-500 h-3 rounded-full transition-all duration-500" 
					style="width: {leadsWidth}%"
				></div>
			</div>
		</div>

		<!-- Conversion Arrow -->
		<div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
			<ArrowRight class="size-4" />
			<span class="font-medium">{leadToOppConversion.toFixed(1)}% conversion</span>
			<ArrowRight class="size-4" />
		</div>

		<!-- Opportunities Stage -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900">
						<FileText class="size-5 text-purple-600 dark:text-purple-400" />
					</div>
					<div>
						<h3 class="font-semibold text-lg">Opportunities</h3>
						<p class="text-sm text-muted-foreground">Qualified prospects</p>
					</div>
				</div>
				<span class="text-3xl font-bold">{opportunities}</span>
			</div>
			<div class="w-full bg-muted rounded-full h-3">
				<div 
					class="bg-purple-500 h-3 rounded-full transition-all duration-500" 
					style="width: {oppsWidth}%"
				></div>
			</div>
		</div>

		<!-- Conversion Arrow -->
		<div class="flex items-center justify-center gap-2 text-sm text-muted-foreground">
			<ArrowRight class="size-4" />
			<span class="font-medium">{oppToDealConversion.toFixed(1)}% conversion</span>
			<ArrowRight class="size-4" />
		</div>

		<!-- Deals Stage -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
						<Handshake class="size-5 text-green-600 dark:text-green-400" />
					</div>
					<div>
						<h3 class="font-semibold text-lg">Deals</h3>
						<p class="text-sm text-muted-foreground">Closed won</p>
					</div>
				</div>
				<span class="text-3xl font-bold text-green-600">{deals}</span>
			</div>
			<div class="w-full bg-muted rounded-full h-3">
				<div 
					class="bg-green-500 h-3 rounded-full transition-all duration-500" 
					style="width: {dealsWidth}%"
				></div>
			</div>
		</div>
	</div>
</Card>
