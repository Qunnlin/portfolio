<!--
	A single blog post (route: /blog/[slug]).
	`data.content` is the mdsvex-compiled markdown component; `data.meta` is its
	frontmatter (see [slug]/+page.ts). The rendered markdown lives in a child
	component, so its elements are styled below via `:global()` selectors.
-->
<script lang="ts">
	import { formatDate } from '$lib/posts';
	import { site, siteUrl } from '$lib/site';
	import { page } from '$app/state';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	// The post body is a component; keep it reactive so client-side nav between posts works.
	const Content = $derived(data.content);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: data.meta.title,
		description: data.meta.description,
		datePublished: data.meta.date,
		author: { '@type': 'Person', name: site.name },
		url: siteUrl + page.url.pathname
	});
</script>

<Seo title="{data.meta.title} — Felix Schick" description={data.meta.description} type="article" {jsonLd} />

<article class="space-y-6">
	<header class="space-y-2">
		<a href="/blog" class="term-link text-sm">$ cd ../blog</a>
		<h1 class="text-2xl font-bold text-term-fg">{data.meta.title}</h1>
		<p class="text-term-dim text-sm">
			<time datetime={data.meta.date}>{formatDate(data.meta.date)}</time>
			· {data.readingMinutes} min read
		</p>
		{#if data.meta.tags?.length}
			<p class="flex flex-wrap gap-1.5">
				{#each data.meta.tags as tag (tag)}
					<span class="text-xs text-term-accent">#{tag}</span>
				{/each}
			</p>
		{/if}
	</header>

	<div class="post">
		<Content />
	</div>
</article>

<style>
	/* The markdown renders inside a child component, so reach into it with :global().
	   Colors use the global --term-* theme variables, so posts reskin with the theme. */
	.post :global(h2) {
		margin: 1.75rem 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--term-yellow);
	}
	.post :global(h3) {
		margin: 1.25rem 0 0.5rem;
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--term-yellow);
	}
	.post :global(p) {
		margin: 0.75rem 0;
		line-height: 1.7;
		color: var(--term-fg);
	}
	.post :global(a) {
		color: var(--term-accent);
		text-underline-offset: 4px;
		text-decoration: underline;
	}
	.post :global(ul) {
		margin: 0.75rem 0;
		padding-left: 1.25rem;
		list-style: disc;
	}
	.post :global(li) {
		margin: 0.25rem 0;
		line-height: 1.6;
	}
	.post :global(strong) {
		color: var(--term-fg);
		font-weight: 700;
	}
	/* Inline code */
	.post :global(:not(pre) > code) {
		padding: 0.1em 0.35em;
		border-radius: 4px;
		background: color-mix(in srgb, var(--term-dim) 22%, transparent);
		color: var(--term-green);
		font-size: 0.9em;
	}
	/* Fenced code blocks */
	.post :global(pre) {
		margin: 1rem 0;
		padding: 1rem;
		border-radius: 8px;
		overflow-x: auto;
		background: color-mix(in srgb, var(--term-dim) 18%, transparent);
		border: 1px solid color-mix(in srgb, var(--term-dim) 30%, transparent);
	}
	.post :global(pre code) {
		background: none;
		padding: 0;
		color: var(--term-fg);
	}
	/* Syntax highlighting (mdsvex/Prism token classes), themed via --term-* vars. */
	.post :global(.token.comment),
	.post :global(.token.prolog),
	.post :global(.token.doctype),
	.post :global(.token.cdata) {
		color: var(--term-dim);
		font-style: italic;
	}
	.post :global(.token.punctuation),
	.post :global(.token.operator) {
		color: var(--term-dim);
	}
	.post :global(.token.keyword),
	.post :global(.token.boolean),
	.post :global(.token.atrule),
	.post :global(.token.tag) {
		color: var(--term-red);
	}
	.post :global(.token.string),
	.post :global(.token.char),
	.post :global(.token.attr-value),
	.post :global(.token.inserted) {
		color: var(--term-green);
	}
	.post :global(.token.function),
	.post :global(.token.class-name) {
		color: var(--term-blue);
	}
	.post :global(.token.number),
	.post :global(.token.constant),
	.post :global(.token.symbol) {
		color: var(--term-yellow);
	}
	.post :global(.token.property),
	.post :global(.token.attr-name) {
		color: var(--term-accent);
	}
</style>
