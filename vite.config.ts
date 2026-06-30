// Vite build config: wires up UnoCSS and SvelteKit (runes mode + Vercel adapter + mdsvex).
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { mdsvex } from 'mdsvex';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Build timestamp, surfaced in the terminal banner as the "last login" / last-update date.
	define: {
		__BUILD_DATE__: JSON.stringify(new Date().toISOString())
	},
	plugins: [
		// UnoCSS must come before the SvelteKit plugin.
		UnoCSS(),
		sveltekit({
			// `.md` files are compiled to Svelte components by mdsvex (the blog).
			// Since 2.62.0 SvelteKit reads this config inline; there is no svelte.config.js.
			extensions: ['.svelte', '.md'],
			preprocess: [mdsvex({ extensions: ['.md'] })],
			compilerOptions: {
				// Force runes mode for our own code, but NOT for node_modules and NOT for
				// mdsvex-generated `.md` components (let Svelte auto-detect those — mdsvex
				// output isn't authored in runes). Can be removed in svelte 6.
				runes: ({ filename }) => {
					const parts = filename.split(/[/\\]/);
					if (parts.includes('node_modules')) return undefined;
					if (filename.endsWith('.md')) return undefined;
					return true;
				}
			},
			// Deployed on Vercel. Pin the runtime so builds don't depend on the local Node version.
			// Swap this adapter if you ever self-host (e.g. svelte-adapter-bun).
			adapter: adapter({ runtime: 'nodejs22.x' })
		})
	]
});
