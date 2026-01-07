<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface DepartmentBudget {
		id: string;
		name: string;
		budget: number;
		actual: number;
		forecasted: number;
		projectCount: number;
	}

	interface Props {
		departments: DepartmentBudget[];
	}

	let { departments = [] }: Props = $props();

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
		if (!chartContainer || departments.length === 0) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		// Sort by budget descending
		const sortedData = [...departments].sort((a, b) => b.budget - a.budget);

		const width = 500;
		const height = Math.max(300, sortedData.length * 50);
		const margin = { top: 20, right: 120, bottom: 40, left: 150 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// Scales
		const y = d3
			.scaleBand()
			.domain(sortedData.map((d) => d.name))
			.range([0, innerHeight])
			.padding(0.3);

		const maxValue = d3.max(sortedData, (d) => Math.max(d.budget, d.actual)) || 100;
		const x = d3
			.scaleLinear()
			.domain([0, maxValue])
			.nice()
			.range([0, innerWidth]);

		// Y axis (department names)
		svg
			.append('g')
			.call(d3.axisLeft(y))
			.selectAll('text')
			.style('fill', 'currentColor')
			.style('font-size', '12px');

		// X axis (budget amounts)
		svg
			.append('g')
			.attr('transform', `translate(0,${innerHeight})`)
			.call(d3.axisBottom(x).ticks(5).tickFormat(d => formatCurrency(d as number)))
			.selectAll('text')
			.style('fill', 'currentColor')
			.style('font-size', '11px')
			.attr('transform', 'rotate(-15)')
			.style('text-anchor', 'end');

		// Style axis lines
		svg.selectAll('.domain, .tick line')
			.style('stroke', 'currentColor')
			.style('opacity', 0.2);

		// Budget bars (background)
		svg
			.selectAll('.budget-bar')
			.data(sortedData)
			.enter()
			.append('rect')
			.attr('class', 'budget-bar')
			.attr('x', 0)
			.attr('y', (d) => y(d.name)!)
			.attr('width', (d) => x(d.budget))
			.attr('height', y.bandwidth())
			.attr('fill', '#3b82f6')
			.attr('opacity', 0.3)
			.attr('rx', 4);

		// Actual spending bars (foreground)
		svg
			.selectAll('.actual-bar')
			.data(sortedData)
			.enter()
			.append('rect')
			.attr('class', 'actual-bar')
			.attr('x', 0)
			.attr('y', (d) => y(d.name)!)
			.attr('width', (d) => x(d.actual))
			.attr('height', y.bandwidth())
			.attr('fill', (d) => d.actual > d.budget ? '#ef4444' : '#10b981')
			.attr('opacity', 0.9)
			.attr('rx', 4)
			.on('mouseenter', function(event, d) {
				d3.select(this).attr('opacity', 1).style('cursor', 'pointer');
				
				// Show tooltip
				const tooltip = d3.select(chartContainer)
					.append('div')
					.attr('class', 'tooltip')
					.style('position', 'absolute')
					.style('background', 'rgba(0, 0, 0, 0.9)')
					.style('color', 'white')
					.style('padding', '12px')
					.style('border-radius', '6px')
					.style('font-size', '12px')
					.style('pointer-events', 'none')
					.style('z-index', '1000')
					.style('max-width', '250px')
					.html(`
						<strong>${d.name}</strong><br/>
						<span style="color: #93c5fd;">Budget: ${formatCurrency(d.budget)}</span><br/>
						<span style="color: ${d.actual > d.budget ? '#fca5a5' : '#86efac'};">Spent: ${formatCurrency(d.actual)}</span><br/>
						<span style="color: #fbbf24;">Forecasted: ${formatCurrency(d.forecasted)}</span><br/>
						<span style="opacity: 0.8;">Projects: ${d.projectCount}</span>
					`);
				
				const [x, y] = d3.pointer(event, chartContainer);
				tooltip
					.style('left', `${x + 10}px`)
					.style('top', `${y - 10}px`);
			})
			.on('mouseleave', function() {
				d3.select(this).attr('opacity', 0.9);
				d3.select(chartContainer).selectAll('.tooltip').remove();
			});

		// Value labels
		svg
			.selectAll('.value-label')
			.data(sortedData)
			.enter()
			.append('text')
			.attr('class', 'value-label')
			.attr('x', (d) => x(d.actual) + 5)
			.attr('y', (d) => y(d.name)! + y.bandwidth() / 2)
			.attr('dy', '0.35em')
			.style('font-size', '11px')
			.style('font-weight', 'bold')
			.style('fill', 'currentColor')
			.text((d) => formatCurrency(d.actual));
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

<div class="flex flex-col">
	{#if departments.length === 0}
		<div class="text-center text-muted-foreground py-8">
			No department budget data available
		</div>
	{:else}
		<div bind:this={chartContainer} class="chart-container relative"></div>
		<div class="mt-4 flex items-center justify-center gap-6 text-sm">
			<div class="flex items-center gap-2">
				<div class="w-4 h-3 bg-blue-500 opacity-30 rounded"></div>
				<span>Allocated Budget</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-4 h-3 bg-green-500 rounded"></div>
				<span>Actual Spent</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.chart-container {
		width: 100%;
		overflow-x: auto;
	}
</style>
