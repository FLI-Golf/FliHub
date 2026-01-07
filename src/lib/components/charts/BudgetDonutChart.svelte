<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Props {
		actual: number;
		remaining: number;
		total: number;
	}

	let { actual = 0, remaining = 0, total = 0 }: Props = $props();

	let chartContainer: HTMLDivElement;

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	function createChart() {
		if (!chartContainer) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		const width = 280;
		const height = 280;
		const radius = Math.min(width, height) / 2;
		const innerRadius = radius * 0.6;

		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.append('g')
			.attr('transform', `translate(${width / 2},${height / 2})`);

		const data = total > 0 
			? [
				{ label: 'Spent', value: actual, color: '#3b82f6' },
				{ label: 'Remaining', value: remaining, color: '#10b981' }
			]
			: [{ label: 'No Budget', value: 1, color: '#94a3b8' }];

		const pie = d3.pie<any>().value((d) => d.value).sort(null);

		const arc = d3.arc<any>().innerRadius(innerRadius).outerRadius(radius);

		const arcs = svg
			.selectAll('arc')
			.data(pie(data))
			.enter()
			.append('g')
			.attr('class', 'arc');

		arcs
			.append('path')
			.attr('d', arc)
			.attr('fill', (d) => d.data.color)
			.attr('stroke', 'white')
			.attr('stroke-width', 2)
			.style('opacity', 0.9)
			.on('mouseenter', function() {
				d3.select(this).style('opacity', 1).style('cursor', 'pointer');
			})
			.on('mouseleave', function() {
				d3.select(this).style('opacity', 0.9);
			});

		// Center text
		const centerText = svg.append('g').attr('class', 'center-text');

		if (total > 0) {
			const percentage = ((actual / total) * 100).toFixed(1);
			
			centerText
				.append('text')
				.attr('text-anchor', 'middle')
				.attr('dy', '-0.2em')
				.style('font-size', '32px')
				.style('font-weight', 'bold')
				.style('fill', 'currentColor')
				.text(`${percentage}%`);

			centerText
				.append('text')
				.attr('text-anchor', 'middle')
				.attr('dy', '1.5em')
				.style('font-size', '14px')
				.style('fill', 'currentColor')
				.style('opacity', 0.7)
				.text('Used');
		} else {
			centerText
				.append('text')
				.attr('text-anchor', 'middle')
				.attr('dy', '0.3em')
				.style('font-size', '16px')
				.style('fill', 'currentColor')
				.style('opacity', 0.7)
				.text('No Budget');
		}
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
	<div bind:this={chartContainer} class="chart-container"></div>
	{#if total > 0}
		<div class="mt-4 space-y-2 w-full">
			<div class="flex items-center justify-between text-sm">
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-blue-500"></div>
					<span>Spent</span>
				</div>
				<span class="font-semibold">{formatCurrency(actual)}</span>
			</div>
			<div class="flex items-center justify-between text-sm">
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-green-500"></div>
					<span>Remaining</span>
				</div>
				<span class="font-semibold">{formatCurrency(remaining)}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.chart-container {
		width: 100%;
		display: flex;
		justify-content: center;
	}
</style>
