<script lang="ts">
	import Card from '$lib/components/ui/card.svelte';
	import { MapPin, CheckCircle2, Clock, XCircle } from 'lucide-svelte';
	import ProgressBar from '$lib/components/metrics/progress-bar.svelte';

	interface Props {
		total: number;
		available: number;
		reserved: number;
		sold: number;
	}

	let { total, available, reserved, sold }: Props = $props();

	const soldPercentage = $derived(total > 0 ? (sold / total) * 100 : 0);
	const reservedPercentage = $derived(total > 0 ? (reserved / total) * 100 : 0);
	const availablePercentage = $derived(total > 0 ? (available / total) * 100 : 0);
</script>

<Card class="p-6">
	<div class="flex items-center justify-between mb-6">
		<h3 class="text-lg font-semibold">Territory Coverage</h3>
		<MapPin class="size-5 text-muted-foreground" />
	</div>

	<div class="space-y-4">
		<!-- Total Territories -->
		<div class="text-center pb-4 border-b">
			<p class="text-sm text-muted-foreground mb-1">Total Territories</p>
			<p class="text-3xl font-bold">{total}</p>
		</div>

		<!-- Sold -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<CheckCircle2 class="size-4 text-green-600" />
					<span class="text-sm font-medium">Sold</span>
				</div>
				<div class="text-right">
					<span class="text-2xl font-bold text-green-600">{sold}</span>
					<span class="text-xs text-muted-foreground ml-2">({soldPercentage.toFixed(0)}%)</span>
				</div>
			</div>
			<ProgressBar value={soldPercentage} max={100} color="green" />
		</div>

		<!-- Reserved -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Clock class="size-4 text-yellow-600" />
					<span class="text-sm font-medium">Reserved</span>
				</div>
				<div class="text-right">
					<span class="text-2xl font-bold text-yellow-600">{reserved}</span>
					<span class="text-xs text-muted-foreground ml-2">({reservedPercentage.toFixed(0)}%)</span>
				</div>
			</div>
			<ProgressBar value={reservedPercentage} max={100} color="yellow" />
		</div>

		<!-- Available -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<XCircle class="size-4 text-blue-600" />
					<span class="text-sm font-medium">Available</span>
				</div>
				<div class="text-right">
					<span class="text-2xl font-bold text-blue-600">{available}</span>
					<span class="text-xs text-muted-foreground ml-2">({availablePercentage.toFixed(0)}%)</span>
				</div>
			</div>
			<ProgressBar value={availablePercentage} max={100} color="blue" />
		</div>
	</div>
</Card>
