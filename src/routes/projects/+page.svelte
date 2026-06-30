<script lang="ts">
	// Projects listing (route: /projects) — a directory of project entries.
	// Data comes from $lib/content (the single source the terminal also renders),
	// so the styled page and `cd projects` in the terminal never disagree.
	import { projects } from '$lib/content';
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo title="projects — Felix Schick" description="Things Felix Schick has built." />

<section class="space-y-6">
	<h1 class="text-2xl font-bold"><span class="text-term-green">$</span> ls ./projects</h1>
	<ul class="space-y-7">
		{#each projects as p (p.slug)}
			<li>
				<div class="flex items-baseline justify-between gap-3">
					<a href="/projects/{p.slug}" class="term-link font-bold">{p.name}</a>
					{#if p.year}<span class="shrink-0 text-term-dim text-xs">{p.year}</span>{/if}
				</div>
				<ul class="mt-1.5 flex flex-wrap gap-1.5">
					{#each p.tech as t (t)}
						<li class="rounded border border-term-line px-1.5 py-0.5 text-xs text-term-accent">{t}</li>
					{/each}
				</ul>
				<p class="mt-2 text-term-dim text-sm">{p.desc}</p>
				<p class="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
					{#if p.repo}
						<a href={p.repo} target="_blank" rel="noopener noreferrer" class="term-link"
							>→ {p.repo.replace(/^https?:\/\//, '')}</a
						>
					{/if}
					{#if p.demo}
						<a href={p.demo} target="_blank" rel="noopener noreferrer" class="term-link">→ live demo</a>
					{/if}
				</p>
			</li>
		{/each}
	</ul>
</section>
