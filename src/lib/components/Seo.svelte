<!--
	Per-page <head> SEO: title, description, canonical, OpenGraph, Twitter Card, and
	optional JSON-LD. Each page renders one <Seo/> with its own title/description;
	the canonical/OG URL is derived from siteUrl + the current path. (og:image is
	only emitted when an `image` is passed — there's no default OG image yet.)
-->
<script lang="ts">
	import { page } from '$app/state';
	import { site, siteUrl } from '$lib/site';

	interface Props {
		title: string;
		description?: string;
		/** OpenGraph type — 'website' for pages, 'article' for posts. */
		type?: 'website' | 'article';
		/** Absolute URL to a share image (optional — omitted if not provided). */
		image?: string;
		/** Optional JSON-LD object injected as a ld+json script. */
		jsonLd?: unknown;
	}

	let { title, description = site.description, type = 'website', image, jsonLd }: Props = $props();

	const url = $derived(siteUrl + page.url.pathname);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />

	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content={site.name} />
	{#if image}
		<meta property="og:image" content={image} />
	{/if}

	<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if image}
		<meta name="twitter:image" content={image} />
	{/if}

	{#if jsonLd}
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
	{/if}
</svelte:head>
