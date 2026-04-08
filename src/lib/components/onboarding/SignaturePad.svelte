<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		value?: string;
		onchange?: (dataUrl: string) => void;
		label?: string;
	}

	let { value = $bindable(''), onchange, label = 'Draw your signature' }: Props = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let isDrawing = $state(false);
	let hasSignature = $state(false);
	let lastX = 0;
	let lastY = 0;

	onMount(() => {
		ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Retina display support
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 2;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		if (value) {
			const img = new Image();
			img.onload = () => ctx?.drawImage(img, 0, 0);
			img.src = value;
			hasSignature = true;
		}
	});

	function getPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
		const rect = canvas.getBoundingClientRect();
		if (e instanceof TouchEvent) {
			return {
				x: e.touches[0].clientX - rect.left,
				y: e.touches[0].clientY - rect.top
			};
		}
		return { x: e.clientX - rect.left, y: e.clientY - rect.top };
	}

	function startDraw(e: MouseEvent | TouchEvent) {
		e.preventDefault();
		isDrawing = true;
		const pos = getPos(e);
		lastX = pos.x;
		lastY = pos.y;
	}

	function draw(e: MouseEvent | TouchEvent) {
		e.preventDefault();
		if (!isDrawing || !ctx) return;
		const pos = getPos(e);
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();
		lastX = pos.x;
		lastY = pos.y;
		hasSignature = true;
	}

	function stopDraw() {
		if (!isDrawing) return;
		isDrawing = false;
		if (hasSignature) {
			const dataUrl = canvas.toDataURL('image/png');
			value = dataUrl;
			onchange?.(dataUrl);
		}
	}

	function clear() {
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		hasSignature = false;
		value = '';
		onchange?.('');
	}
</script>

<div class="space-y-2">
	{#if label}
		<p class="text-sm font-medium text-foreground">{label}</p>
	{/if}

	<div class="relative border-2 border-dashed border-input rounded-lg overflow-hidden bg-white">
		<canvas
			bind:this={canvas}
			class="w-full h-28 cursor-crosshair touch-none"
			onmousedown={startDraw}
			onmousemove={draw}
			onmouseup={stopDraw}
			onmouseleave={stopDraw}
			ontouchstart={startDraw}
			ontouchmove={draw}
			ontouchend={stopDraw}
		></canvas>

		{#if !hasSignature}
			<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
				<p class="text-sm text-muted-foreground select-none">Sign here</p>
			</div>
		{/if}

		<!-- Baseline -->
		<div class="absolute bottom-8 left-6 right-6 border-b border-gray-300 pointer-events-none"></div>
	</div>

	<div class="flex items-center justify-between">
		<p class="text-xs text-muted-foreground">Draw your signature above</p>
		{#if hasSignature}
			<button
				type="button"
				onclick={clear}
				class="text-xs text-rose-600 hover:text-rose-700 font-medium underline"
			>
				Clear
			</button>
		{/if}
	</div>
</div>
