<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Props {
		tier_1: number;
		tier_2: number;
		tier_3: number;
		tier_4: number;
	}

	let { tier_1, tier_2, tier_3, tier_4 }: Props = $props();

	let chartContainer: HTMLDivElement;

	const tierData = $derived([
		{ tier: 'Tier 1 - Premium', count: tier_1, color: '#3b82f6' },
		{ tier: 'Tier 2 - Elite', count: tier_2, color: '#8b5cf6' },
		{ tier: 'Tier 3 - Standard', count: tier_3, color: '#10b981' },
		{ tier: 'Tier 4 - Growth', count: tier_4, color: '#f59e0b' }
	]);

	function createChart() {
		if (!chartContainer || tierData.every(d => d.count === 0)) return;

		d3.select(chartContainer).selectAll('*').remove();

		const width = 300;
		const height = 300;
		const radius = Math.min(width, height) / 2;

		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', '100%')
			.attr('height', height)
			.attr('viewBox', `0 0 ${width} ${height}`)
			.attr('preserveAspectRatio', 'xMidYMid meet')
			.append('g')
			.attr('transform', `translate(${width / 2},${height / 2})`);

		const pie = d3.pie<any>()
			.value(d => d.count)
			.sort(null);

		const arc = d3.arc<any>()
			.innerRadius(radius * 0.5)
			.outerRadius(radius * 0.8);

		const outerArc = d3.arc<any>()
			.innerRadius(radius * 0.9)
			.outerRadius(radius * 0.9);

		// Draw pie slices
		const slices = svg.selectAll('.slice')
			.data(pie(tierData))
			.enter()
			.append('g')
			.attr('class', 'slice');

		slices.append('path')
			.attr('d', arc)
			.attr('fill', d => d.data.color)
			.attr('opacity', 0.9)
			.attr('stroke', 'currentColor')
			.attr('stroke-width', 2)
			.on('mouseenter', function(event, d) {
				d3.select(this)
					.transition()
					.duration(200)
					.attr('opacity', 1)
					.attr('transform', 'scale(1.05)');
			})
			.on('mouseleave', function() {
				d3.select(this)
					.transition()
					.duration(200)
					.attr('opacity', 0.9)
					.attr('transform', 'scale(1)');
			});

		// Add labels
		slices.append('text')
			.attr('transform', d => {
				const pos = arc.centroid(d);
				return `translate(${pos})`;
			})
			.attr('text-anchor', 'middle')
			.attr('dy', '0.35em')
			.style('fill', 'white')
			.style('font-size', '16px')
			.style('font-weight', 'bold')
			.text(d => d.data.count > 0 ? d.data.count : '');
	}

	onMount(() => {
		createChart();
	});

	$effect(() => {
		if (chartContainer) {
			createChart();
		}
	});
</script>

<div class="flex flex-col items-center">
	{#if tierData.every(d => d.count === 0)}
		<div class="text-center text-muted-foreground py-8">
			No sponsor data available
		</div>
	{:else}
		<div bind:this={chartContainer} class="chart-container w-full"></div>
		<div class="mt-4 grid grid-cols-2 gap-3 w-full text-sm">
			{#each tierData as tier}
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded" style="background-color: {tier.color}"></div>
					<span class="text-xs">{tier.tier}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.chart-container {
		max-width: 300px;
		margin: 0 auto;
	}
</style>
