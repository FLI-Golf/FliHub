<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Props {
		byType: Record<string, number>;
	}

	let { byType }: Props = $props();

	let chartContainer: HTMLDivElement;

	const typeData = $derived(
		Object.entries(byType)
			.map(([type, count]) => ({ type, count }))
			.sort((a, b) => b.count - a.count)
	);

	const colors = [
		'#3b82f6', // blue
		'#8b5cf6', // purple
		'#10b981', // green
		'#f59e0b', // amber
		'#ef4444', // red
		'#06b6d4', // cyan
		'#ec4899', // pink
		'#84cc16'  // lime
	];

	function createChart() {
		if (!chartContainer || typeData.length === 0) return;

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
			.innerRadius(radius * 0.6)
			.outerRadius(radius * 0.85);

		const slices = svg.selectAll('.slice')
			.data(pie(typeData))
			.enter()
			.append('g')
			.attr('class', 'slice');

		slices.append('path')
			.attr('d', arc)
			.attr('fill', (d, i) => colors[i % colors.length])
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

		// Add count labels
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
	{#if typeData.length === 0}
		<div class="text-center text-muted-foreground py-8">
			No campaign type data available
		</div>
	{:else}
		<div bind:this={chartContainer} class="chart-container w-full"></div>
		<div class="mt-4 grid grid-cols-2 gap-2 w-full text-xs">
			{#each typeData as { type, count }, i}
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded" style="background-color: {colors[i % colors.length]}"></div>
					<span class="truncate">{type}: {count}</span>
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
