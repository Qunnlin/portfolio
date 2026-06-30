<!--
	A single project (route: /projects/[slug]). Renders the rich project data from
	$lib/content — the same data the terminal's `cat <project>` shows.
-->
<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const p = $derived(data.project);
</script>

<Seo title="{p.name} — Felix Schick" description={p.desc} />

<article class="space-y-5">
	<header class="space-y-2">
		<a href="/projects" class="term-link text-sm">$ cd ../projects</a>
		<h1 class="text-2xl font-bold text-term-fg">{p.name}</h1>
		<p class="text-term-dim text-sm">
			{#if p.year}<span>{p.year}</span>{/if}
		</p>
	</header>

	<p class="text-term-fg leading-relaxed">{p.desc}</p>

	<div>
		<span class="text-term-dim text-sm">stack</span>
		<ul class="mt-1 flex flex-wrap gap-2">
			{#each p.tech as t (t)}
				<li class="text-xs text-term-accent border border-term-line rounded px-2 py-0.5">{t}</li>
			{/each}
		</ul>
	</div>

	{#if p.repo || p.demo}
		<div class="flex flex-wrap gap-4 text-sm">
			{#if p.repo}
				<a href={p.repo} target="_blank" rel="noopener noreferrer" class="term-link">repo →</a>
			{/if}
			{#if p.demo}
				<a href={p.demo} target="_blank" rel="noopener noreferrer" class="term-link">live demo →</a>
			{/if}
		</div>
	{/if}

	{#if p.body?.length}
		<div class="space-y-3">
			{#each p.body as para, i (i)}
				<p class="text-term-dim leading-relaxed">{para}</p>
			{/each}
		</div>
	{/if}
</article>
