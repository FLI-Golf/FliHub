import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	},
	onwarn: (warning, handler) => {
		// Ignore a11y warnings during build
		if (warning.code.startsWith('a11y_')) return;
		// Ignore svelte_component_deprecated warnings
		if (warning.code === 'svelte_component_deprecated') return;
		handler(warning);
	}
};

export default config;
