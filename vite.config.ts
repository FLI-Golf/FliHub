import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0',
		port: 5173,
		strictPort: false,
		allowedHosts: ['.gitpod.dev']
	},
	optimizeDeps: {
		include: ['d3']
	},
	ssr: {
		// d3 is ESM-only; externalizing it in SSR context causes intermittent
		// module evaluation errors on HMR reloads — bundle it instead.
		noExternal: ['d3', /^d3-/]
	}
});
