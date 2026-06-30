<script lang="ts">
	import { ChevronUp } from 'lucide-svelte';

	let visible = $state(false);

	function onScroll() {
		const scrollRoot = document.querySelector<HTMLElement>('[data-scroll-root]');
		const rootScrollTop = scrollRoot?.scrollTop ?? 0;
		visible = Math.max(window.scrollY, rootScrollTop) > 120;
	}

	function scrollToTop() {
		const scrollRoot = document.querySelector<HTMLElement>('[data-scroll-root]');
		if (scrollRoot) {
			scrollRoot.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}

		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	$effect(() => {
		onScroll();
		document.addEventListener('scroll', onScroll, { passive: true, capture: true });
		window.addEventListener('resize', onScroll, { passive: true });

		return () => {
			document.removeEventListener('scroll', onScroll, { capture: true });
			window.removeEventListener('resize', onScroll);
		};
	});
</script>

{#if visible}
	<button
		onclick={scrollToTop}
		aria-label="Scroll to top"
		class="fixed bottom-6 right-4 sm:right-6 z-50 flex items-center justify-center
		       size-11 rounded-full bg-emerald-600 border border-emerald-400 text-white shadow-xl shadow-emerald-900/35
		       hover:bg-emerald-500 hover:border-emerald-300
		       transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl"
	>
		<ChevronUp class="size-5" />
	</button>
{/if}
