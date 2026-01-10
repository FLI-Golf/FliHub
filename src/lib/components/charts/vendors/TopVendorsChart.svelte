<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	interface Vendor {
		id: string;
		name: string;
		totalSpend: number;
		expenseCount: number;
		status: string;
		category: string;
	}

	interface Props {
		topVendors: Vendor[];
	}

	let { topVendors }: Props = $props();

	let chartContainer: HTMLDivElement;

	function formatCurrency(value: number): string {
		if (value >= 1000000) {
			return `$${(value / 1000000).toFixed(1)}M`;
		} else if (value >= 1000) {
			return `$${(value / 1000).toFixed(0)}K`;
		}
		return `$${value.toFixed(0)}`;
	}

	function createChart() {
		if (!chartContainer || topVendors.length === 0) return;

		d3.select(chartContainer).selectAll('*').remove();

		const displayVendors = topVendors.slice(0, 8);
		const width = 500;
		const height = Math.max(300, displayVendors.length * 45);
		const margin = { top: 10, right: 100, bottom: 10, left: 150 };
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

		const maxSpend = Math.max(...displayVendors.map(v => v.totalSpend), 1);
		const xScale = d3.scaleLinear()
			.domain([0, maxSpend])
			.range([0, innerWidth]);

		const yScale = d3.scaleBand()
			.domain(displayVendors.map(v => v.name))
			.range([0, innerHeight])
			.padding(0.3);

		// Vendor names
		svg.selectAll('.vendor-label')
			.data(displayVendors)
			.enter()
			.append('text')
			.attr('class', 'vendor-label')
			.attr('x', -10)
			.attr('y', d => yScale(d.name)! + yScale.bandwidth() / 2)
			.attr('text-anchor', 'end')
			.attr('dy', '0.35em')
			.style('fill', 'currentColor')
			.style('font-size', '12px')
			.style('font-weight', '500')
			.text(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name);

		// Bars
		svg.selectAll('.bar')
			.data(displayVendors)
			.enter()
			.append('rect')
			.attr('class', 'bar')
			.attr('x', 0)
			.attr('y', d => yScale(d.name)!)
			.attr('width', d => xScale(d.totalSpend))
			.attr('height', yScale.bandwidth())
			.attr('fill', '#06b6d4')
			.attr('opacity', 0.8)
			.attr('rx', 4)
			.on('mouseenter', function() {
				d3.select(this).attr('opacity', 1);
			})
			.on('mouseleave', function() {
				d3.select(this).attr('opacity', 0.8);
			});

		// Value labels
		svg.selectAll('.value-label')
			.data(displayVendors)
			.enter()
			.append('text')
			.attr('class', 'value-label')
			.attr('x', d => xScale(d.totalSpend) + 8)
			.attr('y', d => yScale(d.name)! + yScale.bandwidth() / 2)
			.attr('dy', '0.35em')
			.style('fill', 'currentColor')
			.style('font-size', '12px')
			.style('font-weight', 'bold')
			.text(d => formatCurrency(d.totalSpend));
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
	{#if topVendors.length === 0}
		<div class="text-center text-muted-foreground py-8">
			No vendor spending data available
		</div>
	{:else}
		<div bind:this={chartContainer} class="chart-container w-full"></div>
	{/if}
</div>

<style>
	.chart-container {
		max-width: 600px;
		margin: 0 auto;
	}
</style>
