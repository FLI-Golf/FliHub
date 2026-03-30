<script lang="ts">
	import { arc, pie } from 'd3-shape';

	interface Slice {
		category: string;
		amount: number;
		count: number;
	}

	let { slices, total }: { slices: Slice[]; total: number } = $props();

	const SIZE = 220;
	const RADIUS = SIZE / 2;
	const INNER = RADIUS * 0.55;
	const TOOLTIP_W = 192;

	const COLORS = [
		'#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
		'#f43f5e', '#06b6d4', '#f97316', '#ec4899',
		'#14b8a6', '#6366f1'
	];

	function formatCurrency(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
	}

	function formatCategory(cat: string) {
		return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
	}

	let hoveredIndex = $state<number | null>(null);
	let mouseX = $state(0);
	let mouseY = $state(0);
	let containerEl: HTMLDivElement;

	const pieGen = pie<Slice>().value(d => d.amount).sort(null);
	const arcGen = arc<any>().innerRadius(INNER).outerRadius(RADIUS - 2);
	const arcHover = arc<any>().innerRadius(INNER).outerRadius(RADIUS + 6);

	let arcs = $derived(pieGen(slices));

	function trackMouse(e: MouseEvent) {
		const rect = containerEl.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex flex-col gap-4 sm:flex-row sm:items-center"
	bind:this={containerEl}
	onmousemove={trackMouse}
>
	<!-- SVG donut -->
	<div class="relative shrink-0 mx-auto sm:mx-0">
		<svg width={SIZE} height={SIZE} viewBox="{-RADIUS} {-RADIUS} {SIZE} {SIZE}">
			{#each arcs as d, i}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<path
					d={hoveredIndex === i ? arcHover(d) : arcGen(d)}
					fill={COLORS[i % COLORS.length]}
					opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.45}
					class="transition-all duration-150 cursor-pointer"
					onmouseenter={() => hoveredIndex = i}
					onmouseleave={() => hoveredIndex = null}
				/>
			{/each}
			<!-- Centre: show hovered slice % or totals -->
			{#if hoveredIndex !== null && slices[hoveredIndex]}
				<text text-anchor="middle" dominant-baseline="middle" y="-8"
					fill={COLORS[hoveredIndex % COLORS.length]} font-size="13" font-weight="700">
					{(slices[hoveredIndex].amount / total * 100).toFixed(1)}%
				</text>
				<text text-anchor="middle" dominant-baseline="middle" y="9" fill="#94a3b8" font-size="9">
					{formatCurrency(slices[hoveredIndex].amount)}
				</text>
			{:else}
				<text text-anchor="middle" dominant-baseline="middle" y="-8" fill="#f1f5f9" font-size="11" font-weight="600">
					{slices.length} cats
				</text>
				<text text-anchor="middle" dominant-baseline="middle" y="8" fill="#94a3b8" font-size="10">
					{formatCurrency(total)}
				</text>
			{/if}
		</svg>

		<!-- Floating tooltip anchored to mouse within the SVG container -->
		{#if hoveredIndex !== null && slices[hoveredIndex]}
			{@const s = slices[hoveredIndex]}
			{@const pct = total > 0 ? (s.amount / total * 100) : 0}
			{@const color = COLORS[hoveredIndex % COLORS.length]}
			<div
				class="pointer-events-none absolute z-50 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-3 text-sm"
				style="width:{TOOLTIP_W}px; top:{mouseY + 14}px; left:{mouseX > SIZE * 0.6 ? mouseX - TOOLTIP_W - 8 : mouseX + 12}px;"
			>
				<div class="flex items-center gap-2 mb-2.5">
					<span class="size-2.5 rounded-full shrink-0" style="background:{color}"></span>
					<span class="font-semibold text-slate-100 truncate text-xs">{formatCategory(s.category)}</span>
				</div>
				<div class="space-y-1.5">
					<div class="flex justify-between items-center">
						<span class="text-slate-400 text-xs">Amount</span>
						<span class="font-semibold text-slate-100 text-xs">{formatCurrency(s.amount)}</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-slate-400 text-xs">Share</span>
						<span class="font-bold text-xs" style="color:{color}">{pct.toFixed(1)}%</span>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-slate-400 text-xs">Expenses</span>
						<span class="font-semibold text-slate-100 text-xs">{s.count}</span>
					</div>
				</div>
				<div class="mt-2.5 h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
					<div class="h-full rounded-full" style="width:{pct.toFixed(1)}%; background:{color}"></div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Legend -->
	<div class="flex-1 space-y-1.5 min-w-0">
		{#each slices as slice, i}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="flex items-center gap-2 rounded px-2 py-1 transition-colors cursor-default {hoveredIndex === i ? 'bg-slate-700' : 'hover:bg-slate-800'}"
				onmouseenter={() => hoveredIndex = i}
				onmouseleave={() => hoveredIndex = null}
				role="presentation"
			>
				<span class="size-2.5 rounded-full shrink-0" style="background:{COLORS[i % COLORS.length]}"></span>
				<span class="text-xs text-slate-300 truncate flex-1" title={slice.category}>{formatCategory(slice.category)}</span>
				<span class="text-xs font-semibold text-slate-100 shrink-0">{formatCurrency(slice.amount)}</span>
				<span class="text-xs text-slate-500 shrink-0 w-8 text-right">{total > 0 ? (slice.amount / total * 100).toFixed(0) : 0}%</span>
			</div>
		{/each}
	</div>
</div>
