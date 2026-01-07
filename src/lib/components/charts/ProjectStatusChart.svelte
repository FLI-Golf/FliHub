<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Props {
		draft: number;
		planned: number;
		active: number;
		completed: number;
		cancelled: number;
	}

	let { draft = 0, planned = 0, active = 0, completed = 0, cancelled = 0 }: Props = $props();

	let chartContainer: HTMLDivElement;

	function createChart() {
		if (!chartContainer) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		const data = [
			{ label: 'Draft', value: draft, color: '#94a3b8' },
			{ label: 'Planned', value: planned, color: '#3b82f6' },
			{ label: 'Active', value: active, color: '#f59e0b' },
			{ label: 'Completed', value: completed, color: '#10b981' },
			{ label: 'Cancelled', value: cancelled, color: '#ef4444' }
		].filter(d => d.value > 0);

		if (data.length === 0) {
			data.push({ label: 'No Projects', value: 1, color: '#94a3b8' });
		}

		const width = 280;
		const height = 280;
		const radius = Math.min(width, height) / 2;

		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.append('g')
			.attr('transform', `translate(${width / 2},${height / 2})`);

		const pie = d3.pie<any>().value((d) => d.value).sort(null);

		const arc = d3.arc<any>().innerRadius(0).outerRadius(radius);

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
			.on('mouseenter', function(event, d) {
				d3.select(this).style('opacity', 1).style('cursor', 'pointer');
				
				// Show tooltip
				const tooltip = d3.select(chartContainer)
					.append('div')
					.attr('class', 'tooltip')
					.style('position', 'absolute')
					.style('background', 'rgba(0, 0, 0, 0.8)')
					.style('color', 'white')
					.style('padding', '8px 12px')
					.style('border-radius', '4px')
					.style('font-size', '12px')
					.style('pointer-events', 'none')
					.style('z-index', '1000')
					.html(`<strong>${d.data.label}</strong><br/>${d.data.value} projects`);
				
				const [x, y] = d3.pointer(event, chartContainer);
				tooltip
					.style('left', `${x + 10}px`)
					.style('top', `${y - 10}px`);
			})
			.on('mouseleave', function() {
				d3.select(this).style('opacity', 0.9);
				d3.select(chartContainer).selectAll('.tooltip').remove();
			});

		// Add percentage labels
		arcs
			.append('text')
			.attr('transform', (d) => `translate(${arc.centroid(d)})`)
			.attr('text-anchor', 'middle')
			.style('font-size', '14px')
			.style('font-weight', 'bold')
			.style('fill', 'white')
			.style('text-shadow', '0 1px 2px rgba(0,0,0,0.6)')
			.text((d) => {
				const total = d3.sum(data, (item) => item.value);
				const percentage = ((d.data.value / total) * 100).toFixed(0);
				return percentage > 5 ? `${percentage}%` : '';
			});
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
	<div bind:this={chartContainer} class="chart-container relative"></div>
	<div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 w-full text-sm">
		{#if draft > 0}
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full bg-slate-400"></div>
				<span>Draft: {draft}</span>
			</div>
		{/if}
		{#if planned > 0}
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full bg-blue-500"></div>
				<span>Planned: {planned}</span>
			</div>
		{/if}
		{#if active > 0}
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full bg-amber-500"></div>
				<span>Active: {active}</span>
			</div>
		{/if}
		{#if completed > 0}
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full bg-green-500"></div>
				<span>Completed: {completed}</span>
			</div>
		{/if}
		{#if cancelled > 0}
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 rounded-full bg-red-500"></div>
				<span>Cancelled: {cancelled}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.chart-container {
		width: 100%;
		display: flex;
		justify-content: center;
	}
</style>
