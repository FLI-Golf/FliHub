<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Props {
		leads: number;
		opportunities: number;
		deals: number;
	}

	let { leads, opportunities, deals }: Props = $props();

	let chartContainer: HTMLDivElement;

	const pipelineData = $derived([
		{ stage: 'Leads', count: leads, color: '#60a5fa' },
		{ stage: 'Opportunities', count: opportunities, color: '#34d399' },
		{ stage: 'Deals', count: deals, color: '#10b981' }
	]);

	function createFunnelChart() {
		if (!chartContainer) return;

		d3.select(chartContainer).selectAll('*').remove();

		const width = 300;
		const height = 250;
		const margin = { top: 20, right: 20, bottom: 20, left: 20 };
		const innerWidth = width - margin.left - margin.right;
		const innerHeight = height - margin.top - margin.bottom;

		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', '100%')
			.attr('height', height)
			.attr('viewBox', `0 0 ${width} ${height}`)
			.attr('preserveAspectRatio', 'xMidYMid meet')
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		const maxCount = Math.max(leads, opportunities, deals, 1);
		const stageHeight = innerHeight / pipelineData.length;

		pipelineData.forEach((stage, i) => {
			const y = i * stageHeight;
			const widthRatio = stage.count / maxCount;
			const barWidth = innerWidth * widthRatio;
			const x = (innerWidth - barWidth) / 2;

			// Draw trapezoid/funnel shape
			const group = svg.append('g')
				.attr('class', 'funnel-stage');

			// Background bar
			group.append('rect')
				.attr('x', x)
				.attr('y', y + 5)
				.attr('width', barWidth)
				.attr('height', stageHeight - 10)
				.attr('fill', stage.color)
				.attr('opacity', 0.8)
				.attr('rx', 4)
				.on('mouseenter', function() {
					d3.select(this)
						.transition()
						.duration(200)
						.attr('opacity', 1);
				})
				.on('mouseleave', function() {
					d3.select(this)
						.transition()
						.duration(200)
						.attr('opacity', 0.8);
				});

			// Stage label
			group.append('text')
				.attr('x', innerWidth / 2)
				.attr('y', y + stageHeight / 2 - 10)
				.attr('text-anchor', 'middle')
				.style('fill', 'white')
				.style('font-size', '13px')
				.style('font-weight', '600')
				.text(stage.stage);

			// Count label
			group.append('text')
				.attr('x', innerWidth / 2)
				.attr('y', y + stageHeight / 2 + 10)
				.attr('text-anchor', 'middle')
				.style('fill', 'white')
				.style('font-size', '18px')
				.style('font-weight', 'bold')
				.text(stage.count);

			// Conversion rate (if not first stage)
			if (i > 0) {
				const prevCount = pipelineData[i - 1].count;
				const conversionRate = prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(1) : '0.0';
				
				group.append('text')
					.attr('x', innerWidth / 2)
					.attr('y', y - 2)
					.attr('text-anchor', 'middle')
					.style('fill', 'currentColor')
					.style('font-size', '11px')
					.style('opacity', 0.7)
					.text(`${conversionRate}% conversion`);
			}
		});
	}

	onMount(() => {
		createFunnelChart();
	});

	$effect(() => {
		if (chartContainer) {
			createFunnelChart();
		}
	});
</script>

<div class="flex flex-col">
	{#if leads === 0 && opportunities === 0 && deals === 0}
		<div class="text-center text-muted-foreground py-8">
			No pipeline data available
		</div>
	{:else}
		<div bind:this={chartContainer} class="chart-container w-full"></div>
	{/if}
</div>

<style>
	.chart-container {
		max-width: 300px;
		margin: 0 auto;
	}
</style>
