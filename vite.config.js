import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],

	// Don’t run the optimize-svelte prebundle on threlte packages
	optimizeDeps: {
		exclude: ['@threlte/core', '@threlte/extras']
	},

	// Ensure these are compiled by Vite/Svelte during SSR too
	ssr: {
		noExternal: ['@threlte/core', '@threlte/extras']
	}
});
