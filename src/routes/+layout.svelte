<!--
	App shell shared by every page (header + nav + footer).

	Styling comes from two complementary imports, both required:
	  - `virtual:uno.css` is UnoCSS's virtual entrypoint; the plugin scans markup
	    for utility classes (text-term-green, mx-auto, ...) and generates exactly
	    those rules into this module at build time.
	  - `../app.css` holds the hand-written theme tokens (the `--term-*` colors /
	    `term-prompt` etc.) that the utilities and markup reference.
	Importing in the root layout guarantees the styles load once for all routes.
-->
<script lang="ts">
	import 'virtual:uno.css';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	// `nav` (link list) and `site` (name, etc.) are the single source of truth in
	// $lib/site, so navigation and branding stay in sync across the whole app.
	import { nav, site } from '$lib/site';
	// The in-browser terminal. Mounted once here so it's available on every
	// route; it's a pure enhancement (the site works without it).
	import Terminal from '$lib/components/Terminal.svelte';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	// Vercel Speed Insights & Analytics. Call once in the root layout.
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	injectSpeedInsights();
	injectAnalytics();

	// Svelte 5 runes: `children` is the page content slot passed to this layout.
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="alternate" type="application/rss+xml" title="Felix Schick — Blog" href="/blog/rss.xml" />
	<meta name="theme-color" content="#14161b" />
</svelte:head>

<!-- `gui-content`: hidden by CSS in terminal mode, shown in gui mode / no-JS. -->
<div class="gui-content min-h-screen flex flex-col max-w-3xl mx-auto px-6 py-8">
	<header class="mb-10">
		<!-- Logo rendered as a shell prompt, e.g. `felix_schick@web:~$`. -->
		<a href="/" class="text-term-green font-bold text-lg no-underline">
			{site.name.toLowerCase().replace(' ', '_')}<span class="text-term-fg">@web</span>
			<span class="text-term-dim">:~$</span>
		</a>
		<nav class="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
			{#each nav as item (item.path)}
				<!-- Active route detected by comparing each link to the live URL from
				     $app/state; the active link gets a `./` prefix + highlight color. -->
				{@const active = page.url.pathname === item.path}
				<a
					href={item.path}
					class="no-underline {active ? 'text-term-yellow' : 'text-term-dim hover:text-term-fg'}"
				>
					{active ? './' : ''}{item.title}
				</a>
			{/each}
		</nav>
	</header>

	<main class="flex-1">
		{@render children()}
	</main>

	<!-- One wrapping row, left-aligned so it clears the fixed terminal launcher at
	     bottom-right. `term-prompt` is a decorative shell glyph (see app.css). -->
	<footer
		class="mt-10 pt-5 border-t border-term-line text-xs text-term-dim flex flex-wrap items-center gap-x-5 gap-y-2"
	>
		<ThemeSwitcher />
		<a href="/impressum" class="hover:text-term-fg no-underline">Impressum</a>
		<span><span class="term-prompt"></span>© {site.name}</span>
	</footer>
</div>

<Terminal />
