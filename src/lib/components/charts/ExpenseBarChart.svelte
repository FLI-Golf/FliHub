<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Props {
		draft: number;
		submitted: number;
		approved: number;
		paid: number;
	}

	let { draft = 0, submitted = 0, approved = 0, paid = 0 }: Props = $props();

	let chartContainer: HTMLDivElement;

	function createChart() {
		if (!chartContainer) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		const data = [
			{ label: 'Draft', value: draft, color: '#64748b' },
			{ label: 'Submitted', value: submitted, color: '#3b82f6' },
			{ label: 'Approved', value: approved, color: '#10b981' },
			{ label: 'Paid', value: paid, color: '#059669' }
		];

		const margin = { top: 20, right: 20, bottom: 60, left: 50 };
		const width = 400 - margin.left - margin.right;
		const height = 280 - margin.top - margin.bottom;

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

		const maxValue = d3.max(data, (d) => d.value) || 10;
		const y = d3
			.scaleLinear()
			.domain([0, maxValue])
			.nice()
			.range([height, 0]);

		// X axis
		svg
			.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(d3.axisBottom(x))
			.selectAll('text')
			.style('text-anchor', 'end')
			.attr('dx', '-.8em')
			.attr('dy', '.15em')
			.attr('transform', 'rotate(-45)')
			.style('fill', 'currentColor');

		// Y axis
		svg
			.append('g')
			.call(d3.axisLeft(y).ticks(5))
			.selectAll('text')
			.style('fill', 'currentColor');

		// Style axis lines
		svg.selectAll('.domain, .tick line')
			.style('stroke', 'currentColor')
			.style('opacity', 0.2);

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
			.on('mouseenter', function() {
				d3.select(this).style('opacity', 1).style('cursor', 'pointer');
			})
			.on('mouseleave', function() {
				d3.select(this).style('opacity', 0.9);
			});

		// Value labels on top of bars
		bars
			.append('text')
			.attr('x', (d) => x(d.label)! + x.bandwidth() / 2)
			.attr('y', (d) => y(d.value) - 5)
			.attr('text-anchor', 'middle')
			.style('font-size', '12px')
			.style('font-weight', 'bold')
			.style('fill', 'currentColor')
			.text((d) => d.value);
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
</div>

<style>
	.chart-container {
		width: 100%;
		display: flex;
		justify-content: center;
	}
</style>
