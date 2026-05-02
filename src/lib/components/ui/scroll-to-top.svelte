<script lang="ts">
	import { ChevronUp } from 'lucide-svelte';

	let visible = $state(false);

	function onScroll() {
		visible = window.scrollY > 300;
	}

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	$effect(() => {
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

{#if visible}
	<button
		onclick={scrollToTop}
		aria-label="Scroll to top"
		class="fixed bottom-6 right-6 z-50 flex size-10 items-center justify-center rounded-full
		       bg-slate-800 border border-slate-600 text-slate-200 shadow-lg
		       hover:bg-slate-700 hover:border-slate-500 hover:text-white
		       transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
	>
		<ChevronUp class="size-5" />
	</button>
{/if}
