<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Props {
		active: number;
		inactive: number;
		retired: number;
		male: number;
		female: number;
	}

	let { active, inactive, retired, male, female }: Props = $props();

	let chartContainer: HTMLDivElement;

	const statusData = $derived([
		{ status: 'Active', count: active, color: '#10b981' },
		{ status: 'Inactive', count: inactive, color: '#f59e0b' },
		{ status: 'Retired', count: retired, color: '#6b7280' }
	]);

	const genderData = $derived([
		{ gender: 'Male', count: male, color: '#3b82f6' },
		{ gender: 'Female', count: female, color: '#ec4899' }
	]);

	function createChart() {
		if (!chartContainer) return;

		d3.select(chartContainer).selectAll('*').remove();

		const width = 300;
		const height = 200;
		const barHeight = 30;
		const margin = { top: 10, right: 80, bottom: 10, left: 100 };

		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', '100%')
			.attr('height', height)
			.attr('viewBox', `0 0 ${width} ${height}`)
			.attr('preserveAspectRatio', 'xMidYMid meet');

		// Status bars
		const statusGroup = svg.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const maxCount = Math.max(...statusData.map(d => d.count), 1);
		const xScale = d3.scaleLinear()
			.domain([0, maxCount])
			.range([0, width - margin.left - margin.right]);

		statusData.forEach((d, i) => {
			const y = i * (barHeight + 10);

			// Label
			statusGroup.append('text')
				.attr('x', -10)
				.attr('y', y + barHeight / 2)
				.attr('text-anchor', 'end')
				.attr('dy', '0.35em')
				.style('fill', 'currentColor')
				.style('font-size', '12px')
				.style('font-weight', '500')
				.text(d.status);

			// Bar
			statusGroup.append('rect')
				.attr('x', 0)
				.attr('y', y)
				.attr('width', xScale(d.count))
				.attr('height', barHeight)
				.attr('fill', d.color)
				.attr('opacity', 0.8)
				.attr('rx', 4)
				.on('mouseenter', function() {
					d3.select(this).attr('opacity', 1);
				})
				.on('mouseleave', function() {
					d3.select(this).attr('opacity', 0.8);
				});

			// Count label
			statusGroup.append('text')
				.attr('x', xScale(d.count) + 8)
				.attr('y', y + barHeight / 2)
				.attr('dy', '0.35em')
				.style('fill', 'currentColor')
				.style('font-size', '14px')
				.style('font-weight', 'bold')
				.text(d.count);
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

<div class="flex flex-col">
	{#if active === 0 && inactive === 0 && retired === 0}
		<div class="text-center text-muted-foreground py-8">
			No pro data available
		</div>
	{:else}
		<div bind:this={chartContainer} class="chart-container w-full"></div>
		
		<!-- Gender Distribution -->
		<div class="mt-6 pt-4 border-t">
			<h4 class="text-sm font-semibold mb-3">Gender Distribution</h4>
			<div class="grid grid-cols-2 gap-3">
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-blue-500"></div>
					<span class="text-sm">Male: <span class="font-bold">{male}</span></span>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-pink-500"></div>
					<span class="text-sm">Female: <span class="font-bold">{female}</span></span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.chart-container {
		max-width: 400px;
		margin: 0 auto;
	}
</style>
