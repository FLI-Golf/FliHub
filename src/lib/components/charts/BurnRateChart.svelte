<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Props {
		totalBudget: number;
		actualSpent: number;
		forecasted: number;
	}

	let { totalBudget = 0, actualSpent = 0, forecasted = 0 }: Props = $props();

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

		const data = [
			{ label: 'Budget', value: totalBudget, color: '#3b82f6' },
			{ label: 'Forecasted', value: forecasted, color: '#f59e0b' },
			{ label: 'Actual', value: actualSpent, color: actualSpent > totalBudget ? '#ef4444' : '#10b981' }
		];

		const margin = { top: 20, right: 20, bottom: 60, left: 80 };
		const width = 400 - margin.left - margin.right;
		const height = 300 - margin.top - margin.bottom;

		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		const x = d3
			.scaleBand()
			.domain(data.map((d) => d.label))
			.range([0, width])
			.padding(0.3);

		const maxValue = Math.max(totalBudget, forecasted, actualSpent) || 100;
		const y = d3
			.scaleLinear()
			.domain([0, maxValue * 1.1])
			.nice()
			.range([height, 0]);

		// X axis
		svg
			.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(d3.axisBottom(x))
			.selectAll('text')
			.style('fill', 'currentColor')
			.style('font-size', '12px');

		// Y axis
		svg
			.append('g')
			.call(d3.axisLeft(y).ticks(5).tickFormat(d => formatCurrency(d as number)))
			.selectAll('text')
			.style('fill', 'currentColor')
			.style('font-size', '11px');

		// Style axis lines
		svg.selectAll('.domain, .tick line')
			.style('stroke', 'currentColor')
			.style('opacity', 0.2);

		// Budget line (reference)
		if (totalBudget > 0) {
			svg
				.append('line')
				.attr('x1', 0)
				.attr('x2', width)
				.attr('y1', y(totalBudget))
				.attr('y2', y(totalBudget))
				.attr('stroke', '#3b82f6')
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', '5,5')
				.attr('opacity', 0.5);
		}

		// Bars
		const bars = svg
			.selectAll('.bar')
			.data(data)
			.enter()
			.append('g')
			.attr('class', 'bar');

		bars
			.append('rect')
			.attr('x', (d) => x(d.label)!)
			.attr('y', (d) => y(d.value))
			.attr('width', x.bandwidth())
			.attr('height', (d) => height - y(d.value))
			.attr('fill', (d) => d.color)
			.attr('rx', 4)
			.style('opacity', 0.9)
			.on('mouseenter', function(event, d) {
				d3.select(this).style('opacity', 1).style('cursor', 'pointer');
				
				// Show tooltip
				const tooltip = d3.select(chartContainer)
					.append('div')
					.attr('class', 'tooltip')
					.style('position', 'absolute')
					.style('background', 'rgba(0, 0, 0, 0.9)')
					.style('color', 'white')
					.style('padding', '8px 12px')
					.style('border-radius', '4px')
					.style('font-size', '12px')
					.style('pointer-events', 'none')
					.style('z-index', '1000')
					.html(`<strong>${d.label}</strong><br/>${formatCurrency(d.value)}`);
				
				const [x, y] = d3.pointer(event, chartContainer);
				tooltip
					.style('left', `${x + 10}px`)
					.style('top', `${y - 10}px`);
			})
			.on('mouseleave', function() {
				d3.select(this).style('opacity', 0.9);
				d3.select(chartContainer).selectAll('.tooltip').remove();
			});

		// Value labels on top of bars
		bars
			.append('text')
			.attr('x', (d) => x(d.label)! + x.bandwidth() / 2)
			.attr('y', (d) => y(d.value) - 5)
			.attr('text-anchor', 'middle')
			.style('font-size', '11px')
			.style('font-weight', 'bold')
			.style('fill', 'currentColor')
			.text((d) => formatCurrency(d.value));
	}

	// Calculate metrics
	let burnRate = $derived(totalBudget > 0 ? (actualSpent / totalBudget) * 100 : 0);
	let projectedOverrun = $derived(forecasted > totalBudget ? forecasted - totalBudget : 0);
	let healthStatus = $derived(
		actualSpent > totalBudget ? 'Over Budget' :
		forecasted > totalBudget ? 'At Risk' :
		burnRate > 80 ? 'Warning' :
		'Healthy'
	);
	let healthColor = $derived(
		healthStatus === 'Over Budget' ? 'text-red-600 dark:text-red-400' :
		healthStatus === 'At Risk' ? 'text-orange-600 dark:text-orange-400' :
		healthStatus === 'Warning' ? 'text-yellow-600 dark:text-yellow-400' :
		'text-green-600 dark:text-green-400'
	);

	onMount(() => {
		createChart();
	});

	$effect(() => {
		if (chartContainer) {
			createChart();
		}
	});
</script>

<div class="flex flex-col">
	<div bind:this={chartContainer} class="chart-container relative"></div>
	
	<div class="mt-6 space-y-3 border-t pt-4">
		<div class="flex items-center justify-between">
			<span class="text-sm text-muted-foreground">Burn Rate</span>
			<span class="font-semibold">{burnRate.toFixed(1)}%</span>
		</div>
		<div class="flex items-center justify-between">
			<span class="text-sm text-muted-foreground">Financial Health</span>
			<span class="font-semibold {healthColor}">{healthStatus}</span>
		</div>
		{#if projectedOverrun > 0}
			<div class="flex items-center justify-between">
				<span class="text-sm text-muted-foreground">Projected Overrun</span>
				<span class="font-semibold text-red-600 dark:text-red-400">
					{formatCurrency(projectedOverrun)}
				</span>
			</div>
		{/if}
		<div class="flex items-center justify-between">
			<span class="text-sm text-muted-foreground">Remaining Budget</span>
			<span class="font-semibold {totalBudget - actualSpent < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}">
				{formatCurrency(totalBudget - actualSpent)}
			</span>
		</div>
	</div>
</div>

<style>
	.chart-container {
		width: 100%;
		display: flex;
		justify-content: center;
	}
</style>
